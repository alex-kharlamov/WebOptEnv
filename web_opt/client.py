# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.

"""
WebOpt Environment HTTP Client.

This module provides the client for connecting to a WebOpt Environment server
over HTTP.
"""

from typing import Any, Dict, Optional
from io import BytesIO
import base64
from PIL import Image

from openenv_core.client_types import StepResult
from openenv_core.env_server.types import State
from openenv_core.http_env_client import HTTPEnvClient

from .models import WebOptAction, WebOptObservation, WebsiteState, WebOptState


class WebOptEnv(HTTPEnvClient[WebOptAction, WebOptObservation]):
    """
    HTTP client for the WebOpt Environment.

    This client connects to a WebOptEnvironment HTTP server and provides
    methods to interact with it: reset(), step(), and state access.

    Example:
        >>> # Connect to a running server
        >>> client = WebOptEnv(base_url="http://localhost:8000")
        >>> result = client.reset()
        >>> print(result.observation.echoed_message)
        >>>
        >>> # Send a message
        >>> result = client.step(WebOptAction(message="Hello!"))
        >>> print(result.observation.echoed_message)
        >>> print(result.reward)

    Example with Docker:
        >>> # Automatically start container and connect
        >>> client = WebOptEnv.from_docker_image("web_opt-env:latest")
        >>> result = client.reset()
        >>> result = client.step(WebOptAction(message="Test"))
    """

    def __init__(
        self,
        base_url: str,
        request_timeout_s: float = 120.0,
        default_headers: Optional[Dict[str, str]] = None,
        provider: Optional["ContainerProvider"] = None,
    ):
        super().__init__(base_url, request_timeout_s, default_headers, provider)

    def _step_payload(self, action: WebOptAction) -> Dict:
        """
        Convert WebOptAction to JSON payload for step request.

        Args:
            action: WebOptAction instance containing the website state

        Returns:
            Dictionary representation suitable for JSON encoding
        """
        return {
            "site": {
                "code": action.site.code,
                "episode_id": action.site.episode_id,
                "step_count": action.site.step_count
            }
        }

    def _parse_result(self, payload: Dict) -> StepResult[WebOptObservation]:
        """
        Parse server response into StepResult[WebOptObservation].

        Args:
            payload: JSON response from server

        Returns:
            StepResult with WebOptObservation
        """
        obs_data = payload.get("observation", {})
        site_data = obs_data.get("site", {})
        
        # Handle the website state
        site = WebsiteState(
            code=site_data.get("code", {}),
            episode_id=site_data.get("episode_id"),
            step_count=site_data.get("step_count", 0)
        )

        # Create the observation
        observation = WebOptObservation(
            site=site,
            reward=payload.get("reward", 0.0),
            done=payload.get("done", False)
        )

        return StepResult(
            observation=observation,
            reward=payload.get("reward", 0.0),
            done=payload.get("done", False),
        )

    def _parse_state(self, payload: Dict) -> State:
        """
        Parse server response into State object.

        Args:
            payload: JSON response from /state endpoint

        Returns:
            WebOptState object with website state and metrics
        """
        site_data = payload.get("site", {})
        site = WebsiteState(
            code=site_data.get("code", {}),
            episode_id=site_data.get("episode_id"),
            step_count=site_data.get("step_count", 0)
        )
        
        # Convert base64 screenshot back to Image if it exists
        screenshot_data = payload.get("reference_screenshot")
        screenshot = None
        if screenshot_data:
            screenshot = Image.open(BytesIO(base64.b64decode(screenshot_data)))
        
        return WebOptState(
            site=site,
            episode_id=payload.get("episode_id"),
            step_count=payload.get("step_count", 0),
            project_path=payload.get("project_path", ""),
            reference_screenshot=screenshot,
            performance_scores=payload.get("performance_scores", []),
            accessibility_scores=payload.get("accessibility_scores", []),
            seo_scores=payload.get("seo_scores", []),
            practices_scores=payload.get("practices_scores", [])
        )