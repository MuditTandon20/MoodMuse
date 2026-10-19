"""
MoodMuse Studio - Creation Storage
Manages persistence of generated music compositions and their metadata.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from models import Creation, CreationUpdate


class CreationStorage:
    """
    File-based storage for music creations.
    Stores metadata as JSON and audio files in a local directory.
    """

    def __init__(self, storage_dir: str = "./storage"):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.metadata_file = self.storage_dir / "creations.json"
        self._creations: dict[str, Creation] = {}
        self._load()

    def _load(self):
        """Load creations from disk."""
        if self.metadata_file.exists():
            try:
                data = json.loads(self.metadata_file.read_text(encoding="utf-8"))
                for item in data:
                    creation = Creation(**item)
                    self._creations[creation.id] = creation
            except (json.JSONDecodeError, Exception):
                self._creations = {}

    def _save(self):
        """Persist creations to disk."""
        data = [c.model_dump() for c in self._creations.values()]
        self.metadata_file.write_text(
            json.dumps(data, indent=2, default=str),
            encoding="utf-8",
        )

    def add(self, creation: Creation) -> Creation:
        """Add a new creation."""
        self._creations[creation.id] = creation
        self._save()
        return creation

    def get(self, creation_id: str) -> Optional[Creation]:
        """Get a creation by ID."""
        return self._creations.get(creation_id)

    def get_all(self) -> list[Creation]:
        """Get all creations, newest first."""
        return sorted(
            self._creations.values(),
            key=lambda c: c.created_at,
            reverse=True,
        )

    def update(self, creation_id: str, update: CreationUpdate) -> Optional[Creation]:
        """Update a creation's mutable fields."""
        creation = self._creations.get(creation_id)
        if not creation:
            return None

        if update.title is not None:
            creation.title = update.title
        if update.is_favorite is not None:
            creation.is_favorite = update.is_favorite

        self._creations[creation_id] = creation
        self._save()
        return creation

    def delete(self, creation_id: str) -> bool:
        """Delete a creation and its audio file."""
        if creation_id not in self._creations:
            return False

        creation = self._creations[creation_id]

        # Delete audio file if exists
        if creation.audio_filename:
            audio_path = self.storage_dir / "audio" / creation.audio_filename
            if audio_path.exists():
                audio_path.unlink()

        del self._creations[creation_id]
        self._save()
        return True

    def count(self) -> int:
        return len(self._creations)
