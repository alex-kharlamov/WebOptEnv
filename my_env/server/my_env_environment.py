# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.

"""
My Env Environment Implementation.

A simple test environment that echoes back messages sent to it.
Perfect for testing HTTP server infrastructure.
"""

import json
from uuid import uuid4

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from openenv_core.env_server.interfaces import Environment

from models import MyAction, MyObservation, MyState, WebsiteState


class MyEnvironment(Environment):
    """
    A simple echo environment that echoes back messages.

    This environment is designed for testing the HTTP server infrastructure.
    It maintains minimal state and simply echoes back whatever message it receives.

    Example:
        >>> env = MyEnvironment()
        >>> obs = env.reset()
        >>> print(obs.echoed_message)  # "My Env environment ready!"
        >>>
        >>> obs = env.step(MyAction(message="Hello"))
        >>> print(obs.echoed_message)  # "Hello"
        >>> print(obs.message_length)  # 5
    """

    def __init__(self):
        """Initialize the my_env environment."""
        # Configure MCP server parameters for Lighthouse
        self.server_params = StdioServerParameters(
            command="node",
            args=["/app/mcp/dist/index.js"]
        )
        self._state = MyState(
            episode_id=str(uuid4()),
            step_count=0,
            site=WebsiteState(episode_id=str(uuid4()), step_count=0, code={}),
            performance_scores=[],
            accessibility_scores=[],
            seo_scores=[],
            practices_scores=[]
        )
        self._reset_count = 0

    def reset(self) -> MyObservation:
        """
        Reset the environment.

        Returns:
            MyObservation with initial state
        """
        site = WebsiteState(code="")
        lighthouse_scores = self._get_lighthouse_scores(site)

        self._state = MyState(site=site, episode_id=str(uuid4()), step_count=0,
         performance_scores=[lighthouse_scores.performance_score],
         accessibility_scores=[lighthouse_scores.accessibility_score],
         seo_scores=[lighthouse_scores.seo_score],
          practices_scores=[lighthouse_scores.practices_score])

        self._reset_count += 1

        return MyObservation(
            site=self._state.site,
            reward=0,
            done=False,

        )

    def step(self, action: MyAction) -> MyObservation:  # type: ignore[override]
        # Get the code dict from the action's site state
        code_dict = action.site.code

        # Extract HTML content from the code dict
        html_content = ""
        if "index.html" in code_dict:
            html_content = code_dict["index.html"]

        # Update state with the new code
        self._state.site.code = code_dict

        # Call MCP lighthouse audit using SDK
        reward = 0.0
        if html_content:
            try:
                import asyncio

                async def run_lighthouse_audit():
                    async with stdio_client(self.server_params) as (read, write):
                        async with ClientSession(read, write) as session:
                            await session.initialize()

                            # First, serve the HTML
                            serve_result = await session.call_tool(
                                "serve_html",
                                arguments={
                                    "html_content": html_content,
                                    "filename": "index.html"
                                }
                            )

                            # Then run lighthouse audit for all categories
                            audit_result = await session.call_tool(
                                "audit_with_lighthouse",
                                arguments={}
                            )

                            return audit_result

                # Run the async function
                audit_result = asyncio.run(run_lighthouse_audit())

                # Parse the lighthouse response to extract all scores
                if audit_result and audit_result.content:
                    try:
                        # Extract text from the first content item
                        content_text = audit_result.content[0].text
                        audit_json = json.loads(content_text)

                        if audit_json.get("success"):
                            scores = audit_json["audit"]["scores"]

                            # Extract all scores
                            performance_score = scores.get("performance", {}).get("score", 0)
                            accessibility_score = scores.get("accessibility", {}).get("score", 0)
                            seo_score = scores.get("seo", {}).get("score", 0)
                            practices_score = scores.get("best-practices", {}).get("score", 0)

                            # Update state with all scores
                            self._state.performance_scores.append(performance_score)
                            self._state.accessibility_scores.append(accessibility_score)
                            self._state.seo_scores.append(seo_score)
                            self._state.practices_scores.append(practices_score)

                            # Use performance score as primary reward
                            reward = float(performance_score)

                    except (json.JSONDecodeError, KeyError, ValueError, TypeError, AttributeError):
                        reward = 0.0

            except Exception:
                pass

        self._state.step_count += 1

        return MyObservation(
            site=self._state.site,
            done=False,
            reward=reward,
        )

    @property
    def state(self) -> MyState:
        """
        Get the current environment state.

        Returns:
            Current MyState with all tracking information
        """
        return self._state

    def _get_lighthouse_scores(self, site: WebsiteState) -> LighthouseScores:

        # TODO: hellsquirrel Implement Lighthouse scores
        return LighthouseScores(
            performance_score=0,
            accessibility_score=0,
            seo_score=0,
            practices_score=0,
        )
