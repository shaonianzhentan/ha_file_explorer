from homeassistant.components.http import HomeAssistantView
from .file_api import delete_file, get_dir_list, mkdir, load_content, save_content

from .manifest import manifest

DOMAIN = manifest.domain
API_URL = f"/{DOMAIN}-api"

class HttpApi(HomeAssistantView):

    url = API_URL
    name = DOMAIN
    requires_auth = True
    
    async def post(self, request):
        hass = request.app["hass"]
        res = await request.json()
        _type = res.get('type', '')
        _url = res.get('url', '')
        data = res.get('data', '')
        _path = hass.config.path('') + '/' +  res.get('path', '').lstrip('/')
        try:
            if _type == 'get':
                data = get_dir_list(_path)
                return self.json(data)
            elif _type == 'get-content':
                data = load_content(_path)
                return self.json({ 'code': 0, 'data': data})
            elif _type == 'delete':
                delete_file(_path)
                return self.json({ 'code': 0, 'msg': '删除成功'})
            elif _type == 'new-file':
                save_content(_path, data)
                return self.json({ 'code': 0, 'msg': '保存成功'})
            elif _type == 'new-dir':
                mkdir(_path)
                return self.json({ 'code': 0, 'msg': '新建成功'})
        except Exception as ex:
            print(ex)
            return self.json({'code': 1, 'msg': f'出现异常：{ex}'})
        return self.json(res)