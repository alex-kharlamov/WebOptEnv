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

import asyncio
import base64
import io
import json
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import numpy as np
from mcp import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client
from PIL import Image
from skimage.metrics import peak_signal_noise_ratio

from openenv_core.env_server.interfaces import Environment

from .bank_tools import BankManager
from .models import (
    LighthouseScores,
    VerificationScores,
    WebOptAction,
    WebOptObservation,
    WebOptState,
    WebsiteState,
)

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
        self.server_params = StdioServerParameters(
            command="node",
            args=["/app/mcp/dist/index.js" if not LOCAL else LOCAL_PATH],
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

        # Generate specification from reference screenshot
        reference_spec = self._generate_specification(screenshot)
        if reference_spec:
            print(f"Generated specification ({len(reference_spec)} chars)")
        else:
            print("Warning: Failed to generate specification")

        self._state = WebOptState(
            site=site,
            episode_id=str(uuid4()),
            step_count=0,
            performance_scores=[lighthouse_scores.performance_score],
            accessibility_scores=[lighthouse_scores.accessibility_score],
            seo_scores=[lighthouse_scores.seo_score],
            practices_scores=[lighthouse_scores.practices_score],
            project_path=project_path,
            reference_screenshot=screenshot,
            reference_spec=reference_spec,
        )

        self._reset_count += 1

        return WebOptObservation(
            site=self._state.site,
            reward=0,
            done=False,
        )

    def _zip_directory_to_base64(self, directory_path: str) -> str:
        """Zip a directory and return it as a base64 encoded string."""
        import os
        import shutil
        import tempfile

        temp_dir = tempfile.mkdtemp()
        try:
            zip_path = os.path.join(temp_dir, "project.zip")
            shutil.make_archive(os.path.join(temp_dir, "project"), "zip", directory_path)

            with open(zip_path, "rb") as f:
                zip_binary = f.read()
                return base64.b64encode(zip_binary).decode("utf-8")
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def _update_local_project_from_action(self, action: WebOptAction, project_path: str) -> None:
        """Update the local project from the action."""
        code_dict = action.site.code

        for file in code_dict:
            with open(file, "w") as f:
                f.write(code_dict[file])

    def step(self, action: WebOptAction) -> WebOptObservation:
        if isinstance(action.site, str):
            code_dict = json.loads(action.site)
            action = WebOptAction(site=WebsiteState(code=code_dict))

        project_path = self._project.path

        self._update_local_project_from_action(action, project_path)
        self._state.site = WebsiteState(code=self._project.get_state())

        zip_base64 = self._zip_directory_to_base64(project_path)

        lighthouse_scores, screenshot = self._get_lighthouse_scores(zip_base64)
        verification_scores = self._run_verification_audit(screenshot)
        print("Verification scores:", verification_scores)

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

        # PSNR score normalized to [0, 1]
        psnr_score = verification.psnr_score / 100

        # Specification score is already [0, 1]
        spec_score = verification.specification_score

        # Combined visual fidelity: both PSNR and specification must be good
        visual_fidelity = psnr_score * spec_score

        reward = np.mean([
            scores.performance_score - prev_performance_score,
            scores.accessibility_score - prev_accessibility_score,
            scores.seo_score - prev_seo_score,
            scores.practices_score - prev_practices_score,
        ])

        reward = reward * visual_fidelity

        return reward

    @property
    def state(self) -> WebOptState:
        """
        Get the current environment state.

        Returns:
            Current WebOptState with all tracking information
        """
        return self._state

    def _generate_specification(self, screenshot: Image.Image | None) -> str | None:
        """
        Generate specification from reference screenshot using Anthropic LLM.

        Args:
            screenshot: PIL Image of the reference webpage

        Returns:
            Specification text with rubriques for scoring, or None if failed
        """
        if screenshot is None:
            return None

        async def run_async():
            from src.generate_and_score import generate_spec

            # Convert PIL Image to PNG bytes
            buffer = io.BytesIO()
            screenshot.save(buffer, format="PNG")
            image_bytes = buffer.getvalue()

            return await generate_spec(image_bytes)

        try:
            loop = asyncio.get_running_loop()
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(asyncio.run, run_async())
                return future.result()
        except RuntimeError:
            return asyncio.run(run_async())

    def _score_against_specification(self, screenshot: Image.Image | None) -> float:
        """
        Score screenshot against the reference specification.

        Args:
            screenshot: PIL Image of the candidate webpage

        Returns:
            Normalized score [0, 1] representing how well the candidate matches the spec
        """
        if screenshot is None or not self._state.reference_spec:
            return 0.0

        async def run_async():
            from src.generate_and_score import score_candidate

            # Convert PIL Image to PNG bytes
            buffer = io.BytesIO()
            screenshot.save(buffer, format="PNG")
            candidate_bytes = buffer.getvalue()

            result = await score_candidate(candidate_bytes, self._state.reference_spec)
            if result is None:
                return 0.0

            # Normalize: total_score / number_of_criteria
            if len(result.criteria) == 0:
                return 0.0
            return result.total_score / len(result.criteria)

        try:
            loop = asyncio.get_running_loop()
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(asyncio.run, run_async())
                return future.result()
        except RuntimeError:
            return asyncio.run(run_async())

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

                    await session.call_tool(
                        "deploy_zip",
                        arguments={
                            "zip_content": zip_base64,
                            "port": 8080,
                        },
                    )

                    audit_result = await session.call_tool(
                        "audit_with_lighthouse",
                        arguments={},
                    )

                    screenshot = await session.call_tool(
                        "capture_screenshot",
                        arguments={
                            "url": "http://localhost:8080",
                            "width": 1280,
                            "height": 800,
                        },
                    )
                    screenshot_text = screenshot.content[0].text
                    screenshot_result = json.loads(screenshot_text)["screenshot"]
                    image_data = screenshot_result.replace("data:image/png;base64,", "")

                    png_bytes = base64.b64decode(image_data)
                    buffer = io.BytesIO(png_bytes)
                    screenshot_img = Image.open(buffer)

                    if audit_result and audit_result.content:
                        content_text = audit_result.content[0].text
                        result = json.loads(content_text)
                        result["screenshot"] = screenshot_img
                        return result
                    return {}

        try:
            loop = asyncio.get_running_loop()
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(asyncio.run, run_async())
                return future.result()
        except RuntimeError:
            return asyncio.run(run_async())

    def _get_lighthouse_scores(self, zip_base64: str) -> tuple[LighthouseScores, Image.Image | None]:
        """Get Lighthouse scores for the given site.

        Args:
            zip_base64: Base64 encoded zip content of the project

        Returns:
            Tuple of LighthouseScores and screenshot Image
        """
        try:
            audit_result = self._run_lighthouse_audit(zip_base64)
            print(audit_result)

            if audit_result.get("success"):
                scores = audit_result.get("audit", {}).get("scores", {})
                return (
                    LighthouseScores(
                        performance_score=scores.get("performance", {}).get("score", 0),
                        accessibility_score=scores.get("accessibility", {}).get("score", 0),
                        seo_score=scores.get("seo", {}).get("score", 0),
                        practices_score=scores.get("best-practices", {}).get("score", 0),
                    ),
                    audit_result["screenshot"],
                )
        except Exception as e:
            print(f"Error running Lighthouse audit: {e}")

        return (
            LighthouseScores(
                performance_score=0,
                accessibility_score=0,
                seo_score=0,
                practices_score=0,
            ),
            None,
        )

    def _run_verification_audit(self, new_screenshot: Image.Image | None) -> VerificationScores:
        """Run verification audit comparing new screenshot to reference."""

        def psnr(screen, reference):
            if screen is None or reference is None:
                return 0
            psnr_score = peak_signal_noise_ratio(
                np.array(screen.resize(reference.size)),
                np.array(reference),
            )
            psnr_score = np.clip(psnr_score, 0, 100)
            return psnr_score

        psnr_val = psnr(new_screenshot, self._state.reference_screenshot)
        spec_score = self._score_against_specification(new_screenshot)

        return VerificationScores(
            psnr_score=psnr_val,
            isomorphism_score=0,
            specification_score=spec_score,
        )