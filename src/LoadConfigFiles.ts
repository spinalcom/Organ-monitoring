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
  private currentMacAddress: string | null = null;
  private vmProcesses: any[] = []; // ✅ AJOUT: Stocker les processus VM

  private constructor() {
    this.apiConnector = new ApiConnector();
  }

  // ✅ AJOUT: Méthode manquante safeParsePercentage
  private safeParsePercentage(value: any): number {
    if (typeof value === 'string') {
      return parseFloat(value.replace('%', '').trim());
    } else if (typeof value === 'number') {
      return value;
    }
    return 0;
  }

  // ✅ NOUVELLE MÉTHODE: Récupérer l'adresse MAC stockée
  public getMacAddress(): string | null {
    return this.currentMacAddress;
  }

  // ✅ NOUVELLE MÉTHODE: Récupérer les processus VM
  public getVmProcesses(): any[] {
    return this.vmProcesses;
  }

  // ✅ NOUVELLE MÉTHODE: Extraire et stocker l'adresse MAC de tous les fichiers
  private extractMacAddressFromFiles(files: any[]): string | null {
    for (const file of files) {
      try {
        const macAddress = file.genericOrganData?.macAddress?.get();
        if (macAddress) {
          console.log(`🏷️ MAC Address found: ${macAddress}`);
          this.currentMacAddress = macAddress;
          return macAddress;
        }
      } catch (error) {
        console.error('❌ Error extracting MAC address from file:', error);
      }
    }
    
    console.warn("⚠️ No MAC address found in any file");
    return null;
  }

  // ✅ NOUVELLE MÉTHODE: Forcer la recherche de MAC address
  public async findAndSetMacAddress(files: any[]): Promise<string | null> {
    const macAddress = this.extractMacAddressFromFiles(files);
    if (macAddress) {
      console.log(`✅ MAC Address set: ${macAddress}`);
    } else {
      console.warn("⚠️ No MAC address available for registration");
    }
    return macAddress;
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

      // ✅ AJOUT: Lister tous les fichiers présents d'abord
      this.listAllFiles(files);

      // ✅ AMÉLIORATION: Extraire la MAC au début
      await this.findAndSetMacAddress(files);

      const vmMonitoringData = await this.processVmMonitoringFile(files, apiConnector);
      const { infoFiles } = await this.processOtherFiles(files);

      await this.sendConsolidatedData(apiConnector, hubStatus, infoFiles);

    } catch (error) {
      console.error("❌ Error in pushDataInMonitoringPlatform:", error);
    }
  }

  // ✅ NOUVELLE MÉTHODE: Lister tous les fichiers présents
  private listAllFiles(files: any[]): void {
    console.log("📋 Listing all files found:");
    console.log(`📊 Total files: ${files.length}`);
    
    files.forEach((file, index) => {
      try {
        const fileName = file.genericOrganData?.name?.get();
        const fileType = file.genericOrganData?.type?.get();
        const macAddress = file.genericOrganData?.macAddress?.get();
        const serverName = file.genericOrganData?.serverName?.get();
        
        console.log(`📄 [${index + 1}] File: "${fileName}"`);
        console.log(`   📌 Type: ${fileType || 'N/A'}`);
        console.log(`   🖥️  Server: ${serverName || 'N/A'}`);
        console.log(`   🏷️  MAC: ${macAddress || 'Not found'}`);
        
        // ✅ AJOUT: Afficher les processus PM2 uniquement pour les fichiers VM_MONITORING
        if (fileName && (fileName.startsWith("VM_MONITORING_") || fileName === "VM Monitoring Agent")) {
          console.log(`   💻 This is a VM_MONITORING file - checking for PM2 processes...`);
          this.displayPm2Processes(file, fileName);
        } else {
          console.log(`   📝 Regular organ file - no PM2 processes expected`);
        }
        
        console.log(`   ---`);
      } catch (error) {
        console.error(`❌ Error reading file ${index + 1}:`, error);
      }
    });
    
    console.log("📋 End of file listing\n");
  }

  // ✅ AMÉLIORATION: Méthode pour vérifier spécifiquement les VM_MONITORING files
  private checkVmMonitoringFiles(files: any[]): void {
    console.log("🔍 Checking specifically for VM_MONITORING files...");
    
    const vmFiles = files.filter(file => {
      try {
        const fileName = file.genericOrganData?.name?.get();
        return fileName && (fileName.startsWith("VM_MONITORING_") || fileName === "VM Monitoring Agent");
      } catch (error) {
        return false;
      }
    });

    console.log(`📊 Found ${vmFiles.length} VM_MONITORING file(s)`);

    if (vmFiles.length === 0) {
      console.warn("⚠️ No VM_MONITORING files found! This might explain why no processes are detected.");
      return;
    }

    vmFiles.forEach((file, index) => {
      try {
        const fileName = file.genericOrganData?.name?.get();
        console.log(`\n🖥️  VM_MONITORING File [${index + 1}]: "${fileName}"`);
        
        // Inspection détaillée pour debug
        this.inspectPm2DetailedStructure(file, fileName);
        
        // Affichage des processus
        this.displayPm2Processes(file, fileName);
        
      } catch (error) {
        console.error(`❌ Error checking VM file ${index + 1}:`, error);
      }
    });
  }

  private async processVmMonitoringFile(files: any[], apiConnector: ApiConnector): Promise<any | null> {
    for (const file of files) {
      try {
        const fileName = file.genericOrganData?.name.get();
        console.log('📝 Processing file:', fileName);

        if (fileName && (fileName.startsWith("VM_MONITORING_") || fileName === "VM Monitoring Agent")) {
          console.log("💻 VM_MONITORING detected - processing...");

          // ✅ AJOUT: Extraire et envoyer les processus PM2 au gestionnaire de processus
          await this.extractAndSendVmProcesses(file);

          const macAddress = file.genericOrganData?.macAddress?.get();
          // ✅ AMÉLIORATION: Stocker la MAC si pas encore définie
          if (macAddress && !this.currentMacAddress) {
            this.currentMacAddress = macAddress;
            console.log(`🏷️ MAC Address set from VM file: ${macAddress}`);
          }

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
            macAddress: macAddress || this.currentMacAddress // ✅ Utiliser MAC stockée en fallback
          };

          const payload = {
            registerKey: process.env.REGISTER_KEY || "defaultKey",
            infoServer: vmMonitoringData
          };

          console.log("DEBUG macAddress from file:", macAddress);
          console.log("DEBUG stored macAddress:", this.currentMacAddress);
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

  /** 📂 NOUVELLE MÉTHODE: Extraire et envoyer les processus VM au gestionnaire de processus */
  private async extractAndSendVmProcesses(file: any): Promise<void> {
    try {
      const pm2Processes = file.pm2Processes;
      
      if (!pm2Processes) {
        console.log('⚠️ No PM2 processes found in VM file');
        return;
      }

      const processCount = pm2Processes.length?.get ? pm2Processes.length.get() : (pm2Processes.length || 0);
      
      if (processCount === 0) {
        console.log('⚠️ VM file contains 0 processes');
        return;
      }

      // ✅ NOUVEAU: Extraire tous les processus du fichier
      const vmProcesses = [];
      for (let i = 0; i < processCount; i++) {
        try {
          const process = pm2Processes[i];
          if (process) {
            vmProcesses.push(process);
          }
        } catch (error) {
          console.error(`❌ Error extracting VM process ${i + 1}:`, error);
        }
      }

      console.log(`📂 Extracted ${vmProcesses.length} processes from VM_Monitoring file`);

      // ✅ AJOUT: Sauvegarder les processus dans une propriété de classe
      this.vmProcesses = vmProcesses;

    } catch (error) {
      console.error('❌ Error extracting VM processes:', error);
    }
  }

  private async processOtherFiles(files: any[]): Promise<{ infoFiles: any[] }> {
    const infoFiles: any[] = [];

    for (const file of files) {
      try {
        const fileName = file.genericOrganData?.name.get();
        // ✅ CORRECTION: Exclure aussi "VM Monitoring Agent"
        if (fileName && (fileName.startsWith("VM_MONITORING_") || fileName === "VM Monitoring Agent")) continue;

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

  public async _loadConfigFiles(connect: FileSystem, fileName: string): Promise<any> {
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

  // ✅ NOUVELLE MÉTHODE: Inspection complète de la structure PM2
  private displayPm2Processes(file: any, fileName: string): void {
    try {
      const pm2Processes = file.pm2Processes;
      
      if (!pm2Processes) {
        console.log(`   🔄 PM2 Processes: Not available`);
        return;
      }

      const processCount = pm2Processes.length?.get ? pm2Processes.length.get() : (pm2Processes.length || 0);
      console.log(`   🔄 PM2 Processes: ${processCount} process(es)`);
      
      if (processCount === 0) {
        console.log(`   ⚠️ No processes found in ${fileName}`);
        return;
      }

      // ✅ CORRECTION: Afficher TOUS les processus (pas seulement 3)
      console.log(`   📋 Listing all ${processCount} PM2 processes:`);
      console.log(`   ${"─".repeat(50)}`);

      for (let i = 0; i < processCount; i++) {
        try {
          const process = pm2Processes[i];
          
          // Structure directe confirmée par votre debug
          const processName = process.name?.get ? process.name.get() : process.name;
          const processStatus = process.status?.get ? process.status.get() : process.status;
          const processPid = process.pid?.get ? process.pid.get() : process.pid;
          const processPm2Id = process.pm2_id?.get ? process.pm2_id.get() : process.pm2_id;
          const processCpu = process.cpu?.get ? process.cpu.get() : process.cpu;
          const processMemory = process.memory?.get ? process.memory.get() : process.memory;
          const processRestarts = process.restarts?.get ? process.restarts.get() : process.restarts;
          const processPath = process.path?.get ? process.path.get() : process.path;
          const processAlias = process.alias?.get ? process.alias.get() : process.alias;

          // Formatage
          const memoryMB = processMemory ? (processMemory / 1024 / 1024).toFixed(1) : 'N/A';
          const statusEmoji = this.getProcessStatusEmoji(processStatus);

          console.log(`   ⚙️  [${String(i + 1).padStart(2, '0')}] PM2: ${processPm2Id || 'N/A'} | PID: ${processPid || 'N/A'}`);
          console.log(`       📝 Name: ${processName || 'Unknown'}`);
          if (processAlias && processAlias !== processName) {
            console.log(`       🔖 Alias: ${processAlias}`);
          }
          console.log(`       ${statusEmoji} Status: ${processStatus || 'N/A'}`);
          console.log(`       💾 CPU: ${processCpu || 'N/A'}%`);
          console.log(`       🧠 Memory: ${memoryMB} MB`);
          console.log(`       🔄 Restarts: ${processRestarts || 'N/A'}`);
          if (processPath) {
            console.log(`       📁 Path: ${processPath}`);
          }
          
          // Séparateur entre processus
          if (i < processCount - 1) {
            console.log(`   ${"┄".repeat(30)}`);
          }
          
        } catch (processError) {
          console.error(`   ❌ Error reading process ${i + 1}:`, processError);
        }
      }
      
      console.log(`   ${"─".repeat(50)}`);
      console.log(`   ✅ Total displayed: ${processCount} processes`);
      
    } catch (error) {
      console.error(`   ❌ Error reading PM2 processes for ${fileName}:`, error);
    }
  }

  // ✅ NOUVELLE MÉTHODE: Formatage du uptime pour les processus
  private formatProcessUptime(uptime: any): string {
    if (!uptime) return 'N/A';
    
    try {
      const now = Date.now();
      const uptimeMs = now - uptime;
      const seconds = Math.floor(uptimeMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m`;
      } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
      } else {
        return `${seconds}s`;
      }
    } catch (error) {
      return 'N/A';
    }
  }

  // ✅ NOUVELLE MÉTHODE: Émoji de statut pour les processus
  private getProcessStatusEmoji(status: string): string {
    if (!status) return '❓';
    
    switch (status.toLowerCase()) {
      case 'online': return '✅';
      case 'stopped': return '⛔';
      case 'stopping': return '🛑';
      case 'launching': return '🚀';
      case 'errored': return '❌';
      case 'one-launch-status': return '🔄';
      default: return '❓';
    }
  }

  // ✅ MÉTHODE ALTERNATIVE: Inspection détaillée de la structure PM2
  private inspectPm2DetailedStructure(file: any, fileName: string): void {
    try {
      console.log(`   🔍 Detailed PM2 inspection for: ${fileName}`);
      
      const pm2Processes = file.pm2Processes;
      if (!pm2Processes) {
        console.log(`   ❌ No pm2Processes found`);
        return;
      }

      console.log(`   ✅ pm2Processes exists`);
      
      // Vérifier la longueur
      if (pm2Processes.length !== undefined) {
        const length = pm2Processes.length.get ? pm2Processes.length.get() : pm2Processes.length;
        console.log(`   📊 Length: ${length}`);
        
        // Examiner le premier processus en détail
        if (length > 0 && pm2Processes[0]) {
          console.log(`   🔍 First process structure:`);
          const firstProcess = pm2Processes[0];
          
          console.log(`     - Has Model: ${!!firstProcess.Model}`);
          
          if (firstProcess.Model) {
            const model = firstProcess.Model;
            console.log(`     - Model.name: ${model.name?.get ? model.name.get() : model.name}`);
            console.log(`     - Model.status: ${model.status?.get ? model.status.get() : model.status}`);
            console.log(`     - Model.pid: ${model.pid?.get ? model.pid.get() : model.pid}`);
            console.log(`     - Model.pm_id: ${model.pm_id?.get ? model.pm_id.get() : model.pm_id}`);
          }
        }
      }
      
    } catch (error) {
      console.error(`   ❌ Error in detailed PM2 inspection:`, error);
    }
  }
}

// ✅ CORRECTION: Exporter la classe au lieu d'une instance
export default LoadConfigFiles;