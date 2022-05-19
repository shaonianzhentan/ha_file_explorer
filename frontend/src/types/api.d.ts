declare interface API {
    service: Service,
    fireEvent(type: string, data = {}, ele: any = null),
    showQuickBar(key: string)
}