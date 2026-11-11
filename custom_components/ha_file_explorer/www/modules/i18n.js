/** UI strings, selected from the active Home Assistant language. */

const STRINGS = {
  en: {
    title: "File Explorer",
    file: "file",
    folder: "folder",
    folders: "Folders",
    files: "Files",
    home: "HA root",
    up: "Parent folder",
    refresh: "Refresh",
    filterPlaceholder: "Filter by name",
    emptyFolders: "No folders",
    emptyFiles: "No files",
    newFile: "New file",
    newFolder: "New folder",
    uploadFiles: "Upload files",
    uploadFolder: "Upload folder",
    downloadFolder: "Download folder",
    renameFolder: "Rename folder",
    deleteFolder: "Delete folder",
    open: "Open",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    close: "Close",
    rename: "Rename",
    delete: "Delete",
    edit: "Edit",
    download: "Download",
    browse: "Browse",
    currentName: "Current name",
    overwriteHint: "Note: files with the same name will be overwritten.",
    unsupportedEdit: "This file format cannot be edited as text.",
    saved: "Saved",
    savedError: "Save failed",
    requestFailed: "Request failed",
    noFiles: "Please select files first",
    version: "Version",
    author: "Author",
    link: "Project link",
    readOnly: "Read only",
    unsaved: "You have unsaved changes. Discard them?",
    newName(type) {
      return `New ${type} name`;
    },
    uploadSuccess(total, success) {
      return `Uploaded ${success} of ${total} files`;
    },
    downloadConfirm(name) {
      return `Download "${name}"?`;
    },
    deleteConfirm(name) {
      return `Delete "${name}"? This cannot be undone.`;
    },
  },
  zh: {
    title: "文件管理",
    file: "文件",
    folder: "文件夹",
    folders: "文件夹",
    files: "文件",
    home: "HA 根目录",
    up: "上一级",
    refresh: "刷新",
    filterPlaceholder: "按名称筛选",
    emptyFolders: "暂无文件夹",
    emptyFiles: "暂无文件",
    newFile: "新建文件",
    newFolder: "新建文件夹",
    uploadFiles: "上传文件",
    uploadFolder: "上传文件夹",
    downloadFolder: "下载文件夹",
    renameFolder: "重命名文件夹",
    deleteFolder: "删除文件夹",
    open: "打开",
    save: "保存",
    cancel: "取消",
    confirm: "确定",
    close: "关闭",
    rename: "重命名",
    delete: "删除",
    edit: "编辑",
    download: "下载",
    browse: "浏览",
    currentName: "当前名称",
    overwriteHint: "注意：相同名称的文件会被覆盖。",
    unsupportedEdit: "该文件格式不支持文本编辑。",
    saved: "保存成功",
    savedError: "保存失败",
    requestFailed: "请求失败",
    noFiles: "请先选择文件",
    version: "版本",
    author: "作者",
    link: "项目链接",
    readOnly: "只读",
    unsaved: "有未保存的修改，确定放弃吗？",
    newName(type) {
      return `新${type}名称`;
    },
    uploadSuccess(total, success) {
      return `成功上传 ${success} 个文件，共 ${total} 个`;
    },
    downloadConfirm(name) {
      return `确定下载【${name}】？`;
    },
    deleteConfirm(name) {
      return `确定删除【${name}】？此操作不可恢复。`;
    },
  },
  ru: {
    title: "Файловый менеджер",
    file: "файл",
    folder: "папка",
    folders: "Папки",
    files: "Файлы",
    home: "Корень HA",
    up: "Наверх",
    refresh: "Обновить",
    filterPlaceholder: "Фильтр по имени",
    emptyFolders: "Нет папок",
    emptyFiles: "Нет файлов",
    newFile: "Новый файл",
    newFolder: "Новая папка",
    uploadFiles: "Загрузить файлы",
    uploadFolder: "Загрузить папку",
    downloadFolder: "Скачать папку",
    renameFolder: "Переименовать папку",
    deleteFolder: "Удалить папку",
    open: "Открыть",
    save: "Сохранить",
    cancel: "Отмена",
    confirm: "Подтвердить",
    close: "Закрыть",
    rename: "Переименовать",
    delete: "Удалить",
    edit: "Правка",
    download: "Скачать",
    browse: "Просмотр",
    currentName: "Текущее имя",
    overwriteHint: "Внимание: файлы с таким же именем будут перезаписаны.",
    unsupportedEdit: "Этот формат нельзя редактировать как текст.",
    saved: "Сохранено",
    savedError: "Ошибка сохранения",
    requestFailed: "Ошибка запроса",
    noFiles: "Сначала выберите файлы",
    version: "Версия",
    author: "Автор",
    link: "Ссылка",
    readOnly: "Только чтение",
    unsaved: "Есть несохранённые изменения. Отменить?",
    newName(type) {
      return `Новое имя: ${type}`;
    },
    uploadSuccess(total, success) {
      return `Загружено ${success} из ${total} файлов`;
    },
    downloadConfirm(name) {
      return `Скачать «${name}»?`;
    },
    deleteConfirm(name) {
      return `Удалить «${name}»? Это действие нельзя отменить.`;
    },
  },
};

function languageOf(hass) {
  const language = (hass && hass.language) || navigator.language || "en";
  if (language.toLowerCase().startsWith("zh")) return "zh";
  if (language.toLowerCase().startsWith("ru")) return "ru";
  return "en";
}

export function createI18n(hass) {
  const strings = STRINGS[languageOf(hass)];
  return {
    language: languageOf(hass),
    t(key, ...args) {
      const value = strings[key] ?? STRINGS.en[key] ?? key;
      return typeof value === "function" ? value(...args) : value;
    },
  };
}
