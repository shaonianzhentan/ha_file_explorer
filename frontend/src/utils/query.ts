export function querySelector(ele, selector) {
    // console.log('%O', ele)
    // 正常元素
    let findEle = ele.querySelector(selector)
    if (findEle) return findEle
    else if (ele.children.length > 0) {
        let children = ele.children
        for (let i = 0, j = children.length; i < j; i++) {
            let result = querySelector(children[i], selector)
            if (result) return result
        }
    }
    // 影子根
    if (ele.renderRoot) {
        findEle = ele.renderRoot.querySelector(selector)
        if (findEle) return findEle
        else if (ele.renderRoot.children.length > 0) {
            let children = ele.renderRoot.children
            for (let i = 0, j = children.length; i < j; i++) {
                let result = querySelector(children[i], selector)
                if (result) return result
            }
        }
    }
}