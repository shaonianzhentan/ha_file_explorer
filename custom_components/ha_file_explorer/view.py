import os, logging, time, importlib, base64, json, string, sys, requests, urllib, aiohttp, subprocess, tempfile
from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from .const import DOMAIN, VERSION, URL, ROOT_PATH

class HAView(HomeAssistantView):

    url = URL
    name = DOMAIN
    requires_auth = True
    
    ''' 推送接口 '''
    async def put(self, request):
        hass = request.app["hass"]
        fileExplorer = hass.data[DOMAIN]
        try:
            reader = await request.multipart()
            # print(reader)
            # 读取路径
            res_path = await reader.next()
            res_path_value = await res_path.text()
            # print(res_path_value)
            # 读取名称
            res_file = await reader.next()
            res_file_value = await res_file.text()
            # print(res_file_value)
            # 保存文件
            file = await reader.next()
            # 生成文件
            _path = hass.config.path('./' + res_path_value)
            if os.path.isdir(_path) == False:
                fileExplorer.mkdir(_path)
            filename =  _path + '/' + res_file_value
            size = 0
            with open(filename, 'wb') as f:
                while True:
                    chunk = await file.read_chunk()  # 默认是8192个字节。
                    if not chunk:
                        break
                    size += len(chunk)
                    f.write(chunk)
            return self.json({ 'code': 0, 'msg': '上传成功'})
        except Exception as e:
            print(e)

    async def post(self, request):
        hass = request.app["hass"]
        fileExplorer = hass.data[DOMAIN]
        res = await request.json()
        _type = res.get('type', '')
        _url = res.get('url', '')
        _path = hass.config.path('./' + res.get('path', ''))        
        try:
            if _type == 'get':
                # 获取目录和文件
                data = fileExplorer.getDirectory(_path)
                return self.json(data)
            elif _type == 'get-content':
                # 获取文件内容
                data = fileExplorer.getContent(_path)
                return self.json({ 'code': 0, 'data': data})
            elif _type == 'get-cloud-list':
                # 获取七牛云备份列表
                return self.json({ 'code': 0, 'data': []})
            elif _type == 'delete':
                # 删除文件
                fileExplorer.delete(_path)
                return self.json({ 'code': 0, 'msg': '删除成功'})
            elif _type == 'delete-qiniu':
                # 删除备份文件
                return self.json({ 'code': 0, 'msg': '删除成功'})   
            elif _type == 'new-file':
                # 新建文件
                data = res.get('data', '')
                fileExplorer.setContent(_path, data)
                return self.json({ 'code': 0, 'msg': '保存成功'})
            elif _type == 'new-dir':
                # 新建文件夹
                fileExplorer.mkdir(_path)
                return self.json({ 'code': 0, 'msg': '新建成功'})
            elif _type == 'upload-file':
                # 上传文件
                return self.json({ 'code': 0, 'msg': '上传文件成功'})
            elif _type == 'upload-dir':
                # 上传文件夹
                return self.json({ 'code': 0, 'msg': '上传文件夹成功'})
            elif _type == 'download-url':
                # 下载网络文件到文件夹
                print(_url)
                down_res = None
                # 下载文件流
                async with aiohttp.request('GET', _url) as r:
                    down_res = await r.read()
                # 保存文件
                with open(_path + '/' + os.path.basename(_url), "wb") as code:
                    code.write(down_res)
                return self.json({'code':0, 'msg': '下载成功'})
            elif _type == 'download-tmpfile':
                # 下载临时文件
                print(_url)
                down_res = None
                async with aiohttp.request('GET', _url) as r:
                    down_res = await r.read()
                # 获取临时文件目录
                _path = tempfile.gettempdir()
                backup_path = _path + '/ha_file_explorer_backup.zip'
                with open(backup_path, "wb") as code:
                    code.write(down_res)
                # 解压文件
                fileExplorer.unzip(backup_path, _path + '/ha_file_explorer_backup')
                # 删除下截的备份文件
                fileExplorer.delete(backup_path)
                # 返回文件夹里的数据
                return self.json({'code':0, 'data': fileExplorer.getAllFile(_path + '/ha_file_explorer_backup') , 'msg': '下载成功'})        
            elif _type == 'move-file':
                # 移动文件
                return self.json({ 'code': 0, 'msg': '移动文件成功'})
            elif _type == 'move-tmpfile':
                # 还原数据
                fileExplorer.move(res['list'])
                await fileExplorer.notify("还原成功")
                return self.json({'code':0, 'msg': '还原成功'})
            elif _type == 'update':
                _domain = res['domain']
                _path =  hass.config.path("custom_components").replace('\\','/')
                # https://github.com.cnpmjs.org/shaonianzhentan/$DOMAIN
                with open(_path + '/' + DOMAIN + '/update.sh', 'r', encoding='utf-8') as f:
                    arr = _url.split('/')
                    content = f.read().replace('$PATH', _path).replace('$DOMAIN', _domain).replace('$URL', _url).replace('$PROJECT', arr[len(arr)-1])
                # 获取临时文件目录
                tmp_path = tempfile.gettempdir()
                _sh =  tmp_path + '/' + _domain + '.sh'
                with open(_sh, 'w', encoding='utf-8') as f:
                    f.write(content)
                # 如果是windows则直接运行
                _cmd = 'bash ' + _sh
                if os.name == 'nt':
                    _cmd = _sh
                subprocess.Popen(_cmd, shell=True)
                return self.json({'code':0, 'msg': '正在异步拉取代码，请自行查看是否成功'})        
        except Exception as ex:
            print(ex)
            return self.json({'code': 1, 'msg': f'出现异常：{ex}'})
        return self.json(res)