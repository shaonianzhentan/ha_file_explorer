"""HTTP API used by the File Explorer custom panel."""
from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import quote

from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from .file_api import (
    delete_file,
    dir_to_zip,
    get_dir_list,
    get_item_info,
    load_content,
    mkdir,
    read_file,
    rename_file,
    save_content,
    write_file,
)
from .manifest import manifest

DOMAIN = manifest.domain
API_URL = f"/api/{DOMAIN}"
MAX_UPLOAD_SIZE = 100 * 1024 * 1024  # 100 MB
MAX_PREVIEW_SIZE = 32 * 1024 * 1024  # 32 MB, keeps one image out of swap
MAX_PREVIEW_VIDEO_SIZE = 100 * 1024 * 1024  # 100 MB, same ceiling as uploads
# A HA integration domain is always lowercase snake_case; anything else is
# rejected before it ever reaches the filesystem.
BRAND_DOMAIN = re.compile(r"^[a-z0-9_]+$")
# Local brand art a custom integration may ship in custom_components/<domain>/brand/.
BRAND_FILES_DARK = ("dark_icon.png", "icon.png")
BRAND_FILES_LIGHT = ("icon.png",)

# Image extensions the panel can preview in its dialog, mapped to the MIME type
# the proxy answers with. Keep in sync with IMAGE_MIME in www/modules/format.js.
IMAGE_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".jfif": "image/jpeg",
    ".pjpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".bmp": "image/bmp",
    ".ico": "image/x-icon",
    ".svg": "image/svg+xml",
    ".tif": "image/tiff",
    ".tiff": "image/tiff",
    ".heic": "image/heic",
    ".heif": "image/heif",
    ".apng": "image/apng",
}

# Video extensions the preview dialog can play. Keep in sync with VIDEO_MIME in
# www/modules/format.js. Body is streamed, never read into memory.
VIDEO_TYPES = {
    ".mp4": "video/mp4",
    ".m4v": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".ogv": "video/ogg",
    ".mkv": "video/x-matroska",
    ".avi": "video/x-msvideo",
    ".flv": "video/x-flv",
    ".mpg": "video/mpeg",
    ".mpeg": "video/mpeg",
    ".wmv": "video/x-ms-wmv",
    ".3gp": "video/3gpp",
}


def _config_root(request: web.Request) -> Path:
    """Return the resolved Home Assistant config directory."""
    return Path(request.app["hass"].config.config_dir).resolve()


def _resolve(request: web.Request, relative: str | None) -> Path:
    """Resolve a config-relative path, rejecting anything outside the config dir."""
    root = _config_root(request)
    target = (root / (relative or "").replace("\\", "/").lstrip("/")).resolve()
    if target != root and root not in target.parents:
        raise ValueError("路径不在 Home Assistant 配置目录内")
    return target


class HttpApi(HomeAssistantView):
    """A small REST API for listing and editing config directory files.

    Every operation lives under /api/<domain>/<action> so the endpoints are
    predictable and do not collide with Home Assistant's own /api routes.
    """

    url = f"{API_URL}/{{action}}"
    name = f"api:{DOMAIN}"
    requires_auth = True

    def _ok(self, msg: str) -> web.Response:
        return self.json({"code": 0, "msg": msg})

    def _error(self, msg: str, status: int = 400) -> web.Response:
        return self.json({"code": 1, "msg": msg}, status_code=status)

    async def get(self, request: web.Request, action: str) -> web.Response:
        """List a directory, read a text file, preview media, get info or download."""
        try:
            path = _resolve(request, request.query.get("path"))
        except ValueError as err:
            return self._error(str(err))

        hass = request.app["hass"]

        try:
            if action == "content":
                if not path.is_file():
                    return self._error("文件不存在", 404)
                data = await hass.async_add_executor_job(load_content, str(path))
                return self.json({"code": 0, "data": data})

            if action == "download":
                if path.is_dir():
                    name = f"{path.name or 'config'}.zip"
                    content = await hass.async_add_executor_job(dir_to_zip, str(path))
                    content_type = "application/zip"
                elif path.is_file():
                    name = path.name
                    content = await hass.async_add_executor_job(read_file, str(path))
                    content_type = "application/octet-stream"
                else:
                    return self._error("文件不存在", 404)
                return web.Response(
                    body=content,
                    headers={
                        "Content-Disposition": (
                            f"attachment; filename=\"download\"; "
                            f"filename*=UTF-8''{quote(name)}"
                        ),
                        "Content-Type": content_type,
                    },
                )

            if action == "preview":
                # Same-origin proxy for the panel's media dialog: the browser
                # never talks to the file directly, it gets typed bytes from us
                # (HA auth is a bearer header, so an <img src=/api/...> would
                # 401 anyway).
                if not path.is_file():
                    return self._error("文件不存在", 404)
                suffix = path.suffix.lower()
                content_type = IMAGE_TYPES.get(suffix) or VIDEO_TYPES.get(suffix)
                if not content_type:
                    return self._error("该文件格式不支持在线预览")
                size = path.stat().st_size
                if suffix in VIDEO_TYPES:
                    if size > MAX_PREVIEW_VIDEO_SIZE:
                        return self._error(
                            "视频超过 100 MB，请下载后播放", 413
                        )
                    # Streamed straight off disk: a 100 MB clip must not be
                    # copied into the event loop's memory for every play.
                    return web.FileResponse(
                        path,
                        headers={
                            "Content-Type": content_type,
                            "Content-Disposition": (
                                f"inline; filename*=UTF-8''{quote(path.name)}"
                            ),
                            "Cache-Control": "private, max-age=300",
                            "X-Content-Type-Options": "nosniff",
                        },
                    )
                if size > MAX_PREVIEW_SIZE:
                    return self._error(
                        "图片超过 32 MB，请下载后查看", 413
                    )
                content = await hass.async_add_executor_job(read_file, str(path))
                return web.Response(
                    body=content,
                    headers={
                        "Content-Type": content_type,
                        # inline: this is a display endpoint, not a download.
                        "Content-Disposition": (
                            f"inline; filename*=UTF-8''{quote(path.name)}"
                        ),
                        "Cache-Control": "private, max-age=300",
                        "X-Content-Type-Options": "nosniff",
                    },
                )

            if action == "brand":
                # Local brand art of another integration, so the explorer still
                # has an icon when the machine has no internet: the CDN is the
                # fast path, this is the offline one.
                domain = (request.query.get("domain") or "").strip()
                if not BRAND_DOMAIN.match(domain):
                    return self._error("域名不合法")
                dark = request.query.get("dark") in ("1", "true")
                try:
                    brand_dir = _resolve(
                        request, f"custom_components/{domain}/brand"
                    )
                except ValueError as err:
                    return self._error(str(err))
                for name in BRAND_FILES_DARK if dark else BRAND_FILES_LIGHT:
                    icon = brand_dir / name
                    if icon.is_file():
                        return web.FileResponse(
                            icon,
                            headers={
                                "Content-Type": "image/png",
                                "Cache-Control": "private, max-age=600",
                                "X-Content-Type-Options": "nosniff",
                            },
                        )
                return self._error("没有本地品牌图", 404)

            if action == "info":
                # Details for the panel's info dialog. A folder reports its
                # recursive size/counts, which can take a moment on big trees.
                if not path.exists():
                    return self._error("文件不存在", 404)
                data = await hass.async_add_executor_job(
                    get_item_info, str(path)
                )
                return self.json({"code": 0, "data": data})

            if action == "list":
                if not path.is_dir():
                    return self._error("目录不存在", 404)
                data = await hass.async_add_executor_job(get_dir_list, str(path))
                return self.json(data)

            return self._error("未知操作")
        except (OSError, UnicodeDecodeError) as err:
            return self._error(f"读取失败：{err}")

    async def put(self, request: web.Request, action: str) -> web.Response:
        """Create a file/folder or rename an existing one."""
        hass = request.app["hass"]
        try:
            body = await request.json()
            if not isinstance(body, dict):
                raise ValueError("参数错误")
            path = _resolve(request, body.get("path"))
        except (ValueError, TypeError) as err:
            return self._error(f"参数错误：{err}")

        try:
            if action == "create":
                if path == _config_root(request) or path.exists():
                    return self._error("已存在相同名称")
                act = body.get("act")
                if act == "file":
                    await hass.async_add_executor_job(save_content, str(path), "")
                elif act == "folder":
                    await hass.async_add_executor_job(mkdir, str(path))
                else:
                    return self._error("未知操作")
                return self._ok("创建成功")

            if action == "rename":
                new_path = _resolve(request, body.get("new_path"))
                if not path.exists():
                    return self._error("文件不存在", 404)
                if new_path == _config_root(request):
                    return self._error("不能覆盖配置根目录")
                if new_path.exists():
                    return self._error("已存在相同名称")
                await hass.async_add_executor_job(
                    rename_file, str(path), str(new_path)
                )
                return self._ok("操作成功")

            return self._error("未知操作")
        except (ValueError, OSError) as err:
            return self._error(f"操作失败：{err}")

    async def post(self, request: web.Request, action: str) -> web.Response:
        """Upload a file (multipart) or save text content (JSON)."""
        # aiohttp copies the application limit into the request when it is
        # created. Raise it for this upload only, before the body is read.
        request._client_max_size = MAX_UPLOAD_SIZE
        hass = request.app["hass"]

        if action == "upload":
            try:
                path = _resolve(request, request.query.get("path"))
                reader = await request.multipart()
                field = await reader.next()
                if field is None:
                    return self._error("没有收到文件")
                data = await field.read()
                await hass.async_add_executor_job(write_file, str(path), data)
                return self._ok("上传成功")
            except (ValueError, OSError, TypeError, web.HTTPException) as err:
                return self._error(f"上传失败：{err}")

        if action == "save":
            try:
                body = await request.json()
                if not isinstance(body, dict):
                    raise ValueError("参数错误")
                path = _resolve(request, body.get("path"))
                await hass.async_add_executor_job(
                    save_content, str(path), body.get("data", "")
                )
                return self._ok("保存成功")
            except (ValueError, OSError, TypeError) as err:
                return self._error(f"保存失败：{err}")

        return self._error("未知操作")

    async def delete(self, request: web.Request, action: str) -> web.Response:
        """Delete a file or folder."""
        hass = request.app["hass"]
        try:
            path = _resolve(request, request.query.get("path"))
            if path == _config_root(request):
                return self._error("不能删除配置根目录")
            if not path.exists():
                return self._error("文件不存在", 404)
            await hass.async_add_executor_job(delete_file, str(path))
            return self._ok("删除成功")
        except (ValueError, OSError) as err:
            return self._error(f"删除失败：{err}")
