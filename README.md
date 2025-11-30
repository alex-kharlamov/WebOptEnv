---
title: WebOpt Environment Server
emoji: 🚀
colorFrom: gray
colorTo: pink
sdk: docker
pinned: false
app_port: 8000
base_path: /web
tags:
  - openenv
---

# WebOpt Environment

A web optimization environment that uses Lighthouse audits to evaluate and improve web performance, accessibility, SEO, and best practices.

## Building the Docker Image

Before using the environment, you need to build the Docker image:

```bash
# From project root
docker build -t web_opt-env:latest -f server/Dockerfile .
```

### Running locally

```bash
# From project root
docker run -p 8000:8000  web_opt-env:latest
```
### Connecting to an Existing Server

If you already have a WebOpt environment server running, you can connect directly:

```python
from web_opt import WebOptAction, WebOptEnv, WebsiteState


# Connect to existing server
web_opt_env = WebOptEnv(base_url="<ENV_HTTP_URL_HERE>")

# Use as normal
result = web_opt_env.reset()
result = web_opt_env.step(WebOptAction(site=WebsiteState(code={...})))
```

Note: When connecting to an existing server, `web_opt_env.close()` will NOT stop the server.

## Deploying to Hugging Face Spaces

You can easily deploy your OpenEnv environment to Hugging Face Spaces using the `openenv push` command:

```bash
# From the environment directory (where openenv.yaml is located)
openenv push

# Or specify options
openenv push --namespace my-org --private
```

The `openenv push` command will:
1. Validate that the directory is an OpenEnv environment (checks for `openenv.yaml`)
2. Prepare a custom build for Hugging Face Docker space (enables web interface)
3. Upload to Hugging Face (ensuring you're logged in)

### Prerequisites

- Authenticate with Hugging Face: The command will prompt for login if not already authenticated

### Options

- `--directory`, `-d`: Directory containing the OpenEnv environment (defaults to current directory)
- `--repo-id`, `-r`: Repository ID in format 'username/repo-name' (defaults to 'username/env-name' from openenv.yaml)
- `--base-image`, `-b`: Base Docker image to use (overrides Dockerfile FROM)
- `--private`: Deploy the space as private (default: public)

### Examples

```bash
# Push to your personal namespace (defaults to username/env-name from openenv.yaml)
openenv push

# Push to a specific repository
openenv push --repo-id my-org/my-env

# Push with a custom base image
openenv push --base-image ghcr.io/meta-pytorch/openenv-base:latest

# Push as a private space
openenv push --private

# Combine options
openenv push --repo-id my-org/my-env --base-image custom-base:latest --private
```

After deployment, your space will be available at:
`https://huggingface.co/spaces/<repo-id>`

The deployed space includes:
- **Web Interface** at `/web` - Interactive UI for exploring the environment
- **API Documentation** at `/docs` - Full OpenAPI/Swagger interface
- **Health Check** at `/health` - Container health monitoring

## Environment Details

### Action Space
**WebOptAction**: Contains the website state to be evaluated
- `site` (WebsiteState) - The website state containing the code to be evaluated
  - `code` (dict) - Dictionary mapping file paths to their content

### Observation Space
**WebOptObservation**: Contains the evaluation results and metrics
- `lighthouse_scores` (LighthouseScores) - Scores from Lighthouse audit
  - `performance_score` (float) - Performance score (0-100)
  - `accessibility_score` (float) - Accessibility score (0-100)
  - `seo_score` (float) - SEO score (0-100)
  - `practices_score` (float) - Best practices score (0-100)
- `verification_scores` (VerificationScores) - Additional verification metrics
  - `psnr` (float) - Peak Signal-to-Noise Ratio for visual comparison
  - `ssim` (float) - Structural Similarity Index Measure
- `done` (bool) - Whether the episode is complete
- `metadata` (dict) - Additional metadata including step count and episode ID

### State
**WebOptState**: Maintains the environment state across steps
- `site` (WebsiteState) - Current website state
- `episode_id` (str) - Unique identifier for the episode
- `step_count` (int) - Current step in the episode
- `performance_scores` (list[float]) - History of performance scores
- `accessibility_scores` (list[float]) - History of accessibility scores
- `seo_scores` (list[float]) - History of SEO scores
- `practices_scores` (list[float]) - History of best practices scores
- `project_path` (str) - Path to the current project
- `reference_screenshot` (str) - Base64 encoded reference screenshot


## Development & Testing

### Direct Environment Testing

Test the environment logic directly without starting the HTTP server:

```bash
# From the server directory
python3 server/web_opt_environment.py
```

This verifies that:
- Environment resets correctly
- Step executes actions properly
- State tracking works
- Rewards are calculated correctly

### Running Locally

Run the server locally for development:

```bash
uvicorn server.app:app --reload
```

## Project Structure

```
web_opt/
├── .dockerignore         # Docker build exclusions
├── __init__.py            # Module exports
├── README.md              # This file
├── openenv.yaml           # OpenEnv manifest
├── pyproject.toml         # Project metadata and dependencies
├── uv.lock                # Locked dependencies (generated)
├── client.py              # WebOptEnv client implementation
├── models.py              # Action and Observation models
└── server/
    ├── __init__.py        # Server module exports
    ├── web_opt_environment.py  # Core environment logic
    ├── app.py             # FastAPI application
    └── Dockerfile         # Container image definition
```
