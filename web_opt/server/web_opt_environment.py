# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.

"""
WebOpt Environment Implementation.

A web optimization environment that uses Lighthouse audits.
Perfect for testing web performance optimization.
"""

import json
from uuid import uuid4
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Tuple

from networkx import isomorphism

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp import ClientSession
from mcp.client.stdio import StdioServerParameters
from io import BytesIO
from PIL import Image
import base64
from skimage.metrics import peak_signal_noise_ratio
import numpy as np

from openenv_core.env_server.interfaces import Environment

from ..models import WebOptAction, WebOptObservation, WebOptState, WebsiteState, LighthouseScores, VerificationScores
from .bank_tools import BankManager

LOCAL = False

LOCAL_PATH = "/Users/axcel/Documents/IterateHackathon/WebOptEnv/web_opt/lighthouse/dist/index.js"


class WebOptEnvironment(Environment):
    """
    A web optimization environment using Lighthouse audits.

    This environment is designed for optimizing web performance.
    It maintains state of Lighthouse scores across optimization steps.

    Example:
        >>> env = WebOptEnvironment()
        >>> obs = env.reset()
        >>> obs = env.step(WebOptAction(site=WebsiteState(code={"/index.html": "..."})))
    """

    def __init__(self):
        """Initialize the web_opt environment."""
        # Configure MCP server parameters for Lighthouse
        self.server_params = StdioServerParameters(
            command="node",
            args=["/app/mcp/dist/index.js" if not LOCAL else LOCAL_PATH]
        )
        self._state = None
        self._reset_count = -1
        self._bank_manager = BankManager()
        self._project = None
        self.reset()

    def reset(self) -> WebOptObservation:
        """
        Reset the environment.

        Returns:
            WebOptObservation with initial state
        """
        self._project = self._bank_manager.sample_project()
        project_path = self._project.path
        print(f"Temporal project path: {project_path}")

        site = WebsiteState(code=self._project.get_state())

        # Zip the project directory and get base64 encoded string
        zip_base64 = self._zip_directory_to_base64(project_path)

        # Get Lighthouse scores using the zipped project
        lighthouse_scores, screenshot = self._get_lighthouse_scores(zip_base64)

        self._state = WebOptState(
            site=site,
            episode_id=str(uuid4()),
            step_count=0,
            performance_scores=[lighthouse_scores.performance_score],
            accessibility_scores=[lighthouse_scores.accessibility_score],
            seo_scores=[lighthouse_scores.seo_score],
            practices_scores=[lighthouse_scores.practices_score],
            project_path=project_path,
            reference_screenshot=screenshot
        )

        self._reset_count += 1

        return WebOptObservation(
            site=self._state.site,
            reward=0,
            done=False,
        )

    def _zip_directory_to_base64(self, directory_path: str) -> str:
        """Zip a directory and return it as a base64 encoded string."""
        import base64
        import os
        import tempfile
        import shutil
        from pathlib import Path

        # Create a temporary file to store the zip
        temp_dir = tempfile.mkdtemp()
        try:
            zip_path = os.path.join(temp_dir, 'project.zip')

            # Create a zip file
            shutil.make_archive(os.path.join(temp_dir, 'project'), 'zip', directory_path)

            # Read the zip file as binary and encode as base64
            with open(zip_path, 'rb') as f:
                zip_binary = f.read()
                return base64.b64encode(zip_binary).decode('utf-8')
        finally:
            # Clean up the temporary directory
            shutil.rmtree(temp_dir, ignore_errors=True)

    def _update_local_project_from_action(self, action: WebOptAction, project_path: str) -> None:
        """Update the local project from the action."""

        # Get the code dict from the action's site state
        code_dict = action.site.code

        for file in code_dict:
            with open(file, 'w') as f:
                f.write(code_dict[file])

    def step(self, action: WebOptAction) -> WebOptObservation:  # type: ignore[override]
        if isinstance(action.site, str):
            code_dict = json.loads(action.site)
            action = WebOptAction(site=WebsiteState(code=code_dict))

        # Get the project path from state
        project_path = self._project.path

        # Update the local project from the action
        self._update_local_project_from_action(action, project_path)
        self._state.site = WebsiteState(code=self._project.get_state())

        # Zip the project directory and get base64 encoded string
        zip_base64 = self._zip_directory_to_base64(project_path)

        # Get Lighthouse scores
        lighthouse_scores, screenshot = self._get_lighthouse_scores(zip_base64)
        verification_scores = self._run_verification_audit(screenshot)
        print("Verification scores:", verification_scores)

        # Use performance score as primary reward
        reward = self._estimate_reward(lighthouse_scores, verification_scores)

        self._state.performance_scores.append(lighthouse_scores.performance_score)
        self._state.accessibility_scores.append(lighthouse_scores.accessibility_score)
        self._state.seo_scores.append(lighthouse_scores.seo_score)
        self._state.practices_scores.append(lighthouse_scores.practices_score)

        self._state.step_count += 1

        return WebOptObservation(
            site=self._state.site,
            done=True,
            reward=reward,
        )

    def _estimate_reward(self, scores: LighthouseScores, verification: VerificationScores) -> float:
        """Estimate the reward based on the Lighthouse scores."""

        prev_accessibility_score = self._state.accessibility_scores[-1]
        prev_seo_score = self._state.seo_scores[-1]
        prev_practices_score = self._state.practices_scores[-1]
        prev_performance_score = self._state.performance_scores[-1]

        psnr_score = verification.psnr_score / 100 # [0, 100] where 100 means ideal match -> [0, 1]

        reward = np.mean([
            scores.performance_score - prev_performance_score,
            scores.accessibility_score - prev_accessibility_score,
            scores.seo_score - prev_seo_score,
            scores.practices_score - prev_practices_score
        ])

        reward = reward * psnr_score

        return reward

    @property
    def state(self) -> WebOptState:
        """
        Get the current environment state.

        Returns:
            Current WebOptState with all tracking information
        """
        return self._state


    async def _capture_screenshot(url='http://localhost:8080'):
        server = StdioServerParameters(
            command="npx",
            args=["-y", "@automatalabs/mcp-server-playwright"]
        )

        async with stdio_client(server) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()

                # Navigate to a webpage
                await session.call_tool(
                    "browser_navigate",
                    arguments={"url": url}
                )
                # Take screenshot
                screenshot = await session.call_tool(
                    "browser_screenshot",
                    arguments={
                        "fullPage": True
                    }
                )
                png_bytes = base64.b64decode(screenshot.content[1].data)
                buffer = BytesIO(png_bytes)
                img = Image.open(buffer)
                return img

    def _run_lighthouse_audit(self, zip_base64: str) -> dict:
        """Run Lighthouse audit on the deployed zip.

        Args:
            zip_base64: Base64 encoded zip content of the project

        Returns:
            Dictionary containing the audit scores
        """
        async def run_async():
            async with stdio_client(self.server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()

                    # Deploy the zipped project
                    deploy_result = await session.call_tool(
                        "deploy_zip",
                        arguments={
                            "zip_content": zip_base64,
                            "port": 8080  # Default port, adjust as needed
                        }
                    )

                    # Run lighthouse audit for all categories
                    audit_result = await session.call_tool(
                        "audit_with_lighthouse",
                        arguments={}
                    )

                    screenshot = await session.call_tool(
                        "capture_screenshot",
                        arguments={
                            "url": "http://localhost:8080",
                            "width": 1280,
                            "height": 800
                        }
                    )
                    screenshot_text = screenshot.content[0].text
                    screenshot_result = json.loads(screenshot_text)['screenshot']
                    image_data = screenshot_result.replace('data:image/png;base64,','')

                    png_bytes = base64.b64decode(image_data)
                    buffer = BytesIO(png_bytes)
                    screenshot = Image.open(buffer)

                    if audit_result and audit_result.content:
                        content_text = audit_result.content[0].text
                        result = json.loads(content_text)
                        result['screenshot'] = screenshot
                        return result
                    return {}

        # Check if we're already in an event loop
        try:
            loop = asyncio.get_running_loop()
            # If we're in a running loop, use a new thread to run the async code
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(asyncio.run, run_async())
                return future.result()
        except RuntimeError:  # No event loop running
            return asyncio.run(run_async())

    def _get_lighthouse_scores(self, zip_base64: str) -> Tuple[LighthouseScores, Image]:
        """Get Lighthouse scores for the given site.

        Args:
            zip_base64: Base64 encoded zip content of the project

        Returns:
            LighthouseScores object with the audit scores
        """
        try:
            # Now _run_lighthouse_audit is synchronous
            audit_result = self._run_lighthouse_audit(zip_base64)
            print(audit_result)

            if audit_result.get("success"):
                scores = audit_result.get("audit", {}).get("scores", {})
                return LighthouseScores(
                    performance_score=scores.get("performance", {}).get("score", 0),
                    accessibility_score=scores.get("accessibility", {}).get("score", 0),
                    seo_score=scores.get("seo", {}).get("score", 0),
                    practices_score=scores.get("best-practices", {}).get("score", 0)
                ), audit_result['screenshot']
        except Exception as e:
            print(f"Error running Lighthouse audit: {e}")

        # Return default scores if audit fails
        return LighthouseScores(
            performance_score=0,
            accessibility_score=0,
            seo_score=0,
            practices_score=0
        ), None


    def _run_verification_audit(self, new_screenshot: Image) -> VerificationScores:
        """Run Verification audit on the deployed zip."""

        def psnr(screen, reference):
            # Returns PSNR score between two images clipped to [0, 100] range
            if screen is None or reference is None:
                return 0

            psnr_score = peak_signal_noise_ratio(np.array(screen.resize(reference.size)), np.array(reference))
            psnr_score = np.clip(psnr_score, 0, 100)
            return psnr_score

        return VerificationScores(
            psnr_score=psnr(new_screenshot, self.state.reference_screenshot),
            isomorphism_score=0
        )


