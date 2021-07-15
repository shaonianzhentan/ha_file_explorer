from shaonianzhentan import fetch_info, async_create_task


async def test():
    res = await fetch_info('https://music.163.com/song/media/outer/url?id=191248')
    print(res)

async_create_task(test())