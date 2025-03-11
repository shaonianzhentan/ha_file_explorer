import os
import mimetypes
from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from .file_api import delete_file, get_dir_list, mkdir, load_content, save_content, create_folder_zip

from .manifest import manifest

DOMAIN = manifest.domain
API_URL = f"/{DOMAIN}-api"
DOWNLOAD_API_URL = f"/{DOMAIN}-download"

class HttpDownloadApi(HomeAssistantView):
    """Handle file and folder downloads without requiring authentication."""
    url = DOWNLOAD_API_URL
    name = f"{DOMAIN}_download"
    requires_auth = False
    
    # format path
    def get_config_path(self, path):
        config_path = path.lstrip('/')
        if config_path[:2] == './':
                config_path = config_path[2:]
        return config_path
        
    async def get(self, request):
        hass = request.app["hass"]
        query = request.query
        act = query.get('act', '')
        config_path = self.get_config_path(query.get('path', ''))
        path = hass.config.path(config_path)
        
        # 下载文件夹
        if act == 'download_folder':
            if not os.path.isdir(path):
                return web.Response(text='指定路径不是文件夹', status=400)
            
            # 创建临时zip文件
            zip_path = await hass.async_add_executor_job(create_folder_zip, path)
            folder_name = os.path.basename(path)
            
            # 设置响应头，指定下载的文件名
            headers = {
                'Content-Disposition': f'attachment; filename="{folder_name}.zip"',
                'Content-Type': 'application/zip'
            }
            
            # 创建文件响应
            return web.FileResponse(path=zip_path, headers=headers)
        
        # 下载单个文件
        elif act == 'download_file':
            if not os.path.isfile(path):
                return web.Response(text='指定路径不是文件', status=400)
            
            file_name = os.path.basename(path)
            content_type, _ = mimetypes.guess_type(path)
            if content_type is None:
                content_type = 'application/octet-stream'
            
            # 设置响应头，指定下载的文件名
            headers = {
                'Content-Disposition': f'attachment; filename="{file_name}"',
                'Content-Type': content_type
            }
            
            # 创建文件响应
            return web.FileResponse(path=path, headers=headers)
            
        return web.Response(text='无效的操作', status=400)


class HttpApi(HomeAssistantView):

    url = API_URL
    name = DOMAIN
    requires_auth = True

    # format path
    def get_config_path(self, path):
        config_path = path.lstrip('/')
        if config_path[:2] == './':
                config_path = config_path[2:]
        return config_path

    # get file list or file content
    async def get(self, request):
        hass = request.app["hass"]
        query = request.query
        act = query.get('act', '')
        config_path = self.get_config_path(query.get('path', ''))
        path = hass.config.path(config_path)
        
        # 下载文件夹
        if act == 'download_folder':
            if not os.path.isdir(path):
                return self.json({ 'code': 1, 'msg': '指定路径不是文件夹'})
            
            # 创建临时zip文件
            zip_path = await hass.async_add_executor_job(create_folder_zip, path)
            folder_name = os.path.basename(path)
            
            # 设置响应头，指定下载的文件名
            headers = {
                'Content-Disposition': f'attachment; filename="{folder_name}.zip"',
                'Content-Type': 'application/zip'
            }
            
            # 创建文件响应
            return web.FileResponse(path=zip_path, headers=headers)
        
        # 下载单个文件
        elif act == 'download_file':
            if not os.path.isfile(path):
                return self.json({ 'code': 1, 'msg': '指定路径不是文件'})
            
            file_name = os.path.basename(path)
            content_type, _ = mimetypes.guess_type(path)
            if content_type is None:
                content_type = 'application/octet-stream'
            
            # 设置响应头，指定下载的文件名
            headers = {
                'Content-Disposition': f'attachment; filename="{file_name}"',
                'Content-Type': content_type
            }
            
            # 创建文件响应
            return web.FileResponse(path=path, headers=headers)
        
        # 获取文件内容
        elif act == 'content':
            data = await hass.async_add_executor_job(load_content, path)
            return self.json({ 'code': 0, 'data': data})

        # 获取文件列表（默认行为）
        data = await hass.async_add_executor_job(get_dir_list, path)
        return self.json(data) 

    # delete file or folder
    async def delete(self, request):
        hass = request.app["hass"]
        query = request.query
        config_path = self.get_config_path(query.get('path', ''))
        path = hass.config.path(config_path)
        await hass.async_add_executor_job(delete_file, path)
        return self.json({ 'code': 0, 'msg': '删除成功'})

    # add file or folder
    async def put(self, request):
        hass = request.app["hass"]
        query = request.query
        act = query.get('act', '')
        body = await request.json()
        config_path = self.get_config_path(body.get('path'))
        path = hass.config.path(config_path)

        # rename file or folder
        if act == 'rename':
            new_path = hass.config.path(self.get_config_path(body.get('new_path')))
            if os.path.exists(new_path):
                return self.json({ 'code': 1, 'msg': '已存在相同名称'})

            os.rename(path, new_path)
            return self.json({ 'code': 0, 'msg': '操作成功'})

        # create file or folder
        if os.path.exists(path):
            return self.json({ 'code': 1, 'msg': '已存在相同名称'})

        if act == 'file':
            await hass.async_add_executor_job(save_content, path, '')
        elif act == 'folder':
            await hass.async_add_executor_job(mkdir, path)

        return self.json({ 'code': 0, 'msg': '创建成功'})

    async def post(self, request):
        # 文件限制调整到100MB
        request.app._client_max_size = 1024**2 * 100
        hass = request.app["hass"]
        # 上传文件
        query = request.query
        if query.get('path') is not None:
            config_path = self.get_config_path(query.get('path'))
            path = hass.config.path(config_path)
            dir_path = path[:path.rindex('/')]
            reader = await request.multipart()
            file = await reader.next()
            # print(file.filename)
            await hass.async_add_executor_job(mkdir, dir_path)
            # create file
            f = await hass.async_add_executor_job(open, path, 'wb')
            while True:
                chunk = await file.read_chunk()  # 默认是8192个字节。
                if not chunk:
                    break
                await hass.async_add_executor_job(f.write, chunk)
            f.close()

            return self.json({ 'code': 0, 'msg': '上传成功'})
        else:
            body = await request.json()
            config_path = self.get_config_path(body.get('path'))
            path = hass.config.path(config_path)
            await hass.async_add_executor_job(save_content, path, body.get('data'))
            return self.json({ 'code': 0, 'msg': '保存成功'})