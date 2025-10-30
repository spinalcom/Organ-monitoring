declare const config: {
    spinalConnector: {
        protocol: string;
        user: string;
        password: string;
        host: string;
        port: string;
    };
    socketConfig: {
        url: string;
        options: {
            transports: string[];
            autoConnect: boolean;
            reconnection: boolean;
            reconnectionDelay: number;
            reconnectionDelayMax: number;
            reconnectionAttempts: number;
        };
    };
    monitoringApiConfig: {
        TokenBosRegister: string | undefined;
        monitoring_url: string | undefined;
        monitoring_helath_url: string | undefined;
        pushDataServer: string | undefined;
        organName: string | undefined;
        email: string | undefined;
        password: string | undefined;
        grant_type: string | undefined;
        processListUrl: string;
        restartProcessUrl: string;
        socketUrl: string;
    };
};
export default config;
