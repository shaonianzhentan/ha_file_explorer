import os
from homeassistant.util.json import load_json

CURRENT_PATH = os.path.dirname(__file__)

class Manifest():

    def __init__(self):
        self.manifest_path = f'{CURRENT_PATH}/manifest.json'
        self.update()

    def update(self):
        data = load_json(self.manifest_path, {})
        self.domain = data.get('domain')
        self.name = data.get('name')
        self.version = data.get('version')
        self.documentation = data.get('documentation')

manifest = Manifest()