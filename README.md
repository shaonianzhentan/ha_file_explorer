# File Explorer
在HA里使用的文件管理器

[![hacs_badge](https://img.shields.io/badge/Home-Assistant-%23049cdb)](https://www.home-assistant.io/)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)

![visit](https://visitor-badge.glitch.me/badge?page_id=shaonianzhentan.ha_file_explorer&left_text=visit)
![forks](https://img.shields.io/github/forks/shaonianzhentan/ha_file_explorer)
![stars](https://img.shields.io/github/stars/shaonianzhentan/ha_file_explorer)
![license](https://img.shields.io/github/license/shaonianzhentan/ha_file_explorer)

## 安装方式

安装完成重启HA，刷新一下页面，在集成里搜索`文件管理`即可

[![Add Integration](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start?domain=ha_file_explorer)


定时备份

[![导入蓝图](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2Fshaonianzhentan%2Fha_file_explorer%2Fblob%2Fmaster%2Fblueprints%2Fbackup.yaml)


## 更新日志

### v2.7.7
- 增加新的GitHub代理源
- 增加云备份列表前缀显示
- 备份文件加上HA版本号
- 单个文件压缩目录结构调整

### v2.7.6
- 支持图标显示
- 增加自动备份蓝图
- 修复多层iframe嵌套下文件管理器不能使用的问题
- HACS换源替换为最新版
- 解决图标加载太慢的问题

### v2.7.2
- 注意：如使用云备份功能，则需要重新配置密钥
- 仅支持集成安装
- 删除七牛配置服务

### v2.7
- 支持无需云服务，也能备份文件
- 增加本地备份文件还原功能
- 过滤HA数据库相关文件
- 离开时增加弹窗阻止，防止正在编辑的数据被刷掉
- 修复文件无法下载的问题
- 修复部分格式在编辑时无法高亮的问题
- 我的插件使用远程配置
- 修复在新版HA里无法隐藏头部的问题

### v2.6
- 增加一键换源功能
- 使用cdn解决外网加载速度慢的问题
- 优化`upload服务`文件过滤
- 调整蓝图添加按钮显示层级
- 全部使用CDN加速链接，减少体积，优化加载速度
- 修改文件名等操作支持Enter键确定

### v2.5.4
- 新增下载文件功能
- 新增移动文件功能
- 新增蓝图添加功能
- 新增zip解压功能
- [x] 七牛云支持搜索
- [x] 使用服务配置七牛云相关密钥

### v2.5
- [x] 插件界面
- [x] 编辑功能
- [x] 新建文件和文件夹
- [x] 删除文件和文件夹
- [x] 上传文件和文件夹
- [x] 重命名文件和文件夹
- [x] 支持回车操作
- [x] 七牛云备份列表
- [x] 七牛云文件备份
- [x] 七牛云文件还原
- [x] 七牛云文件名称加上年
- [x] 加入重载功能
- [x] 快速跳转到自动化编辑界面
- 使用离线字体文件
- 使用离线字体样式
- 备份文件名隐藏默认前缀
- 点击文件导航可刷新文件列表
- 支持`Ctrl + S`快捷键保存文件
- 支持从多种代理源拉取Github组件

### v2.4
- `www目录`加入浏览器打开菜单
- 删除重载服务
- 支持集成添加
- 调整主界面
- 可以不用安装依赖直接运行
- 调整我的插件入口
- 上传服务支持过滤文件目录参数

### v2.3
- 解决在window下无法使用云备份的问题
- 过滤media和当前组件目录
- 加入pip模块`asgiref`
- 拉取生成的sh文件放到临时目录
- 优化项目拉取速度
- 更改压缩文件名
- 修复还原问题

### v2.2
- 更新外部资源到本地，没网也能使用
- 将备份文件放到临时文件夹操作
- 使用子线程开启拉取功能
- 新增上传文件夹功能
- 升级qiniu依赖库
- 优化界面

### v2.1
- 新增备份上传服务
- 修复上传异常兼容性问题
- 新增删除云备份功能
- 升级依赖库到最新版本

### v2.0
- 上传文件可以修改名称
- 新增下载网络文件的功能
- 修复编辑页面主题未同步的问题
- 按名称降序排列

### v1.9
- 主题跟着系统变
- 加入文件上传功能
- 调整更新列表
- 修复备份列表出错不提示的问题

### v1.8
- 支持新建文件夹
- 备份列表排序
- 添加拉取其它GitHub项目功能
- 修改备份目录
- 支持还原备份的文件夹

### v1.7
- 加入拉取最新代码测试功能
- 文件列表分类排序
- 删除WebLink引入，兼容HomeAssistant 0.107版本

### v1.6
- 加入备份全选功能
- 修复云备份列表时间错误的问题
- 云备份过滤掉tts目录
- 修复无法打开空目录的问题
- 支持显示文件夹占用空间大小
- 修复切换目录时，编辑框无法隐藏的问题
- 修复列表接口读取文件偶尔错误的问题
- 修复更新逻辑错误

### v1.5
- 加入新建文件的功能
- 修复服务配置错误的问题

### v1.4
- 加入单个(文件/文件夹)备份
- 查询云端文件列表
- 备份文件上传后自动删除本地临时文件
- 移动端加入HA菜单功能（可控制HA菜单的隐藏显示）
- 加入重新加载功能（无需重启HA就能升级本组件）

### v1.3
- 修复隐藏文件夹不显示的问题
- 修复隐藏文件不能编辑的问题
- 修复在HA的APP中不能使用的问题
- 加入七牛云备份功能

### v1.2
- 调整打开方式
- 加入删除功能
- 修复菜单被隐藏的问题
- 修复小屏幕操作菜单换行的问题

### v1.1
- 加入文本格式编辑器
- 修复html文件直接被解析的问题
- 隐藏头部标题
- 修复py文件格式显示不正确的问题

### v1.0
- 实现查看功能
- 文本编辑功能


## 如果这个项目对你有帮助，请我喝杯<del style="font-size: 14px;">咖啡</del>奶茶吧😘
|  |支付宝|微信|
|---|---|---|
奶茶= | <img src="https://github.com/shaonianzhentan/ha-docs/raw/master/docs/img/alipay.png" align="left" height="160" width="160" alt="支付宝" title="支付宝">  |  <img src="https://github.com/shaonianzhentan/ha-docs/raw/master/docs/img/wechat.png" align="left" height="160" width="160" alt="微信支付" title="微信">


#### 关注我的微信订阅号，了解更多HomeAssistant相关知识
<img src="https://github.com/shaonianzhentan/ha-docs/raw/master/docs/img/wechat-channel.png" align="left" height="160" alt="HomeAssistant家庭助理" title="HomeAssistant家庭助理"> 


