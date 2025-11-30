# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.

"""
Data models for the WebOpt Environment.

The web_opt environment is a web optimization environment that uses Lighthouse audits.
"""

from dataclasses import dataclass

from openenv_core.env_server.types import Action, Observation, State
from PIL import Image

@dataclass(kw_only=True)
class WebsiteState(State):
    code: dict


@dataclass(kw_only=True)
class WebOptAction(Action):
    site: WebsiteState


@dataclass(kw_only=True)
class WebOptObservation(Observation):
    site: WebsiteState

    reward: float
    done: bool


@dataclass(kw_only=True)
class WebOptState(State):
    site: WebsiteState
    project_path: str
    reference_screenshot: Image

    performance_scores: list
    accessibility_scores: list
    seo_scores: list
    practices_scores: list

@dataclass(kw_only=True)
class LighthouseScores:
    performance_score: float
    accessibility_score: float
    seo_score: float
    practices_score: float


@dataclass(kw_only=True)
class VerificationScores:
    psnr_score: float
    isomorphism_score: float

