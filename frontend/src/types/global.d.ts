import '@vue/runtime-core'
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $dialog: any;
        $toast: any;
        api: API
    }
}