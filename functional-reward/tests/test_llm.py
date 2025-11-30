"""Tests for Anthropic LLM helper functions."""

import io
import sys
from pathlib import Path

import pytest
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from anthropic_helpers import (
    anthropic_completion,
    anthropic_multi_completion,
    anthropic_struct_completion,
)


class MathResult(BaseModel):
    """Pydantic model for structured math output."""

    result_number: int
    result_text: str


def create_solid_color_png(r: int, g: int, b: int, size: int = 100) -> bytes:
    """Create a solid color PNG image programmatically without external dependencies."""
    import struct
    import zlib

    width = height = size

    def png_chunk(chunk_type: bytes, data: bytes) -> bytes:
        chunk_len = struct.pack(">I", len(data))
        chunk_crc = struct.pack(">I", zlib.crc32(chunk_type + data) & 0xFFFFFFFF)
        return chunk_len + chunk_type + data + chunk_crc

    # PNG signature
    signature = b"\x89PNG\r\n\x1a\n"

    # IHDR chunk
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    ihdr = png_chunk(b"IHDR", ihdr_data)

    # IDAT chunk (image data)
    raw_data = b""
    for _ in range(height):
        raw_data += b"\x00"  # filter byte
        raw_data += bytes([r, g, b]) * width
    compressed = zlib.compress(raw_data, 9)
    idat = png_chunk(b"IDAT", compressed)

    # IEND chunk
    iend = png_chunk(b"IEND", b"")

    return signature + ihdr + idat + iend


@pytest.mark.asyncio
async def test_simple_completion():
    """Test basic completion with simple math question."""
    messages = [{"role": "user", "content": "What is 2+2? Reply with just the number."}]
    result = await anthropic_completion(messages)
    assert result is not None
    assert "4" in result


@pytest.mark.asyncio
async def test_structured_completion():
    """Test structured output with math calculation."""
    messages = [{
        "role": "user",
        "content": (
            "What is 5*2? Return the result as a number and as text. "
            "For example, if the answer were 3, you would return result_number=3 and result_text='three'."
        ),
    }]
    result = await anthropic_struct_completion(messages, MathResult)
    assert result is not None
    assert result.result_number == 10
    assert result.result_text.lower() == "ten"


@pytest.mark.asyncio
async def test_image_description():
    """Test image input with description request."""
    png_blue = create_solid_color_png(0, 0, 255)  # Blue
    png_red = create_solid_color_png(255, 0, 0)   # Red

    result = await anthropic_multi_completion(
        prompt_user="Describe these two images in one sentence (max 10 words). What colors do you see?",
        images=[png_blue, png_red],
    )
    assert result is not None
    result_lower = result.lower()
    assert any(word in result_lower for word in ["blue", "red", "square", "color", "solid"])