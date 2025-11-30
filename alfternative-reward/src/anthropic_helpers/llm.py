"""Async Anthropic LLM helper functions with retry logic."""

import base64
import os
from typing import TypeVar

import anthropic
from pydantic import BaseModel
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential_jitter,
)

MODEL = "claude-sonnet-4-5"

RETRIABLE_EXCEPTIONS = (
    anthropic.RateLimitError,
    anthropic.APIConnectionError,
    anthropic.InternalServerError,
)

T = TypeVar("T", bound=BaseModel)

_client: anthropic.AsyncAnthropic | None = None


def get_client() -> anthropic.AsyncAnthropic:
    """Get or create the async Anthropic client."""
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        _client = anthropic.AsyncAnthropic(api_key=api_key)
    return _client


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential_jitter(initial=1, max=10),
    retry=retry_if_exception_type(RETRIABLE_EXCEPTIONS),
)
async def anthropic_completion(messages: list[dict]) -> str | None:
    """
    Make an async completion call to Claude with retry logic.

    Args:
        messages: List of message dicts with 'role' and 'content' keys

    Returns:
        The text content of the response, or None if empty
    """
    client = get_client()
    response = await client.messages.create(
        model=MODEL,
        max_tokens=1000,
        messages=messages,
    )
    if response.content and response.content[0].type == "text":
        return response.content[0].text
    return None


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential_jitter(initial=1, max=10),
    retry=retry_if_exception_type(RETRIABLE_EXCEPTIONS),
)
async def anthropic_struct_completion(
    messages: list[dict],
    output_format: type[T],
) -> T | None:
    """
    Make an async completion call that returns structured output.

    Args:
        messages: List of message dicts
        output_format: A Pydantic BaseModel class defining the output structure

    Returns:
        Parsed output as the specified Pydantic model, or None
    """
    client = get_client()
    response = await client.beta.messages.parse(
        model=MODEL,
        betas=["structured-outputs-2025-11-13"],
        max_tokens=1024,
        messages=messages,
        output_format=output_format,
    )
    return response.parsed_output


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential_jitter(initial=1, max=10),
    retry=retry_if_exception_type(RETRIABLE_EXCEPTIONS),
)
async def anthropic_multi_completion(
    prompt_sys: str | None = None,
    prompt_user: str | None = None,
    images: list[bytes] | None = None,
) -> str | None:
    """
    Make an async completion with optional system prompt, user prompt, and images.

    Args:
        prompt_sys: Optional system prompt
        prompt_user: Optional user prompt text
        images: Optional list of PNG image bytes (raw bytes, not base64)

    Returns:
        The text content of the response, or None
    """
    client = get_client()

    content_blocks: list[dict] = []

    if images:
        for img_bytes in images:
            img_b64 = base64.b64encode(img_bytes).decode("utf-8")
            content_blocks.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": img_b64,
                },
            })

    if prompt_user:
        content_blocks.append({
            "type": "text",
            "text": prompt_user,
        })

    if not content_blocks:
        return None

    messages = [{"role": "user", "content": content_blocks}]

    kwargs: dict = {
        "model": MODEL,
        "max_tokens": 1000,
        "messages": messages,
    }

    if prompt_sys:
        kwargs["system"] = prompt_sys

    response = await client.messages.create(**kwargs)

    if response.content and response.content[0].type == "text":
        return response.content[0].text
    return None