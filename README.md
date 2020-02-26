# ha_file_explorer
在HA里使用的文件管理器



## 使用方式


```
# 正常使用
ha_file_explorer:

```

```

# 完整配置
ha_file_explorer:
  sidebar_title: 文件管理
  sidebar_icon: mdi:folder
  access_key: 七牛云配置
  secret_key: 七牛云配置
  bucket_name: 七牛云配置
  prefix: 七牛云上传文件前缀(用来区分多个HA)
```


## 更新日志

### v1.4
- 加入七牛云备份功能

### v1.3
- 修复隐藏文件夹不显示的问题
- 修复隐藏文件不能编辑的问题
- 修复在HA的APP中不能使用的问题

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