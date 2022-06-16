import os, shutil, uuid, yaml, logging, aiohttp, json, urllib, hashlib, datetime, asyncio, base64, re, zipfile, tempfile, time

# 获取当前路径
def get_current_path(file_path):
    return os.path.abspath('./custom_components/ha_file_explorer/' + file_path)

# 获取当前文件列表
def get_dir_list(dir):
    allcontent = os.listdir(dir)
    dirItem    = []
    for item in allcontent:
        # 获取文件路径
        path_name = os.path.join(dir,item)
        # 判断当前路径是否存在
        if os.path.exists(path_name) == False:
            continue
        hashInfo = {}
        listInfo = os.stat(path_name)
        hashInfo['name'] = item
        hashInfo['path']  = item
        hashInfo['time'] = datetime.datetime.fromtimestamp(int(listInfo.st_mtime)).strftime('%Y-%m-%d %H:%M:%S')

        if os.path.isfile(path_name):
            hashInfo['type'] = 'file'
            hashInfo['size'] = int(listInfo.st_size)
        if os.path.isdir(path_name):
            hashInfo['type'] = 'dir'
            hashInfo['size'] = get_dir_size(path_name)
        # 显示格式化文件大小
        hashInfo['size_name'] = format_byte(hashInfo['size'])
        dirItem.append(hashInfo)
    # 以名称排序
    dirItem.sort(key=lambda x: x['name'], reverse=True)
    return dirItem

# 创建目录
def mkdir(path):
    if os.path.isdir(path) == False:
        folders = []
        while not os.path.isdir(path):
            path, suffix = os.path.split(path)
            folders.append(suffix)
        for folder in folders[::-1]:
            path = os.path.join(path, folder)
            os.mkdir(path)

# 获取目录大小
def get_dir_size(dir):
    size = 0
    for root, dirs, files in os.walk(dir):
        size += sum([os.path.getsize(os.path.join(root, name)) for name in files])
    return size

# 格式化文件大小的函数
def format_byte(number):
    for (scale, label) in [(1024*1024*1024, "GB"), (1024*1024,"MB"), (1024,"KB")]:
        if number >= scale:
            return "%.2f %s" %(number*1.0/scale, label)
        elif number == 1:
            return "1字节"
        else:  #小于1字节
            byte = "%.2f" % (number or 0)
            return ((byte[:-3]) if byte.endswith(".00") else byte) + "字节"

# 删除文件
def delete_file(file_path):
    if os.path.exists(file_path):
        if os.path.isfile(file_path):
            # 删除文件
            os.remove(file_path)
        elif os.path.isdir(file_path):
            # 删除目录
            shutil.rmtree(file_path, ignore_errors=True)

# 移动文件
def move_file(source_file, target_file):
    # 创建目录
    lastIndex = target_file.replace('\\','/').rindex('/')
    _dir = target_file[0:lastIndex]
    if os.path.isdir(_dir) == False:
        mkdir(_dir)
    shutil.move(source_file, target_file)

# 复制文件
def copy_file(source_file, target_file):
    # 创建目录
    lastIndex = target_file.replace('\\','/').rindex('/')
    _dir = target_file[0:lastIndex]
    if os.path.isdir(_dir) == False:
        mkdir(_dir)
    shutil.copy2(source_file, target_file)

# 加载yaml
def load_yaml(file_path):
    # 不存在则返回空字典
    if os.path.exists(file_path) == False:
        return {}
    fs = open(file_path, encoding="UTF-8")
    data = yaml.load(fs, Loader=yaml.FullLoader)
    return data

# 存储为yaml
def save_yaml(file_path, data):
    _dict = {}
    _dict.update(data)
    with open(file_path, 'w') as f:
        yaml.dump(_dict, f)

# 加载json
def load_json(file_path):
    # 不存在则返回空字典
    if os.path.exists(file_path) == False:
        return {}
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data

# 存储为json
def save_json(file_path, data):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)

# 加载内容
def load_content(file_path):
    fp = open(file_path, 'r', encoding='UTF-8')
    content = fp.read()
    fp.close()
    return content

# 保存内容
def save_content(file_path, data):
    fp = open(file_path, 'w+', encoding='UTF-8')
    fp.write(data)
    fp.close()

# base64数据生成文件
def base64_to_file(base64_data, file):
    ori_image_data = base64.b64decode(base64_data)
    fout = open(file, 'wb')
    fout.write(ori_image_data)
    fout.close()

def load_json(file_path):
    # 不存在则返回空字典
    if os.path.exists(file_path) == False:
        return {}
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data

async def download(url, file_path):
    headers = {'User-agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; de; rv:1.9.1.5) Gecko/20091102 Firefox/3.5.5'}
    connector = aiohttp.TCPConnector(verify_ssl=False)
    async with aiohttp.ClientSession(headers=headers, connector=connector) as session:
        async with session.get(url) as response:
            file = await response.read()
            with open(file_path, 'wb') as f:
                f.write(file)