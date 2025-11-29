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
import subprocess
from uuid import uuid4

from openenv_core.env_server.interfaces import Environment
from openenv_core.env_server.types import State

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
        self._state = State(episode_id=str(uuid4()), step_count=0)
        self._reset_count = 0

    def reset(self) -> MyObservation:
        """
        Reset the environment.

        Returns:
            MyObservation with a ready message
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
        code = action.code

        # Parse the JSON string to get HTML content
        html_content = ""
        message = "No HTML content"

        try:
            parsed_data = json.loads(code)
            # Search for "index.html" key
            if "index.html" in parsed_data:
                html_content = parsed_data["index.html"]
                message = "Found index.html in JSON"
            else:
                message = "index.html key not found in JSON"
        except json.JSONDecodeError as e:
            message = f"Invalid JSON format: {str(e)}"

        # Call MCP lighthouse audit and extract performance score
        reward = 0.0
        if html_content:
            try:
                # First, serve the HTML
                serve_result = subprocess.run(
                    ["node", "/app/mcp/dist/index.js"],
                    input=json.dumps({
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "tools/call",
                        "params": {
                            "name": "serve_html",
                            "arguments": {
                                "html_content": html_content,
                                "filename": "index.html"
                            }
                        }
                    }),
                    capture_output=True,
                    text=True,
                    timeout=10
                )

                # Then run lighthouse audit
                audit_result = subprocess.run(
                    ["node", "/app/mcp/dist/index.js"],
                    input=json.dumps({
                        "jsonrpc": "2.0",
                        "id": 2,
                        "method": "tools/call",
                        "params": {
                            "name": "audit_with_lighthouse",
                            "arguments": {
                                "categories": ["performance"]
                            }
                        }
                    }),
                    capture_output=True,
                    text=True,
                    timeout=30
                )

                # Parse the lighthouse response to extract performance score
                if audit_result.returncode == 0:
                    try:
                        # The MCP server returns JSON-RPC response
                        response = json.loads(audit_result.stdout)

                        # Extract the result content
                        if "result" in response and "content" in response["result"]:
                            content_list = response["result"]["content"]
                            if content_list and len(content_list) > 0:
                                # Parse the text content which contains the audit results
                                audit_json = json.loads(content_list[0]["text"])

                                if audit_json.get("success"):
                                    # Extract performance score from the audit results
                                    performance_score = audit_json["audit"]["scores"]["performance"]["score"]
                                    reward = float(performance_score)
                                    message = f"Lighthouse audit completed - Performance score: {performance_score}/100"
                                else:
                                    message = f"Audit failed: {audit_json.get('error', 'Unknown error')}"
                                    reward = 0.0
                        else:
                            # Direct JSON response (tool output format)
                            if "success" in response and response["success"]:
                                performance_score = response["audit"]["scores"]["performance"]["score"]
                                reward = float(performance_score)
                                message = f"Lighthouse audit completed - Performance score: {performance_score}/100"
                            else:
                                message = "Unexpected response format"
                                reward = 0.0

                    except (json.JSONDecodeError, KeyError, ValueError, TypeError) as e:
                        message = f"Failed to parse lighthouse results: {str(e)}"
                        reward = 0.0
                else:
                    message = f"MCP audit call failed: {audit_result.stderr}"
                    reward = 0.0

            except subprocess.TimeoutExpired:
                message = "MCP call timeout"
            except Exception as e:
                message = f"Error calling MCP: {str(e)}"

        length = len(html_content)
        self._state.step_count += 1

        return MyObservation(
            echoed_message=message,
            message_length=length,
            done=False,
            reward=reward,
            metadata={
                "original_message": message,
                "step": self._state.step_count,
                "html_length": length,
                "performance_score": reward
            },
        )

    @property
    def state(self) -> State:
        """
        Get the current environment state.

        Returns:
            Current State with episode_id and step_count
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
