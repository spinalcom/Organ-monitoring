import { Lst, spinalCore, Model, FileSystem, Val, Str, Bool } from "spinal-core-connectorjs";
import * as path from "path";
import config from './config';
import { ApiConnector } from './ApiConnector';
import ConfigFile from 'spinal-lib-organ-monitoring';
import dotenv from "dotenv";

dotenv.config();

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

class LoadConfigFiles {
  private static instance: LoadConfigFiles;
  private apiConnector: ApiConnector;

  private constructor() {
    this.apiConnector = new ApiConnector();
  }

  private safeParsePercentage(value: any): number {
    if (typeof value === 'string') {
      return parseFloat(value.replace('%', '').trim());
    } else if (typeof value === 'number') {
      return value;
    }
    return 0;
  }
  

  public static getInstance(): LoadConfigFiles {
    if (!this.instance) this.instance = new LoadConfigFiles();
    return this.instance;
  }

  public async initFiles(conn: FileSystem): Promise<void> {
    const promiseEtc = new Promise<IStatusHubObject>(async (resolve, reject) => {
      const directory = await conn.load_or_make_dir("/etc");
      for (const file of directory) {
        if (file._info?.model_type?.get() === "model_status") {
          var fileLoaded = await file.load();
          resolve(fileLoaded);
          return;
        }
      }
      reject(new Error("/etc not Found"));
    });

    const promisesOrganFiles = new Promise<any[]>(async (resolve, reject) => {
      const directory = await conn.load_or_make_dir("/etc/Organs/Monitoring");
      if (!directory) {
        reject(new Error("/etc/Organs/Monitoring not Found"));
        return;
      }
      const files: Promise<any>[] = [];
      for (const file of directory) {
        if (file._info?.model_type?.get() === "ConfigFile") {
          files.push(file._ptr.load());
        }
      }
      resolve(Promise.all(files));
    });

    try {
      const hubStatus = await promiseEtc;
      const files = await promisesOrganFiles;
      await this.pushDataInMonitoringPlatform(this.apiConnector, files, hubStatus);
    } catch (error) {
      console.error("❌ Failed to initialize files:", error);
    }
  }

  public async pushDataInMonitoringPlatform(apiConnector: ApiConnector, files: any[], hubStatus: IStatusHubObject): Promise<void> {
    try {
      console.log("🔄 Preparing data for monitoring platform...");

      const vmMonitoringData = await this.processVmMonitoringFile(files, apiConnector);
      const { infoFiles } = await this.processOtherFiles(files);

      await this.sendConsolidatedData(apiConnector, hubStatus, infoFiles);

    } catch (error) {
      console.error("❌ Error in pushDataInMonitoringPlatform:", error);
    }
  }

  private async processVmMonitoringFile(files: any[], apiConnector: ApiConnector): Promise<any | null> {
    for (const file of files) {
      try {
        const fileName = file.genericOrganData?.name.get();
        console.log('📝 Processing file:', fileName);

        if (fileName && fileName.startsWith("VM_MONITORING_")) {
          console.log("💻 VM_MONITORING detected - processing...");

          const vmMonitoringData = {
            serverName: String(file.genericOrganData?.serverName?.get()),
            cpuUsage: this.safeParsePercentage(file.genericOrganData?.cpuUsage?.get()),
            ramUsage: this.safeParsePercentage(file.genericOrganData?.ramUsage?.get()),
            totalRam: parseFloat(String(file.genericOrganData?.totalRam?.get()).replace(' GB', '')),
            freeRam: parseFloat(String(file.genericOrganData?.freeRam?.get()).replace(' GB', '')),
            totalDisk: parseFloat(String(file.genericOrganData?.totalDisk?.get()).replace(' GB', '')),
            freeDisk: parseFloat(String(file.genericOrganData?.freeDisk?.get()).replace(' GB', '')),
            diskUsage: this.safeParsePercentage(file.genericOrganData?.diskUsage?.get()),
            timestamp: file.genericOrganData?.lastHealthTime?.get() || new Date().toISOString(),
            macAddress: file.genericOrganData?.macAddress?.get()
          };

          const payload = {
            registerKey: process.env.REGISTER_KEY || "defaultKey",
            infoServer: vmMonitoringData
          };
          console.log("DEBUG macAddress:", file.genericOrganData?.macAddress);
          console.log("📤 Sending VM_MONITORING data:", JSON.stringify(payload, null, 2));

          const pushUrl = config.monitoringApiConfig.pushDataServer;
          if (pushUrl) {
            await apiConnector.post(pushUrl, payload);
            console.log("✅ VM_MONITORING metrics pushed to", pushUrl);
          }

          return vmMonitoringData;
        }
      } catch (error) {
        console.error('❌ Error processing VM_MONITORING file:', error);
      }
    }
    return null;
  }

  private async processOtherFiles(files: any[]): Promise<{ infoFiles: any[] }> {
    const infoFiles: any[] = [];

    for (const file of files) {
      try {
        const fileName = file.genericOrganData?.name.get();
        if (fileName === "VM_MONITORING") continue; // Skip already processed

        console.log('🗂️ Processing other file:', fileName);

        const infofile = {
          genericOrganData: {
            id: file.genericOrganData?.id.get(),
            name: fileName,
            type: file.genericOrganData?.type.get(),
            serverName: file.genericOrganData?.serverName?.get(),
            bootTimestamp: file.genericOrganData?.bootTimestamp?.get(),
            lastHealthTime: file.genericOrganData?.lastHealthTime?.get(),
            ramRssUsed: file.genericOrganData?.ramRssUsed?.get(),
            macAddress: file.genericOrganData?.macAddress?.get(),
            logList: [],
          },
          specificOrganData: {
            port: file.specificOrganData?.port?.get(),
            lastAction: {
              message: file.specificOrganData?.lastAction?.message?.get(),
              date: file.specificOrganData?.lastAction?.date?.get()
            }
          }
        };

        infoFiles.push(infofile);
      } catch (error) {
        console.error('❌ Error processing non-VM file:', error);
      }
    }

    return { infoFiles };
  }

  private async sendConsolidatedData(apiConnector: ApiConnector, hubStatus: IStatusHubObject, infoFiles: any[]): Promise<void> {
    const objBosFile = {
      registerKey: process.env.REGISTER_KEY || "defaultKey",
      infoHub: {
        bootTimestamp: hubStatus.boot_timestamp?.get(),
        ramUsageRes: hubStatus.ram_usage_res.get() / 1024,
        ramUsageVirt: hubStatus.ram_usage_virt.get() / 1024,
        countSessions: hubStatus.count_sessions.get(),
        countUsers: hubStatus.count_users.get()
      },
      infoOrgans: infoFiles
    };

    console.log("📤 Sending consolidated Hub and Organs data:", JSON.stringify(objBosFile, null, 2));

    const healthUrl = config.monitoringApiConfig.monitoring_helath_url;
    if (healthUrl) {
      await apiConnector.post(healthUrl, objBosFile);
      console.log("✅ Non-VM data pushed to", healthUrl);
    } else {
      console.warn("⚠️ No health URL configured, skipping non-VM push.");
    }
  }

  public async _loadConfigFiles(connect: spinal.FileSystem, fileName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      spinalCore.load(connect, path.resolve(`/etc/Organs/Monitoring/${fileName}`),
        (file) => resolve(file),
        () => {
          console.error("❌ Error loading file:", fileName);
          reject("error load file");
        }
      );
    });
  }
}

export default LoadConfigFiles.getInstance();
