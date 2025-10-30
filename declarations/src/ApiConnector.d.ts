export declare class ApiConnector {
    private TokenManager;
    constructor();
    getConfig(): Promise<{
        headers: {
            "Content-Type": string;
            Accept: string;
            "x-access-token": string;
        };
    }>;
    /**
     * @param {string} url
     * @return {*}
     * @memberof ApiConnector
     */
    get<T>(url: string, headers?: any): Promise<{
        data: T;
        status: number;
    }>;
    /**
     *
     * @param {string} url
     * @param {*} data
     * @return {*}
     * @memberof ApiConnector
     */
    post(url: string, data: any): Promise<import("axios").AxiosResponse<any, any>>;
    postAuth(url: string, data: any): Promise<import("axios").AxiosResponse<any, any>>;
}
