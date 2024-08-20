const language = {
  en: {
    name: 'File Explorer',
    file: 'File',
    folder: 'Folder',
    upload: 'Upload',
    add: 'Add',
    delete: 'Delete',
    rename: 'Rename',
    edit: 'Edit',
    browse: 'Browse',
    entities: 'Entities',
    command: 'Command',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    currentName: 'Current Name',
    uploadTips: 'Note: files with the same name will be overwritten',
    newName(type: string) {
      return `New ${type} Name`
    },
    deleteConfirm(name: string) {
      return `OK to delete this file【${name}】？`
    }
  },
  cn: {
    name: '文件管理',
    file: '文件',
    folder: '文件夹',
    upload: '上传',
    add: '新增',
    delete: '删除',
    rename: '重命名',
    edit: '编辑',
    browse: '浏览',
    entities: '实体',
    command: '命令',
    save: '保存',
    cancel: '取消',
    confirm: '确定',
    currentName: '当前名称',
    uploadTips: '注意：相同名称文件会被覆盖',
    newName(type: string) {
      return `新${type}名称`
    },
    deleteConfirm(name: string) {
      return `确定删除文件【${name}】？`
    }
  },
  ru: {
    name: "Файловый менеджер",
    file: "файл",
    folder: "папка",
    upload: "загрузить",
    add: "добавить",
    delete: "удалить",
    rename: "переименовать",
    edit: "правка",
    browse: "просмотр",
    entities: "объект",
    command: "команда",
    save: "сохранить",
    cancel: "отменить",
    confirm: "потвердить",
    currentName: "Текушее имя",
    uploadTips: "Примечание: файлы с таким же именем будут перезаписаны",
    newName(type: string) {
      return `New ${type} Name`
    },
    deleteConfirm(name: string) {
      return `Удалить файл【${name}】？`
    }
  },
}

let locales = language.en
try {
  const ha = parent.document.querySelector('home-assistant') as any
  // 判断是否中文
  if (ha) {
    if (ha.hass.language.includes('zh-')) {
      locales = language.cn
    }
    else if (ha.hass.language == 'ru') {
      locales = language.ru
    }
  }
} catch { }
export default locales