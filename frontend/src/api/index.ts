
import service from './service';
import { querySelector } from '../utils/query'

class API {
    constructor() {
        // console.log('api')
        this.hassFullScreen()
    }

    get service(): Service {
        return service as any
    }

    async hassFullScreen() {
        const subpage = querySelector(parent.document, 'hass-subpage')
        let iframe = subpage.querySelector("iframe");
        let toolbar = subpage.shadowRoot.querySelector('.toolbar')
        subpage.shadowRoot.querySelector('.content').style.height = '100vh'
        iframe.style.position = 'absolute'
        toolbar.style.display = 'none'
        iframe.style.top = '0'
        iframe.style.height = '100%'
    }

    fireEvent(type: string, data = {}, ele: any = null) {
        const win = parent as any
        const event = new win.Event(type, {
            bubbles: true,
            cancelable: false,
            composed: true
        });
        event.detail = data;
        if (!ele) {
            ele = querySelector(win.document, 'app-drawer-layout')
        }
        ele.dispatchEvent(event);
    }

    showQuickBar(key: string) {
        const kb = new (parent as any).KeyboardEvent('keydown', { key });
        kb.composedPath = () => {
            return [{
                tagName: '',
                parentElement: {
                    tagName: ''
                }
            }]
        }
        // console.log(kb)
        parent.window.dispatchEvent(kb);
    }
}
const api = new API()
export default api