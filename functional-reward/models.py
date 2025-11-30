"""Data models for WebOpt Environment."""

from typing import Any

from PIL import Image
from pydantic import BaseModel


class WebsiteState(BaseModel):
    """State of the website code."""

    code: dict[str, str]

    class Config:
        arbitrary_types_allowed = True


class LighthouseScores(BaseModel):
    """Lighthouse audit scores."""

    performance_score: float
    accessibility_score: float
    seo_score: float
    practices_score: float


class VerificationScores(BaseModel):
    """Verification audit scores."""

    psnr_score: float
    isomorphism_score: float
    specification_score: float  # Score from rubrique evaluation [0, 1]


class WebOptState(BaseModel):
    """State of the WebOpt environment."""

    site: WebsiteState
    episode_id: str
    step_count: int
    performance_scores: list[float]
    accessibility_scores: list[float]
    seo_scores: list[float]
    practices_scores: list[float]
    project_path: str
    reference_screenshot: Any | None = None  # PIL Image
    reference_spec: str | None = None  # Generated specification text

    class Config:
        arbitrary_types_allowed = True


class WebOptAction(BaseModel):
    """Action to take in the environment."""

    site: WebsiteState | str  # Can be WebsiteState or JSON string

    class Config:
        arbitrary_types_allowed = True


class WebOptObservation(BaseModel):
    """Observation returned from the environment."""

    site: WebsiteState
    reward: float
    done: bool

    class Config:
        arbitrary_types_allowed = True