"""HTTP API used by the File Explorer custom panel."""
from __future__ import annotations

from pathlib import Path
from urllib.parse import quote

from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from .file_api import (
    delete_file,
    dir_to_zip,
    get_dir_list,
    load_content,
    mkdir,
    read_file,
    rename_file,
    save_content,
    write_file,
)
from .manifest import manifest

DOMAIN = manifest.domain
API_URL = f"/{DOMAIN}-api"
MAX_UPLOAD_SIZE = 100 * 1024 * 1024  # 100 MB


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
    """A small REST API for listing and editing config directory files."""

    url = API_URL
    name = f"api:{DOMAIN}"
    requires_auth = True

    def _ok(self, msg: str) -> web.Response:
        return self.json({"code": 0, "msg": msg})

    def _error(self, msg: str, status: int = 400) -> web.Response:
        return self.json({"code": 1, "msg": msg}, status_code=status)

    async def get(self, request: web.Request) -> web.Response:
        """List a directory, read a text file or download a file/folder."""
        hass = request.app["hass"]
        query = request.query
        act = query.get("act", "get")
        try:
            path = _resolve(request, query.get("path"))
        except ValueError as err:
            return self._error(str(err))

        try:
            if act == "content":
                if not path.is_file():
                    return self._error("文件不存在", 404)
                data = await hass.async_add_executor_job(load_content, str(path))
                return self.json({"code": 0, "data": data})

            if act == "download":
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

            if act not in ("get", "list"):
                return self._error("未知操作")
            if not path.is_dir():
                return self._error("目录不存在", 404)
            data = await hass.async_add_executor_job(get_dir_list, str(path))
            return self.json(data)
        except (OSError, UnicodeDecodeError) as err:
            return self._error(f"读取失败：{err}")

    async def put(self, request: web.Request) -> web.Response:
        """Create a file/folder or rename an existing one."""
        hass = request.app["hass"]
        try:
            body = await request.json()
            if not isinstance(body, dict):
                raise ValueError("参数错误")
            path = _resolve(request, body.get("path"))
        except (ValueError, TypeError) as err:
            return self._error(f"参数错误：{err}")

        act = request.query.get("act", "")
        try:
            if act == "rename":
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

            if act not in ("file", "folder"):
                return self._error("未知操作")
            if path == _config_root(request) or path.exists():
                return self._error("已存在相同名称")
            if act == "file":
                await hass.async_add_executor_job(save_content, str(path), "")
            else:
                await hass.async_add_executor_job(mkdir, str(path))
            return self._ok("创建成功")
        except (ValueError, OSError) as err:
            return self._error(f"操作失败：{err}")

    async def post(self, request: web.Request) -> web.Response:
        """Upload a file (multipart) or save text content (JSON)."""
        # aiohttp copies the application limit into the request when it is
        # created. Raise it for this upload only, before the body is read.
        request._client_max_size = MAX_UPLOAD_SIZE
        hass = request.app["hass"]
        query = request.query
        try:
            if "path" in query:
                path = _resolve(request, query.get("path"))
                reader = await request.multipart()
                field = await reader.next()
                if field is None:
                    return self._error("没有收到文件")
                data = await field.read()
                await hass.async_add_executor_job(write_file, str(path), data)
                return self._ok("上传成功")

            body = await request.json()
            if not isinstance(body, dict):
                raise ValueError("参数错误")
            path = _resolve(request, body.get("path"))
            await hass.async_add_executor_job(
                save_content, str(path), body.get("data", "")
            )
            return self._ok("保存成功")
        except (ValueError, OSError, TypeError, web.HTTPException) as err:
            return self._error(f"上传失败：{err}")

    async def delete(self, request: web.Request) -> web.Response:
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
