declare interface Service {
    getHassFileList(path: string): Promise<any>,
    getHassFileContent(path: string): Promise<any>,
    setHassFileContent(path: string, data: string): Promise<any>,
    createHassFile(act: string, path: string): Promise<any>,
    deleteHassFile(path: string): Promise<any>
}