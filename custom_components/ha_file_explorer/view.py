import os, logging, time, importlib, base64, json, string, sys, requests, urllib, aiohttp, subprocess, tempfile, re
from aiohttp import web
from homeassistant.util import package
from homeassistant.components.http import HomeAssistantView
from .util import pip_install
from .const import DOMAIN, VERSION, URL, ROOT_PATH
from .shaonianzhentan import move_file, github_url, download, mkdir, load_content, save_content, fetch_text

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
            print(reader)
            # 读取路径
            res_path = await reader.next()
            file_path = await res_path.text()
            print(file_path)
            # 获取文件名称
            arr = file_path.split('/')
            file_name = arr[-1]
            # 文件夹路径
            folder_path = '/'.join(arr[0:-1])
            # 保存文件
            file = await reader.next()
            # 生成文件
            _path = hass.config.path(f"./{folder_path}")
            if os.path.isdir(_path) == False:
                fileExplorer.mkdir(_path)
            filename = f"{_path}/{file_name}"
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
        _path = hass.config.path('') + '/' +  res.get('path', '').lstrip('/')
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
            elif _type == 'unzip':
                # 解压文件
                zip_path = _path + '解压目录'
                print(_path)
                fileExplorer.unzip(_path, zip_path)
                return self.json({ 'code': 0, 'msg': '解压成功'})
            elif _type == 'download-file':
                # 下载文件
                r = web.FileResponse(_path)
                r.enable_compression()
                return r
            elif _type == 'download-url':
                # 下载网络文件到文件夹
                await download(_url, f"{_path}/{os.path.basename(_url)}")
                return self.json({'code':0, 'msg': '下载成功'})
            elif _type == 'download-tmpfile':
                # 下载临时文件
                print(_url)
                # 获取临时文件目录
                _path = tempfile.gettempdir()
                backup_path = _path + '/ha_file_explorer_backup.zip'
                await download(_url, backup_path)
                # 解压文件
                fileExplorer.unzip(backup_path, _path + '/ha_file_explorer_backup')
                # 删除下截的备份文件
                fileExplorer.delete(backup_path)
                # 返回文件夹里的数据
                return self.json({'code':0, 'data': fileExplorer.getAllFile(_path + '/ha_file_explorer_backup') , 'msg': '下载成功'})        
            elif _type == 'rename':
                rename_path = hass.config.path(f"./{res['rename_path']}")
                os.rename(_path, rename_path)
                return self.json({ 'code': 0, 'msg': '重命名成功'})
            ## ====================== 七牛云 ==========================
            elif _type == 'qn-list':
                if fileExplorer.q is None:
                    return self.json({ 'code': 1, 'msg': '请配置七牛云相关密钥信息'})
                try:
                    res = await fileExplorer.q.get_list(res.get('name', ''))
                    # print('测试一下：', res)
                    return self.json({ 'code': 0, 'msg': '获取备份列表', 'data': res})
                except Exception as e:
                    print(e)
                    return self.json({ 'code': 1, 'msg': '备份列表获取异常，请检查是否正确配置七牛云密钥'})
            elif _type == 'qn-upload':
                if fileExplorer.q is None:
                    return self.json({ 'code': 1, 'msg': '请配置七牛云相关密钥信息'})
                if 'path' in res:
                    zf = fileExplorer.zipdir(res['path'])
                elif 'list' in res:
                    # 压缩多个文件
                    zf = fileExplorer.zip(res['list'])
                try:
                    await fileExplorer.q.upload(zf)
                    # 上传成功，删除文件
                    fileExplorer.delete(zf)
                    return self.json({ 'code': 0, 'msg': '上传成功'})
                except Exception as ex:
                    print(ex)
                    return self.json({ 'code': 1, 'msg': '上传错误，一般是七牛云不能创建配置文件的权限问题'})
            elif _type == 'qn-delete':
                if fileExplorer.q is None:
                    return self.json({ 'code': 1, 'msg': '请配置七牛云相关密钥信息'})
                await fileExplorer.q.delete(res.get('key'))
                return self.json({ 'code': 0, 'msg': '删除成功'})
            ## ====================== 移动文件 ==========================
            elif _type == 'move-file':
                # 移动文件
                move_file(hass.config.path(f'./{_url}'), _path)
                return self.json({ 'code': 0, 'msg': '移动文件成功'})
            elif _type == 'move-tmpfile':
                # 还原数据
                fileExplorer.move(res['list'])
                await fileExplorer.notify("还原成功")
                return self.json({'code':0, 'msg': '还原成功'})
            elif _type == 'install-blueprint':
                git = github_url(_url)
                if git is None:
                    return self.json({'code':1, 'msg': 'GitHub URL地址不正确'})
                # 新建目录
                dir_name = hass.config.path(f"./blueprints/automation/{git['author']}")
                mkdir(dir_name)
                await download(git['url'], f"{dir_name}/{git['file_name']}")
                return self.json({'code':0, 'msg': '下载安装成功'})
            elif _type == 'update-source':
                # 换pip源
                if _url == 'pip':
                    os.system('pip3 config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple')
                elif _url == 'github':
                    # 换github源
                    hosts_file = '/etc/hosts'
                    old_hosts_content = load_content(hosts_file)
                    githosts = await fetch_text('https://raw.fastgit.org/521xueweihan/GitHub520/main/hosts')
                    # 检测是否已经添加
                    reg = re.match(r".*(# GitHub520 Host Start.*# GitHub520 Host End)", old_hosts_content, flags = re.S)
                    if reg is None:
                        new_hosts_content = old_hosts_content + githosts
                    else:
                        new_hosts_content = old_hosts_content.replace(reg.groups(0)[0], githosts)
                    save_content(hosts_file, new_hosts_content)
                elif _url == 'hacs':
                    # 修改hacs下载文件
                    hass_download_file = hass.config.path('custom_components/hacs/helpers/functions/download.py')
                    old_content = load_content(hass_download_file)
                    if 'cdn.jsdelivr.net' not in old_content:
                        new_content = old_content.replace('_LOGGER.debug("Downloading %s", url)', '''
    _LOGGER.debug("Downloading %s", url)
    if "https://raw.githubusercontent.com" in url:
        arr = url.replace("https://raw.githubusercontent.com/", "").split("/")
        arr[1] = arr[1] + "@" + arr[2]
        arr[2] = ""
        _list = ["https://cdn.jsdelivr.net/gh"]
        for item in arr:
            if item != "":
                _list.append(item)
        url = "/".join(_list)
        _LOGGER.debug("下载链接： %s", url)
        ''')
                        save_content(hass_download_file, new_content)
                return self.json({'code':0, 'msg': '更新成功'})
            elif _type == 'install-package':
                # 安装依赖包
                package_name = _url
                if package.is_installed(package_name) == False:
                    package.install_package(package_name)
                    return self.json({'code':0, 'msg': '正在更新依赖包'})
                return self.json({'code':0, 'msg': '已经安装成功啦'})
            elif _type == 'update-package':
                # 更新系统依赖包
                data = pip_install(_url)
                return self.json({'code':0, 'data': data, 'msg': '更新依赖包完成'})
            elif _type == 'update':
                # 拉取组件
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