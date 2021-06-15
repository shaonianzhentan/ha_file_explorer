const filters = {
    /**
     * 文件大小格式化显示
     * @param {Number} value 
     */
    fileSizeFormat(value) {
        if (value < 1024) {
            return `${value}B`
        } else if (value < 1024 * 1024) {
            return `${parseFloat((value / 1024).toFixed(2))}KB`
        } else if (value < 1024 * 1024 * 1024) {
            return `${parseFloat((value / (1024 * 1024)).toFixed(2))}MB`
        }
    }
}

export default {
    install(Vue) {
        Object.keys(filters).forEach(key => {
            Vue.filter(key, filters[key])
        })
    }
}
