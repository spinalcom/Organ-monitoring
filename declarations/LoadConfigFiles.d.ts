import { Model, FileSystem, Val, Str, Bool } from "spinal-core-connectorjs";
import { ApiConnector } from './ApiConnector';
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
    private currentMacAddress;
    private vmProcesses;
    private constructor();
    private safeParsePercentage;
    getMacAddress(): string | null;
    getVmProcesses(): any[];
    private extractMacAddressFromFiles;
    findAndSetMacAddress(files: any[]): Promise<string | null>;
    static getInstance(): LoadConfigFiles;
    initFiles(conn: FileSystem): Promise<void>;
    pushDataInMonitoringPlatform(apiConnector: ApiConnector, files: any[], hubStatus: IStatusHubObject): Promise<void>;
    private listAllFiles;
    private checkVmMonitoringFiles;
    private processVmMonitoringFile;
    /** 📂 NOUVELLE MÉTHODE: Extraire et envoyer les processus VM au gestionnaire de processus */
    private extractAndSendVmProcesses;
    private processOtherFiles;
    private sendConsolidatedData;
    _loadConfigFiles(connect: FileSystem, fileName: string): Promise<any>;
    private displayPm2Processes;
    private formatProcessUptime;
    private getProcessStatusEmoji;
    private inspectPm2DetailedStructure;
}
export default LoadConfigFiles;
