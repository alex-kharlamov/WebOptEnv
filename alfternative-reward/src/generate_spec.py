#!/usr/bin/env python3
"""Generate a web page specification from a screenshot using Anthropic LLM."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from anthropic_helpers import anthropic_multi_completion

SYSTEM_PROMPT = """You are an expert web page analyzer. Your task is to extract 
a specification that captures the user-facing functionality of a web page from its screenshot.
Focus on observable functionality and affordances, not implementation details."""

USER_PROMPT = """Look at this PNG file. Write a specification that lists all the 
visible functions and affordances of this web page.

Context: We are building a web page optimizer. As part of optimizing web pages, 
we need to ensure that the optimized web page maintains the same functionality 
of the original unoptimized page.

The specification should focus on:
- Maintaining all user-facing functionality of the original page
- Identifying interactive elements and their expected behaviors
- Noting any visible content that must be preserved

The specification should NOT overly constrain things. It should allow for making 
small changes to the page, such as making the web page accessible, or SEO optimized 
- as long as the functionality is maintained.

Output format: Write the specification as a structured list of rubriques (scoring criteria) 
to check and score against. Each rubrique should describe a specific functional aspect 
that must be preserved in the optimized version.

For each rubrique, include:
1. A clear name/title
2. What to check
3. Pass/fail criteria"""


async def generate_spec(input_image: Path, output_file: Path) -> None:
    """Generate a specification from a web page screenshot."""
    if not input_image.exists():
        print(f"Error: Input file '{input_image}' does not exist.", file=sys.stderr)
        sys.exit(1)

    if not input_image.suffix.lower() == ".png":
        print(f"Warning: Input file '{input_image}' is not a PNG file.", file=sys.stderr)

    print(f"Reading image: {input_image}")
    image_bytes = input_image.read_bytes()
    print(f"Image size: {len(image_bytes)} bytes")

    print("Calling Anthropic LLM...")
    result = await anthropic_multi_completion(
        prompt_sys=SYSTEM_PROMPT,
        prompt_user=USER_PROMPT,
        images=[image_bytes],
    )

    if result is None:
        print("Error: No response from LLM.", file=sys.stderr)
        sys.exit(1)

    print(f"Writing specification to: {output_file}")
    output_file.write_text(result, encoding="utf-8")
    print("Done.")


def main() -> None:
    """CLI entry point."""
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <input_image.png> <output_text_file>", file=sys.stderr)
        sys.exit(1)

    input_image = Path(sys.argv[1])
    output_file = Path(sys.argv[2])

    asyncio.run(generate_spec(input_image, output_file))


if __name__ == "__main__":
    main()