#!/usr/bin/env python3
"""Generate a web page specification and score a candidate against it."""

import asyncio
import sys
from pathlib import Path

from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).parent))

from anthropic_helpers import anthropic_multi_completion, anthropic_struct_completion

SYSTEM_PROMPT = """You are an expert web page analyzer. Your task is to extract 
a specification that captures the user-facing functionality of a web page from its screenshot.
Focus on observable functionality and affordances, not implementation details."""

SPEC_USER_PROMPT = """Look at this PNG file. Write a specification that lists all the 
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


class CriterionScore(BaseModel):
    """Score for a single criterion."""

    number: int
    assessment: str
    score: int  # 0 or 1


class ScoringResult(BaseModel):
    """Complete scoring result with all criteria and total."""

    criteria: list[CriterionScore]
    total_score: int


def build_scoring_prompt(specification: str) -> str:
    """Build the prompt for scoring a candidate image against a specification."""
    return f"""You are evaluating a web page screenshot against a specification.

The specification was generated from a reference web page. Your task is to score 
how well the candidate web page (shown in the image) matches each criterion in the specification.

SPECIFICATION:
{specification}

INSTRUCTIONS:
1. For each criterion/rubrique in the specification, assess whether the candidate 
   web page mostly satisfies it.
2. Provide a brief assessment explaining your reasoning.
3. Score each criterion as either 0 (does not satisfy) or 1 (satisfies).
4. The total_score should be the sum of all individual criterion scores.

Look at the candidate web page image and evaluate it against each criterion."""


async def generate_spec(image_bytes: bytes) -> str | None:
    """Generate a specification from a web page screenshot."""
    return await anthropic_multi_completion(
        prompt_sys=SYSTEM_PROMPT,
        prompt_user=SPEC_USER_PROMPT,
        images=[image_bytes],
    )


async def score_candidate(
    candidate_bytes: bytes,
    specification: str,
) -> ScoringResult | None:
    """Score a candidate image against a specification."""
    scoring_prompt = build_scoring_prompt(specification)

    # Build messages with image for structured output
    messages = [{
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": __import__("base64").b64encode(candidate_bytes).decode("utf-8"),
                },
            },
            {
                "type": "text",
                "text": scoring_prompt,
            },
        ],
    }]

    return await anthropic_struct_completion(messages, ScoringResult)


def format_scores(result: ScoringResult) -> str:
    """Format the scoring result as text output."""
    lines = []
    for criterion in result.criteria:
        lines.append("criterion:")
        lines.append(f"  number: {criterion.number}")
        lines.append(f"  assessment: {criterion.assessment}")
        lines.append(f"  score: {criterion.score}")
        lines.append("")

    lines.append(f"total_score: {result.total_score}")
    return "\n".join(lines)


async def generate_and_score(
    reference_image: Path,
    output_spec: Path,
    candidate_image: Path,
    output_scores: Path,
) -> None:
    """Generate specification and score candidate against it."""
    # Validate inputs
    if not reference_image.exists():
        print(f"Error: Reference image '{reference_image}' does not exist.", file=sys.stderr)
        sys.exit(1)

    if not candidate_image.exists():
        print(f"Error: Candidate image '{candidate_image}' does not exist.", file=sys.stderr)
        sys.exit(1)

    # Read images
    print(f"Reading reference image: {reference_image}")
    reference_bytes = reference_image.read_bytes()
    print(f"Reference image size: {len(reference_bytes)} bytes")

    print(f"Reading candidate image: {candidate_image}")
    candidate_bytes = candidate_image.read_bytes()
    print(f"Candidate image size: {len(candidate_bytes)} bytes")

    # Generate specification
    print("Generating specification from reference image...")
    specification = await generate_spec(reference_bytes)
    if specification is None:
        print("Error: Failed to generate specification.", file=sys.stderr)
        sys.exit(1)

    print(f"Writing specification to: {output_spec}")
    output_spec.write_text(specification, encoding="utf-8")

    # Score candidate
    print("Scoring candidate image against specification...")
    result = await score_candidate(candidate_bytes, specification)
    if result is None:
        print("Error: Failed to score candidate.", file=sys.stderr)
        sys.exit(1)

    # Format and write scores
    scores_text = format_scores(result)
    print(f"Writing scores to: {output_scores}")
    output_scores.write_text(scores_text, encoding="utf-8")

    print(f"Done. Total score: {result.total_score}/{len(result.criteria)}")


def main() -> None:
    """CLI entry point."""
    if len(sys.argv) != 5:
        print(
            f"Usage: {sys.argv[0]} <reference_image> <output_rubrique_text_file> "
            "<candidate_image> <output_scores_file>",
            file=sys.stderr,
        )
        sys.exit(1)

    reference_image = Path(sys.argv[1])
    output_spec = Path(sys.argv[2])
    candidate_image = Path(sys.argv[3])
    output_scores = Path(sys.argv[4])

    asyncio.run(generate_and_score(reference_image, output_spec, candidate_image, output_scores))


if __name__ == "__main__":
    main()