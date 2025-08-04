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
    private constructor();
    private safeParsePercentage;
    static getInstance(): LoadConfigFiles;
    initFiles(conn: FileSystem): Promise<void>;
    pushDataInMonitoringPlatform(apiConnector: ApiConnector, files: any[], hubStatus: IStatusHubObject): Promise<void>;
    private processVmMonitoringFile;
    private processOtherFiles;
    private sendConsolidatedData;
    _loadConfigFiles(connect: spinal.FileSystem, fileName: string): Promise<any>;
}
declare const _default: LoadConfigFiles;
export default _default;
