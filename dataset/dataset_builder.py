#!/usr/bin/env python3
"""Dataset builder for React projects from GitHub."""

import shutil
import zipfile
from pathlib import Path

import requests


OWNER = "ianshulx"
REPO = "React-projects-for-beginners"
EXCLUDE_FOLDERS = {"assets", "temp"}
SCRIPT_DIR = Path(__file__).parent
REPO_DIR = SCRIPT_DIR / "repo"
ZIPS_DIR = SCRIPT_DIR / "zips"


def download_repo(owner: str, repo: str, branch: str = "main") -> Path:
    """Download and extract the full repository."""
    zip_url = f"https://github.com/{owner}/{repo}/archive/refs/heads/{branch}.zip"
    zip_path = SCRIPT_DIR / f"{repo}.zip"
    
    print(f"Downloading {owner}/{repo}...")
    response = requests.get(zip_url, stream=True)
    response.raise_for_status()
    
    with open(zip_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    
    print(f"Extracting to {REPO_DIR}...")
    if REPO_DIR.exists():
        shutil.rmtree(REPO_DIR)
    
    with zipfile.ZipFile(zip_path) as zf:
        # Get the root folder name from the zip
        root_name = zf.namelist()[0].split("/")[0]
        zf.extractall(SCRIPT_DIR)
    
    # Rename extracted folder to "repo"
    extracted_dir = SCRIPT_DIR / root_name
    extracted_dir.rename(REPO_DIR)
    
    zip_path.unlink()  # Clean up the downloaded zip
    print(f"Repository ready at {REPO_DIR}")
    return REPO_DIR


def list_project_folders(repo_dir: Path) -> list[str]:
    """List project folders in the downloaded repository."""
    folders = [
        item.name for item in repo_dir.iterdir()
        if item.is_dir()
        and not item.name.startswith(".")
        and item.name not in EXCLUDE_FOLDERS
    ]
    return sorted(folders)


def zip_folder(repo_dir: Path, folder_name: str, output_dir: Path) -> Path:
    """Create a zip file from a project folder."""
    source_dir = repo_dir / folder_name
    output_path = output_dir / f"{folder_name}.zip"
    
    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path in source_dir.rglob("*"):
            if file_path.is_file():
                arcname = file_path.relative_to(source_dir)
                zf.write(file_path, arcname)
    
    return output_path


if __name__ == "__main__":
    # Download the repo once
    download_repo(OWNER, REPO)
    
    # List folders
    folders = list_project_folders(REPO_DIR)
    print(f"Found {len(folders)} project folders")
    
    # Zip all folders
    ZIPS_DIR.mkdir(exist_ok=True)
    for i, folder in enumerate(folders, 1):
        zip_path = zip_folder(REPO_DIR, folder, ZIPS_DIR)
        print(f"[{i}/{len(folders)}] Created {zip_path.name}")
