"""Expose the values of manifest.json to the integration."""
from __future__ import annotations

import json
from pathlib import Path


class Manifest:
    """Read the integration manifest once, at import time."""

    def __init__(self) -> None:
        data = json.loads(
            Path(__file__).with_name("manifest.json").read_text(encoding="utf-8")
        )
        self.domain: str = data["domain"]
        self.name: str = data["name"]
        self.version: str = data["version"]
        self.documentation: str = data.get("documentation", "")


manifest = Manifest()
