
/**
 * get file extend
 * @param fileName 
 * @returns 
 */
export function getFileExt(fileName: string) {
    const arr = fileName.split('.')
    if (arr.length > 1) {
        return arr[arr.length - 1].toLocaleLowerCase();
    }
    return ''
}

/**
 * display files size
 * @param size
 * @returns 
 */
export function formatSize(size: number) {
    if (size == 0) return ''
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`
    if (size >= 1024) return `${(size / 1024).toFixed(2)} KB`
    return `${size} B`
}

/**
 * Show file icon
 * @param fileName
 * @returns 
 */
export function formatFileIcon(path: any, fileName: string) {
    // ha root dir
    if (['.', ''].includes(path)) {
        if ([
            '.shopping_list.json',
            'secrets.yaml',
            'scripts.yaml',
            'scenes.yaml',
            'groups.yaml',
            'customize.yaml',
            'configuration.yaml',
            'automations.yaml',
            'customize.yaml'
        ].includes(fileName)) {
            return { icon: 'mdi-home-assistant' }
        }
        else if (/^home-assistant\.log./.test(fileName)) {
            return { icon: 'mdi-math-log' }
        }
        else if (/^home-assistant_v2\.db./.test(fileName)) {
            return { icon: 'mdi-database' }
        }
    }
    let icon = 'mdi-file'
    let ext = getFileExt(fileName)
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'ico'].includes(ext)) {
        ext = 'img'
    } else if (['yaml', 'DS_Store'].includes(ext)) {
        ext = 'code'
    } else if ([
        'ha_version',
        'config_entries',
        'device_registry',
        'entity_registry',
        'restore_state',
    ].includes(ext)) {
        ext = 'homeassistant'
    } else if (['m3u8', 'mp4', 'flv', 'm3u'].includes(ext)) {
        ext = 'video'
    } else if (['mp3', 'm4a'].includes(ext)) {
        ext = 'audio'
    } else if (['gz', 'rar', 'tz'].includes(ext)) {
        ext = 'zip'
    } else if (['html', 'htm'].includes(ext)) {
        ext = 'html'
    } else if (['db-shm', 'db-wal'].includes(ext)) {
        ext = 'db'
    }
    const mode = {
        code: 'mdi-code-braces',
        img: 'mdi-file-image',
        py: 'mdi-language-python',
        log: 'mdi-math-log',
        db: 'mdi-database',
        js: 'mdi-nodejs',
        homeassistant: 'mdi-home-assistant',
        json: 'mdi-code-json',
        md: 'mdi-language-markdown',
        html: 'mdi-language-html5',
        video: 'mdi-file-video',
        audio: 'mdi-file-music',
        zip: 'mdi-folder-zip',
        svg: 'mdi-svg',
        css: 'mdi-language-css3'
    } as any;
    return { icon: mode[ext] || icon }
}


/**
 * Show folder Icon
 * @param folderName
 * @returns 
 */
export function formatFolderIcon(path: any, folderName: string) {
    if (path == './custom_components') {
        return {
            iconType: 'img',
            icon: `https://brands.home-assistant.io/${folderName}/icon.png`
        }
    }
    let icon = 'mdi-folder'
    let ext = folderName
    if ([
        'www',
        'tts',
        'themes',
        'media',
        'custom_components',
        'blueprints',
        '.storage',
        '.cloud',
        'script',
        'automation',
        'homeassistant',
        'python_scripts',
        'packages'
    ].includes(ext)) {
        icon = 'mdi-home-assistant'
    }

    if (['deps', '__pycache__'].includes(ext)) {
        icon = 'mdi-language-python'
    }
    return { icon }
}

/**
 * Editor display mode
 * @param fileName 
 * @returns 
 */
export function editorMode(fileName: string) {
    let ext = getFileExt(fileName)
    if (["js", "ts", "jsx"].includes(ext)) {
        ext = "javascript";
    } else if (["py", "pyc"].includes(ext)) {
        ext = "python";
    } else if (["md"].includes(ext)) {
        ext = "markdown";
    } else if (["yml", "yaml"].includes(ext)) {
        ext = "yaml";
    }
    return `ace/mode/${ext}`;
}

/**
 * Judge whether the file is editable
 * @param fileName 
 * @returns 
 */
export function isEditable(fileName: string) {
    let ext = getFileExt(fileName)
    return !['jpg', 'jpg', 'jpg',
        'mp3', 'mp4', 'db', 'jpg'].includes(ext)
}