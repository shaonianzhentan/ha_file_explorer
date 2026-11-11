# File Explorer

file explorer for home assistant

[![hacs_badge](https://img.shields.io/badge/Home-Assistant-%23049cdb)](https://www.home-assistant.io/)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
![forks](https://img.shields.io/github/forks/shaonianzhentan/ha_file_explorer)
![stars](https://img.shields.io/github/stars/shaonianzhentan/ha_file_explorer)
![license](https://img.shields.io/github/license/shaonianzhentan/ha_file_explorer)
![visit](https://visitor-badge.laobi.icu/badge?page_id=shaonianzhentan.ha_file_explorer&left_text=visit)

English | [简体中文](README.zh.md)

## Installation

After installation, restart home assistant, refresh the page and search for `ha_file_explorer` in the integration

[![Add Integration](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start?domain=ha_file_explorer)

## Features

- [x] create new file or new folder
- [x] delete file or folder
- [x] upload files or folder
- [x] rename file or folder
- [x] modify file content
- [x] download files or folders (as a zip)
- [x] filter by name, browse `/local` files
- [x] native HA custom panel: ES module, no iframe
- [x] follows the active Home Assistant theme (light/dark) and language (en / zh / ru)

## How it works

The integration registers a native HA `custom` panel with
`async_register_built_in_panel(..., component_name="custom")`. Home Assistant
loads `www/ha-file-explorer.js` as an ES module and mounts the
`<ha-file-explorer-panel>` web component, passing `hass`, `panel`, `narrow`
and `route`. Because the panel runs inside the main HA document instead of an
iframe, all colors come from HA theme CSS variables and API calls are
authenticated with `hass.fetchWithAuth`.

Module files are served from a versioned URL
(`/ha_file_explorer-assets/<version>/...`), so an upgrade never leaves a stale
cached panel behind.

## Development

No build step, no npm dependencies and no external CDN:

```text
custom_components/ha_file_explorer/
├── __init__.py          # panel registration
├── config_flow.py
├── file_api.py          # filesystem helpers
├── http_api.py          # REST API
├── manifest.py
├── manifest.json
└── www/
    ├── ha-file-explorer.js   # custom element (entry ES module)
    └── modules/              # api / i18n / format / styles modules
```

Edit the JS files directly and hard-refresh HA. When publishing a change, bump
`version` in `manifest.json` so the module URL changes and browser caches are
invalidated.

## Screenshot

![pic](https://cdn.jsdelivr.net/gh/shaonianzhentan/image@main/ha_file_explorer/ha_file_explorer.png)

## If this project is helpful to you, please donate a cup of <del style="font-size: 14px;">coffee</del> milk tea 😘
| |Paypal|Alipay|WeChat|
|---|---|---|---|
Milk tea | <a href="https://paypal.me/shaonianzhentan"><img src="https://raw.githubusercontent.com/shaonianzhentan/image/main/picture/paypal.me.png" height="160" alt="https://paypal.me/shaonianzhentan" title="Paypal.me"></a> | <img src="https://github.com/shaonianzhentan/image/raw/main/ha_wechat/pay_alipay.png" align="left" height="160" width="160" alt="Alipay" title="Alipay"> | <img src="https://github.com/shaonianzhentan/image/raw/main/ha_wechat/pay_wechat.png" height="160" width="160" alt="WeChat Pay" title="WeChat">

## Follow my wechat subscription number
<img src="https://github.com/shaonianzhentan/image/raw/main/ha_wechat/wechat-channel.png" height="160" alt="HomeAssistant家庭助理" title="HomeAssistant家庭助理">
