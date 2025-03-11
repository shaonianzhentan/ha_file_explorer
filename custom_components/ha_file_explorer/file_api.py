import os, shutil, uuid, yaml, logging, aiohttp, json, urllib, hashlib, datetime, asyncio, base64, re, zipfile, tempfile, time

# 获取当前文件列表
def get_dir_list(dir):
    allcontent = os.listdir(dir)
    dirItem    = []
    for item in allcontent:
        try:
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
        except Exception as ex:
            print(ex)
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
def format_byte(res):
    bu = 1024
    if res < bu:
        res = f'{bu}B'
    elif bu <= res < bu**2:
        res = f'{round(res / bu, 2)}KB'
    elif bu**2 <= res < bu**3:
        res = f'{round(res / bu**2, 2)}MB'
    elif bu**3 <= res < bu**4:
        res = f'{round(res / bu**3, 2)}GB'
    elif bu**4 <= res < bu**5:
        res = f'{round(res / bu**4, 2)}TB'
    return res

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

# 创建文件夹的zip压缩包
def create_folder_zip(folder_path, zip_path=None):
    """
    将指定文件夹压缩为zip文件
    
    Args:
        folder_path: 要压缩的文件夹路径
        zip_path: 压缩文件保存路径，如果为None则使用临时文件
        
    Returns:
        zip文件的路径
    """
    if not os.path.isdir(folder_path):
        raise ValueError(f"{folder_path} 不是一个有效的文件夹")
    
    # 如果没有指定zip_path，则创建临时文件
    if zip_path is None:
        fd, zip_path = tempfile.mkstemp(suffix='.zip')
        os.close(fd)
    
    # 获取文件夹的基本名称
    folder_name = os.path.basename(folder_path)
    
    # 创建zip文件
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # 遍历文件夹中的所有文件和子文件夹
        for root, dirs, files in os.walk(folder_path):
            # 计算相对路径
            rel_path = os.path.relpath(root, os.path.dirname(folder_path))
            if rel_path == '.':
                rel_path = folder_name
            else:
                rel_path = os.path.join(folder_name, rel_path)
            
            # 添加空文件夹
            if not files and not dirs:
                zipf.writestr(f"{rel_path}/", "")
            
            # 添加文件
            for file in files:
                file_path = os.path.join(root, file)
                # 计算在zip中的路径
                zip_path_in_archive = os.path.join(rel_path, file)
                zipf.write(file_path, zip_path_in_archive)
    
    return zip_path