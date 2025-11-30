"""Example usage of Anthropic LLM helper functions."""

import asyncio
import sys
from pathlib import Path

from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from anthropic_helpers import (
    anthropic_completion,
    anthropic_multi_completion,
    anthropic_struct_completion,
)


class SearchSuggestion(BaseModel):
    """Structured output for search suggestions."""

    topic: str
    suggested_queries: list[str]
    reasoning: str


def create_solid_color_png(r: int, g: int, b: int, size: int = 100) -> bytes:
    """Create a solid color PNG image programmatically."""
    import struct
    import zlib

    width = height = size

    def png_chunk(chunk_type: bytes, data: bytes) -> bytes:
        chunk_len = struct.pack(">I", len(data))
        chunk_crc = struct.pack(">I", zlib.crc32(chunk_type + data) & 0xFFFFFFFF)
        return chunk_len + chunk_type + data + chunk_crc

    signature = b"\x89PNG\r\n\x1a\n"
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    ihdr = png_chunk(b"IHDR", ihdr_data)

    raw_data = b""
    for _ in range(height):
        raw_data += b"\x00"
        raw_data += bytes([r, g, b]) * width
    compressed = zlib.compress(raw_data, 9)
    idat = png_chunk(b"IDAT", compressed)
    iend = png_chunk(b"IEND", b"")

    return signature + ihdr + idat + iend


async def demo_basic_completion():
    """Demonstrate basic completion."""
    print("=" * 60)
    print("Demo: Basic Completion")
    print("=" * 60)

    messages = [{
        "role": "user",
        "content": "What should I search for to find the latest developments in renewable energy?",
    }]

    result = await anthropic_completion(messages)
    print(f"Response:\n{result}\n")


async def demo_structured_completion():
    """Demonstrate structured output completion."""
    print("=" * 60)
    print("Demo: Structured Output Completion")
    print("=" * 60)

    messages = [{
        "role": "user",
        "content": "Suggest search queries for learning about quantum computing.",
    }]

    result = await anthropic_struct_completion(messages, SearchSuggestion)
    if result:
        print(f"Topic: {result.topic}")
        print(f"Suggested Queries: {result.suggested_queries}")
        print(f"Reasoning: {result.reasoning}\n")


async def demo_multi_completion():
    """Demonstrate multi-modal completion with images."""
    print("=" * 60)
    print("Demo: Multi-modal Completion with Image")
    print("=" * 60)

    png_bytes = create_solid_color_png(0, 0, 255)  # Blue square

    result = await anthropic_multi_completion(
        prompt_sys="You are a helpful assistant that describes images concisely.",
        prompt_user="What do you see in this image?",
        images=[png_bytes],
    )
    print(f"Response:\n{result}\n")


async def main():
    """Run all demos."""
    await demo_basic_completion()
    await demo_structured_completion()
    await demo_multi_completion()


if __name__ == "__main__":
    asyncio.run(main())