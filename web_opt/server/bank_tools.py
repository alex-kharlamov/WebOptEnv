from os import listdir
import logging
import random


import os

def folder_to_state(root_path: str) -> dict:
    """
    DFS over all files under root_path and return a dictionary where keys are file names and values are file contents.
    """
    state = {}

    def dfs(path: str):
        # List entries in deterministic order
        try:
            entries = sorted(os.listdir(path))
        except FileNotFoundError:
            return

        for name in entries:
            full = os.path.join(path, name)
            filename, file_extension = os.path.splitext(full)
            if os.path.isdir(full):
                # Recurse into subdirectory
                dfs(full)
            elif os.path.isfile(full) and file_extension[1:].lower() in ['js', 'ts', 'tsx', 'jsx', 'css', 'html']:
                # Read file content as text
                try:
                    with open(full, "r", encoding="utf-8", errors="replace") as f:
                        content = f.read()
                except OSError:
                    # Skip unreadable files
                    continue

                # Use just the filename as the tag (e.g. "style.css", "index.html")
                tag = full
                state[tag] = content

    dfs(root_path)
    return state


class Project:
    def __init__(self, path: str, root: str):
        self.path = os.path.join(root, path)
        self.path = self._copy_project_to_temp(self)
    
    def _copy_project_to_temp(self, project) -> str:
        """Copy project from bank to a temp directory and return the path."""
        import shutil
        import tempfile
        import os
        
        # Create or clean the current_project directory
        temp_dir = os.path.join(tempfile.gettempdir(), "current_project")
        
        # Remove existing directory if it exists
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        
        # Create the directory
        os.makedirs(temp_dir, exist_ok=True)
        
        # Copy the project files
        shutil.copytree(project.path, temp_dir, dirs_exist_ok=True)
        
        return temp_dir

    def validate(self) -> bool:
        return True

    def get_state(self) -> dict:
        return folder_to_state(os.path.join(self.path, 'src'))


class BankManager:
    def __init__(self):
        self._bank_root = os.path.join(os.path.dirname(__file__), "website_bank/")
        self._all_projects = [Project(path, root=self._bank_root) for path in listdir(self._bank_root) if path != ".DS_Store"]
        logging.info(f"Found {len(self._all_projects)} projects in {self._bank_root}")

        self.projects = []
        valid_projects = 0
        for project in self._all_projects:
            if project.validate():
                valid_projects += 1
                self.projects.append(project)
        logging.info(f"Valid projects: {valid_projects}")
    
    def sample_project(self) -> Project:
        return random.choice(self.projects)