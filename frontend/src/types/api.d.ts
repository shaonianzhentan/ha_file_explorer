declare interface API {
    service: Service,
    fireEvent(type: string, data = {}, ele: any = null),
    showQuickBar(key: string)
}

declare interface Service {
    getHassFileList(path: string): Promise<any>,
    getHassFileContent(path: string): Promise<any>,
    setHassFileContent(path: string, data: string): Promise<any>,
    uploadFile(path: string, data: File): Promise<any>,
    createHassFile(act: string, path: string): Promise<any>,
    deleteHassFile(path: string): Promise<any>,
    downloadFile(path: string): Promise<any>,
    rename(path: string, new_path: string): Promise<any>
}