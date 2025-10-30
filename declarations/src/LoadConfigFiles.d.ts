import { Lst, Model, FileSystem, Val, Str, Bool } from "spinal-core-connectorjs";
import { ApiConnector } from './ApiConnector';
interface IProcessInfo {
    macAddress: string;
    processId: string;
    processName: string;
    pm2_id: string;
    pid?: number;
    status?: string;
    path?: string;
    restarts?: number;
    cpu?: number;
    memory?: number;
    timestamp?: string;
}
interface IStatusHubObject extends Model {
    count_models: Val;
    count_users: Val;
    count_sessions: Val;
    ram_usage_res: Val;
    ram_usage_virt: Val;
    btn: IBtn;
    sessions: ISessionsItem[];
    data: IData;
    boot_timestamp: Val;
    processes?: Lst<Model>;
}
interface IBtn extends Model {
    garbageCollector: Val;
    backup: Val;
}
interface ISessionsItem extends Model {
    id: Val;
    timestamp: Val;
    type: Str;
    actif: Bool;
}
interface IData extends Model {
    len: Val;
    count_models: Str;
    count_users: Str;
    count_sessions: Str;
    ram_usage_res: Str;
    ram_usage_virt: Str;
}
declare class LoadConfigFiles {
    private static instance;
    private apiConnector;
    private socket;
    private socketConnected;
    private configFiles;
    private connection;
    private actionWatchers;
    constructor();
    private initializeSocket;
    private safeParsePercentage;
    static getInstance(): LoadConfigFiles;
    initFiles(conn: FileSystem): Promise<void>;
    private extractProcesses;
    private getMacAddressFromFiles;
    private sendPm2ProcessesViaSocket;
    sendSingleProcess(processInfo: IProcessInfo): Promise<void>;
    isSocketConnected(): boolean;
    reconnectSocket(): void;
    pushDataInMonitoringPlatform(apiConnector: ApiConnector, files: any[], hubStatus: IStatusHubObject): Promise<void>;
    private checkServerExistence;
    private updateExistingServer;
    private getCurrentServerIP;
    private processVmMonitoringFile;
    private createNewServer;
    private extractAndCollectPm2Processes;
    private registerAgent;
    private getMacAddressFromCurrentFiles;
    private loadMacFromFiles;
    private setupSocketEventHandlers;
    private createControlAction;
    private initializeActionWatchers;
    private processControlActions;
    private executeControlAction;
    private restartProcess;
    private stopProcess;
    private startProcess;
    private updateProcessConfig;
    private clearProcessLogs;
    private notifyActionResult;
    private processOtherFiles;
    private sendConsolidatedData;
    private sendVmMetricsToHistoryApi;
    private getAllProcesses;
    _loadConfigFiles(connect: any, fileName: string): Promise<any>;
    private restartProcessById;
    /**
     * ✅ NOUVELLE MÉTHODE - Nettoyer les watchers proprement
     */
    private cleanupActionWatchers;
}
export default LoadConfigFiles;
