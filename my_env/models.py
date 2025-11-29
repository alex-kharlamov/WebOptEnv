# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.

"""
Data models for the My Env Environment.

The my_env environment is a simple test environment that echoes back messages.
"""

from dataclasses import dataclass

from openenv_core.env_server.types import Action, Observation, State

@dataclass(kw_only=True)
class WebsiteState(State):
    code: dict


@dataclass(kw_only=True)
class MyAction(Action):
    """Action for the My Env environment - just a message to echo."""
    site: WebsiteState


@dataclass(kw_only=True)
class MyObservation(Observation):
    site: WebsiteState

    reward: float
    done: bool


@dataclass(kw_only=True)
class MyState(State):
    site: WebsiteState
    project_path: str

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
