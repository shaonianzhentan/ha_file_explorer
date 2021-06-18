
import shaonianzhentan, re
from shaonianzhentan import load_content, save_content, fetch_text

async def save_host():
    hosts_file = 'D:/code/git/hosts'
    old_hosts_content = load_content(hosts_file)
    githosts = await fetch_text('https://raw.fastgit.org/521xueweihan/GitHub520/main/hosts')
    # 检测是否已经添加
    reg = re.match(r".*(# GitHub520 Host Start.*# GitHub520 Host End)", old_hosts_content, flags = re.S)
    if reg is None:
        new_hosts_content = old_hosts_content + githosts
    else:
        new_hosts_content = old_hosts_content.replace(reg.groups(0)[0], githosts)
    save_content(hosts_file, new_hosts_content)

shaonianzhentan.async_create_task(save_host())