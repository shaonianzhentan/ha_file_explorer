declare interface Service {
    getHassFileList(path: string): Promise<any>,
    getHassFileContent(path: string): Promise<any>,
    setHassFileContent(path: string, data: string): Promise<any>,
    uploadFile(path: string, data: File): Promise<any>,
    createHassFile(act: string, path: string): Promise<any>,
    deleteHassFile(path: string): Promise<any>
}