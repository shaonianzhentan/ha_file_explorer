# File Explorer
在HA里使用的文件管理器

[![hacs_badge](https://img.shields.io/badge/Home-Assistant-%23049cdb)](https://www.home-assistant.io/)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
![forks](https://img.shields.io/github/forks/shaonianzhentan/ha_file_explorer)
![stars](https://img.shields.io/github/stars/shaonianzhentan/ha_file_explorer)
![license](https://img.shields.io/github/license/shaonianzhentan/ha_file_explorer)
![visit](https://visitor-badge.laobi.icu/badge?page_id=shaonianzhentan.ha_file_explorer&left_text=visit)

[English](README.md) | 简体中文

## 安装

安装完成重启HA，刷新一下页面，在集成里搜索`文件管理`即可

[![Add Integration](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start?domain=ha_file_explorer)

## 功能

- [x] 创建文件或文件夹
- [x] 删除文件或文件夹
- [x] 上传文件或文件夹
- [x] 重命名文件或文件夹
- [x] 修改文件内容
- [x] 下载文件或文件夹（自动打包为 zip）
- [x] 按名称筛选、浏览 `/local` 文件
- [x] 原生 HA 自定义面板：ES module 加载，不使用 iframe
- [x] 跟随 HA 主题（亮色/暗色）与语言（中文/英文/俄文）

## 实现方式

集成通过 `async_register_built_in_panel(..., component_name="custom")` 注册原生
自定义面板。HA 以 ES module 方式加载 `www/ha-file-explorer.js`，挂载
`<ha-file-explorer-panel>` Web Component，并注入 `hass`、`panel`、`narrow`、
`route`。面板运行在 HA 主页面里（没有 iframe），因此颜色全部取自 HA 主题
CSS 变量，接口请求通过 `hass.fetchWithAuth` 自动携带认证信息。

静态模块使用带版本号的路径（`/ha_file_explorer-assets/<version>/...`），
升级集成后不会出现浏览器缓存旧面板的问题。

## 开发说明

无需构建、无需 npm 依赖、不加载任何外部 CDN：

```text
custom_components/ha_file_explorer/
├── __init__.py          # 面板注册
├── config_flow.py
├── file_api.py          # 文件系统操作
├── http_api.py          # REST 接口
├── manifest.py
├── manifest.json
└── www/
    ├── ha-file-explorer.js   # 自定义元素（入口 ES module）
    └── modules/              # api / i18n / format / styles 模块
```

直接修改 JS 文件后强制刷新页面即可。发布新版本时请更新 `manifest.json` 里的
`version`，以便模块 URL 变化、浏览器缓存自动失效。

## 预览

![pic](https://github.com/shaonianzhentan/image/raw/main/ha_file_explorer/ha_file_explorer.png)


## 如果这个项目对你有帮助，请我喝杯<del style="font-size: 14px;">咖啡</del>奶茶吧😘
|  |支付宝|微信|
|---|---|---|
奶茶= | <img src="https://github.com/shaonianzhentan/image/raw/main/ha_wechat/pay_alipay.png" align="left" height="160" width="160" alt="支付宝" title="支付宝">  |  <img src="https://github.com/shaonianzhentan/image/raw/main/ha_wechat/pay_wechat.png" height="160" width="160" alt="微信" title="微信">

## 关注我的微信订阅号，了解更多HomeAssistant相关知识
<img src="https://github.com/shaonianzhentan/image/raw/main/ha_wechat/wechat-channel.png" height="160" alt="HomeAssistant家庭助理" title="HomeAssistant家庭助理">

---
**在使用的过程之中，如果遇到无法解决的问题，付费咨询请加Q`635147515`**
