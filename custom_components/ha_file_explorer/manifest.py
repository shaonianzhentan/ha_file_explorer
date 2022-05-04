from .file_api import load_json, get_current_path

class Manifest():

    def __init__(self):
        data = load_json(get_current_path('manifest.json'))
        self.domain = data.get('domain')
        self.name = data.get('name')
        self.version = data.get('version')
        self.documentation = data.get('documentation')

    @property
    def remote_url(self):
        return 'https://gitee.com/shaonianzhentan/ha_file_explorer/raw/dev/custom_components/ha_file_explorer/manifest.json'

manifest = Manifest()