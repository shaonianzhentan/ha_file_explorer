import os, shutil, uuid, yaml, logging, aiohttp, json, urllib, hashlib, datetime, asyncio, base64, re

_LOGGER = logging.getLogger(__name__)

''' ---------------------- 文件操作 --------------------------- '''
# 获取当前路径
def get_current_path(file_path):
    return os.path.abspath(file_path)

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
            return "%.2f %s" %(number*1.0/scale,lable)
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
def base64_to_file(self, base64_data, file):
    ori_image_data = base64.b64decode(base64_data)
    fout = open(file, 'wb')
    fout.write(ori_image_data)
    fout.close()

''' ---------------------- 其它操作 --------------------------- '''
# 执行异步方法
def async_create_task(async_func):
    loop = asyncio.get_event_loop()
    loop.run_until_complete(async_func)

# MD5加密
def md5(data):
    return hashlib.md5(data.encode(encoding='UTF-8')).hexdigest()

# 获取本机MAC地址
def get_mac_address(): 
    mac=uuid.UUID(int = uuid.getnode()).hex[-12:] 
    return ":".join([mac[e:e+2] for e in range(0,11,2)])

# 获取本机MAC地址
def get_mac_address_key(): 
    mac=uuid.UUID(int = uuid.getnode()).hex[-12:] 
    return "".join([mac[e:e+2] for e in range(0,11,2)])

# 显示日志
def log(*args):
    _LOGGER.info(*args)

def debug(*args):
    _LOGGER.debug(*args)

''' ---------------------- HASS操作 --------------------------- '''

# 通知
def notify(hass, title, message, notification_id = 'shaonianzhentan'):
    hass.async_create_task(hass.services.async_call('persistent_notification', 'create', {
        "title": title,
        "message": message,         
        "notification_id": notification_id
    }))

# 注册服务
def register_service(hass, domain, service, func):
    if hass.services.has_service(domain, service) == False:
        hass.async_create_task(hass.services.async_register(domain, service, func))

# 添加面板
def sidebar_add(hass, name, icon, path, url):
    sidebar_remove(hass, path)
    hass.components.frontend.async_register_built_in_panel("iframe", name, icon, path, {"url": url}, require_admin=False)

# 移除面板
def sidebar_remove(hass, path):
    if path in hass.data.get("frontend_panels", {}):
        hass.components.frontend.async_remove_panel(path)

''' ---------------------- GitHub --------------------------- '''
# GitHub地址
def github_url(url):
    GITHUB_FILE_PATTERN = re.compile(
        r"^https://github.com/(?P<repository>.+)/blob/(?P<path>.+)$"
    )
    match = GITHUB_FILE_PATTERN.match(url)
    if match is not None:
        repo, path = match.groups()
        author = repo.split('/')[0]
        file_name = path.split('/')[-1]
        return {
            'author': author,
            'file_name': file_name,
            'url': f"https://raw.fastgit.org/{repo}/{path}"
        }

''' ---------------------- HTTP库 --------------------------- '''

def escape(name):
    return urllib.parse.quote(name)

def unescape(name):
    return urllib.parse.unquote(name)

# 获取HTTP内容
async def fetch_text(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
        'Referer': url
    }
    text = None
    async with aiohttp.ClientSession(headers=headers) as session:
        async with session.get(url) as resp:
            text = await resp.text()
    return text

# 获取HTTP内容JSON格式
async def fetch_json(url):
    text = await fetch_text(url)
    result = {}
    if text is not None:
        result = json.loads(text)
    return result

# 获取HTTP请求信息
async def fetch_info(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return {
              'status': response.status,
              'url': str(response.url)
            }

# 下载文件
async def download(url, file_path):
    headers = {'User-agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; de; rv:1.9.1.5) Gecko/20091102 Firefox/3.5.5'}
    async with aiohttp.ClientSession(headers=headers) as session:
        async with session.get(url) as response:
            file = await response.read()
            with open(file_path, 'wb') as f:
                f.write(file)

# 判断是否数字
def is_number(s):
    result = re.match(r'\d+', s)
    if result:
        return True
    else:
        return False

# 格式化数字
def format_number(num):
    if is_number(num) == False:
        num = chinese2digits(num)
    return float(num)
########################################## 去掉前后标点符号
def trim_char(text):
    return text.strip(' 。，、＇：∶；?‘’“”〝〞ˆˇ﹕︰﹔﹖﹑·¨….¸;！´？！～—ˉ｜‖＂〃｀@﹫¡¿﹏﹋﹌︴々﹟#﹩$﹠&﹪%*﹡﹢﹦﹤‐￣¯―﹨ˆ˜﹍﹎+=<­­＿_-\ˇ~﹉﹊（）〈〉‹›﹛﹜『』〖〗［］《》〔〕{}「」【】︵︷︿︹︽_﹁﹃︻︶︸﹀︺︾ˉ﹂﹄︼')

########################################## 汉字转数字
common_used_numerals_tmp ={'零':0, '一':1, '二':2, '两':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9, '十':10, '百':100, '千':1000, '万':10000, '亿':100000000}
common_used_numerals = {}
for key in common_used_numerals_tmp:
  common_used_numerals[key.encode('cp936').decode('cp936')] = common_used_numerals_tmp[key]

def chinese2digits(uchars_chinese):
    try:
        uchars_chinese = uchars_chinese.encode('cp936').decode('cp936')
        total = 0
        r = 1              #表示单位：个十百千...
        for i in range(len(uchars_chinese) - 1, -1, -1):
            val = common_used_numerals.get(uchars_chinese[i])
            if val >= 10 and i == 0:  #应对 十三 十四 十*之类
                if val > r:
                    r = val
                    total = total + val
                else:
                    r = r * val
                #total =total + r * x
            elif val >= 10:
                if val > r:
                    r = val
                else:
                    r = r * val
            else:
                total = total + r * val
        return total
    except Exception as ex:
        return None