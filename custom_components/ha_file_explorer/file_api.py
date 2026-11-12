"""Filesystem helpers used by the File Explorer HTTP API.

Every path received here is absolute and has already been validated by
``http_api.py``. All functions are blocking and are meant to run in the HA
executor.
"""
from __future__ import annotations

import io
import os
import shutil
import zipfile
from datetime import datetime
from pathlib import Path


def format_size(size: int) -> str:
    """Return a human readable file size."""
    for unit, factor in (
        ("B", 1),
        ("KB", 1024),
        ("MB", 1024**2),
        ("GB", 1024**3),
        ("TB", 1024**4),
    ):
        if size < factor * 1024 or unit == "TB":
            if unit == "B":
                return f"{size} B"
            return f"{size / factor:.2f} {unit}"
    return f"{size} B"


def get_dir_size(directory: str) -> int:
    """Sum the size of every file below a directory."""
    total = 0
    for root, _, files in os.walk(directory, onerror=lambda _error: None):
        for name in files:
            try:
                total += os.path.getsize(os.path.join(root, name))
            except OSError:
                continue
    return total


def get_dir_stats(directory: str) -> dict:
    """Count files/folders and total bytes below a directory (symlinks not followed)."""
    files = 0
    folders = 0
    total = 0
    for root, dirs, names in os.walk(directory, onerror=lambda _error: None):
        folders += len(dirs)
        files += len(names)
        for name in names:
            try:
                total += os.path.getsize(os.path.join(root, name))
            except OSError:
                continue
    return {"size": total, "files": files, "folders": folders}


def get_item_info(path: str) -> dict:
    """Everything the panel's info dialog shows about one file or folder.

    Timestamps are epoch seconds so the frontend formats them in the browser's
    own timezone. Creation time is only reported when the filesystem really
    exposes it (statx btime on Linux, birthtime on macOS/Windows); on plain
    ext4 `st_ctime` is the inode change time, so it is reported as unknown
    rather than shown under a label it does not mean.
    """
    target = Path(path)
    stat = target.stat()
    is_dir = target.is_dir()
    created = getattr(stat, "st_birthtime", None)
    result = {
        "name": target.name or path,
        "path": path,
        "type": "dir" if is_dir else "file",
        "created": created,
        "modified": stat.st_mtime,
        "accessed": stat.st_atime,
        "mode": _mode_string(stat.st_mode),
        "size": stat.st_size,
        "writable": os.access(path, os.W_OK),
        "readable": os.access(path, os.R_OK),
    }
    if is_dir:
        stats = get_dir_stats(path)
        result.update(stats)
        result["size"] = stats["size"]
    else:
        result["files"] = 1
        result["folders"] = 0
    return result


def _mode_string(mode: int) -> str:
    """Render a permission mask as the usual `drwxr-xr-x` string."""
    kind = {
        0o040000: "d",
        0o120000: "l",
        0o100000: "-",
    }.get(mode & 0o170000, "?")
    bits = ""
    for shift in (6, 3, 0):
        piece = (mode >> shift) & 0o7
        bits += "r" if piece & 0o4 else "-"
        bits += "w" if piece & 0o2 else "-"
        bits += "x" if piece & 0o1 else "-"
    return kind + bits


def get_dir_list(directory: str) -> list[dict]:
    """List a directory, folders first and then files, both by name."""
    items: list[dict] = []
    with os.scandir(directory) as entries:
        for entry in entries:
            try:
                stat = entry.stat()
                is_dir = entry.is_dir()
                size = get_dir_size(entry.path) if is_dir else stat.st_size
                items.append(
                    {
                        "name": entry.name,
                        "path": entry.name,
                        "time": datetime.fromtimestamp(stat.st_mtime).strftime(
                            "%Y-%m-%d %H:%M:%S"
                        ),
                        "type": "dir" if is_dir else "file",
                        "size": size,
                        "size_name": format_size(size),
                    }
                )
            except OSError:
                continue
    items.sort(key=lambda item: (item["type"] != "dir", item["name"].lower()))
    return items


def mkdir(path: str) -> None:
    """Create a directory (including parents) if it does not exist."""
    Path(path).mkdir(parents=True, exist_ok=True)


def delete_file(path: str) -> None:
    """Delete a file or a directory tree."""
    target = Path(path)
    if target.is_dir():
        shutil.rmtree(target)
    elif target.exists():
        target.unlink()


def rename_file(source: str, target: str) -> None:
    """Rename or move a file/directory inside the config directory."""
    os.rename(source, target)


def read_file(path: str) -> bytes:
    """Read a file as binary."""
    return Path(path).read_bytes()


def write_file(path: str, data: bytes) -> None:
    """Write binary data, creating the parent directory if needed."""
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)


def load_content(path: str) -> str:
    """Read a UTF-8 text file."""
    return Path(path).read_text(encoding="utf-8")


def save_content(path: str, data: str) -> None:
    """Write a UTF-8 text file, creating the parent directory if needed."""
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(data, encoding="utf-8")


def dir_to_zip(path: str) -> bytes:
    """Zip a directory tree in memory and return the archive bytes."""
    root = Path(path)
    prefix = root.name or "config"
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        for file in root.rglob("*"):
            if file.is_file():
                arcname = f"{prefix}/{file.relative_to(root).as_posix()}"
                archive.write(file, arcname)
    return buffer.getvalue()
