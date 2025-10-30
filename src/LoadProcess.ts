/*
 * Copyright 2025
 * ProcessSocketManager.ts
 *
 * Gère uniquement la connexion WebSocket + envoi des processus PM2
 */

import { io, Socket } from 'socket.io-client';
import pm2 from 'pm2';

export default class ProcessSocketManager {
  private socket: Socket | null = null;
  private socketUrl: string;
  private macAddress: string = '';
  private vmProcesses: any[] = []; // ✅ AJOUT: Stocker les processus du fichier VM

  constructor(socketUrl: string) {
    this.socketUrl = socketUrl;
  }

  /** 🏷️ Définit l'adresse MAC (fournie par LoadConfigFiles) */
  public setMacAddress(macAddress: string): void {
    this.macAddress = macAddress;
    console.log(`🏷️ MAC Address set for ProcessSocketManager: ${this.macAddress}`);
  }

  /** 📂 NOUVELLE MÉTHODE: Définit les processus depuis le fichier VM_Monitoring */
  public setVmProcesses(processes: any[]): void {
    this.vmProcesses = processes;
    console.log(`📂 VM Processes set: ${processes.length} process(es) loaded from VM_Monitoring file`);
  }

  /** 🔌 Initialise la connexion socket.io */
  public async initialize(): Promise<void> {
    try {
      console.log(`🌐 Connecting to process socket: ${this.socketUrl}`);
      
      this.socket = io(this.socketUrl, { 
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to process management server');
        if (this.macAddress) {
          this.socket!.emit('register-agent', { macAddress: this.macAddress });
          console.log(`🖥️ Registered process agent: ${this.macAddress}`);
        } else {
          console.warn('⚠️ No MAC address available for registration');
        }
      });

      this.socket.on('disconnect', () => console.warn('⚠️ Process socket disconnected'));
      this.socket.on('connect_error', (err: any) => console.error('❌ Process socket error:', err.message));

      // 🎯 Actions de gestion des processus
      this.socket.on('action', async (data: any) => {
        console.log('⚡ Received process action:', data);
        await this.handleAction(data);
      });

      // 🔄 Événement spécifique pour redémarrer un processus
      this.socket.on('restart-process', async (data: any) => {
        console.log('🔄 Restart process command received:', data);
        await this.handleAction({ actionType: 'restart', targetId: data.processId || data.pm2_id });
      });

      // 📋 Événement pour récupérer la liste des processus
      this.socket.on('get-process-list', async (data: any) => {
        console.log('📋 Get process list command received:', data);
        await this.sendProcessList();
      });

      // 📤 Événement pour traiter la réponse de la liste des processus
      this.socket.on('process-list-response', async (data: any) => {
        console.log('📤 Process list response received:', data);
        await this.handleProcessListResponse(data);
      });

    } catch (error: any) {
      console.error('❌ Error initializing process socket:', error?.message || error);
    }
  }

  /** 🧠 Gestion des actions reçues (restart, stop, start, etc.) */
  private async handleAction(actionData: any): Promise<void> {
    const { actionType = 'restart', targetId, processId, pm2_id, processName } = actionData;
    const id = targetId || processId || pm2_id || processName;

    if (!id) {
      console.error('❌ No process ID/name provided in action data:', actionData);
      this.notifyActionResult(actionType, 'unknown', false);
      return;
    }

    console.log(`🎯 Executing ${actionType} on process: ${id}`);

    try {
      await this.connectToPM2();
      
      switch (actionType) {
        case 'restart':
          await this.restartProcess(id);
          break;
        case 'stop':
          await this.stopProcess(id);
          break;
        case 'start':
          await this.startProcess(id);
          break;
        default:
          console.warn(`⚠️ Unknown action type: ${actionType}`);
          this.notifyActionResult(actionType, id, false);
          return;
      }

      this.notifyActionResult(actionType, id, true);
    } catch (error: any) {
      console.error(`❌ Error executing ${actionType} on ${id}:`, error?.message || error);
      this.notifyActionResult(actionType, id, false);
    } finally {
      pm2.disconnect();
    }
  }

  /** 🔗 Connexion à PM2 */
  private async connectToPM2(): Promise<void> {
    return new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          reject(new Error(`PM2 connection failed: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /** ♻️ Redémarre un processus PM2 */
  private async restartProcess(processId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      pm2.restart(processId, (err) => {
        if (err) {
          reject(new Error(`Restart failed: ${err.message}`));
        } else {
          console.log(`✅ Process ${processId} restarted successfully`);
          resolve();
        }
      });
    });
  }

  /** ⛔ Arrête un processus PM2 */
  private async stopProcess(processId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      pm2.stop(processId, (err) => {
        if (err) {
          reject(new Error(`Stop failed: ${err.message}`));
        } else {
          console.log(`✅ Process ${processId} stopped successfully`);
          resolve();
        }
      });
    });
  }

  /** ▶️ Démarre un processus PM2 */
  private async startProcess(processId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      pm2.start(processId, (err) => {
        if (err) {
          reject(new Error(`Start failed: ${err.message}`));
        } else {
          console.log(`✅ Process ${processId} started successfully`);
          resolve();
        }
      });
    });
  }

  /** 📋 Envoie la liste des processus du fichier VM_Monitoring au serveur */
  private async sendProcessList(): Promise<void> {
    try {
      console.log('📋 Sending VM_Monitoring process list...');

      // ✅ MODIFICATION: Utiliser les processus du fichier VM_Monitoring au lieu de PM2 direct
      if (!this.vmProcesses || this.vmProcesses.length === 0) {
        console.warn('⚠️ No VM processes available to send');
        return;
      }

      // ✅ AJOUT: Afficher d'abord la liste des processus du fichier
      this.displayVmProcessList(this.vmProcesses);

      // ✅ NOUVEAU: Convertir les processus du fichier VM au format attendu
      const processData = this.vmProcesses.map((proc, index) => {
        try {
          return {
            id: proc.pm2_id?.get ? proc.pm2_id.get() : proc.pm2_id,
            name: proc.name?.get ? proc.name.get() : proc.name,
            status: proc.status?.get ? proc.status.get() : proc.status,
            cpu: proc.cpu?.get ? proc.cpu.get() : proc.cpu,
            memory: proc.memory?.get ? proc.memory.get() : proc.memory,
            uptime: proc.lastUptime?.get ? proc.lastUptime.get() : proc.lastUptime,
            restarts: proc.restarts?.get ? proc.restarts.get() : proc.restarts,
            pid: proc.pid?.get ? proc.pid.get() : proc.pid,
            path: proc.path?.get ? proc.path.get() : proc.path,
            alias: proc.alias?.get ? proc.alias.get() : proc.alias
          };
        } catch (error) {
          console.error(`❌ Error processing VM process ${index + 1}:`, error);
          return null;
        }
      }).filter(proc => proc !== null); // Filtrer les processus avec erreur

      const response = {
        macAddress: this.macAddress,
        processList: processData,
        timestamp: new Date().toISOString(),
        source: 'VM_Monitoring_File' // ✅ AJOUT: Identifier la source
      };

      if (this.socket && this.socket.connected) {
        this.socket.emit('process-list', response);
        console.log(`📤 Sent VM process list with ${processData.length} processes from VM_Monitoring file`);
      } else {
        console.warn('⚠️ Socket not connected, cannot send VM process list');
      }

    } catch (error: any) {
      console.error('❌ Error sending VM process list:', error?.message || error);
    }
  }

  /** 📋 NOUVELLE MÉTHODE: Affiche la liste des processus du fichier VM_Monitoring */
  private displayVmProcessList(vmProcesses: any[]): void {
    console.log("🔄 ===== VM_MONITORING FILE PROCESS LIST =====");
    console.log(`📊 Total VM processes found: ${vmProcesses.length}`);
    console.log("─".repeat(60));

    if (vmProcesses.length === 0) {
      console.log("⚠️ No VM processes found in file");
      console.log("═".repeat(60));
      return;
    }

    vmProcesses.forEach((proc, index) => {
      try {
        const processId = proc.pm2_id?.get ? proc.pm2_id.get() : proc.pm2_id;
        const processName = (proc.name?.get ? proc.name.get() : proc.name) || 'Unknown';
        const status = (proc.status?.get ? proc.status.get() : proc.status) || 'unknown';
        const cpu = (proc.cpu?.get ? proc.cpu.get() : proc.cpu) || 0;
        const memory = (proc.memory?.get ? proc.memory.get() : proc.memory) || 0;
        const pid = (proc.pid?.get ? proc.pid.get() : proc.pid) || 'N/A';
        const restarts = (proc.restarts?.get ? proc.restarts.get() : proc.restarts) || 0;
        const path = proc.path?.get ? proc.path.get() : proc.path;

        // Formatage de la mémoire
        const memoryMB = memory ? (memory / 1024 / 1024).toFixed(1) : '0.0';

        // Émoji de statut
        const statusEmoji = this.getStatusEmoji(status);

        console.log(`🔧 [${index + 1}] VM Process ID: ${processId || 'N/A'}`);
        console.log(`   📝 Name: ${processName}`);
        console.log(`   ${statusEmoji} Status: ${status.toUpperCase()}`);
        console.log(`   🔢 PID: ${pid}`);
        console.log(`   💾 CPU: ${cpu}%`);
        console.log(`   🧠 Memory: ${memoryMB} MB`);
        console.log(`   🔄 Restarts: ${restarts}`);
        
        if (path) {
          console.log(`   📁 Path: ${path}`);
        }
        
        console.log("   " + "─".repeat(40));
      } catch (error) {
        console.error(`❌ Error reading VM process ${index + 1}:`, error);
      }
    });

    console.log("═".repeat(60));
  }

  /** 🎨 Retourne l'émoji correspondant au statut */
  private getStatusEmoji(status: string): string {
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

  /** ⏱️ Formate le temps d'activité */
  private formatUptime(uptime: number): string {
    if (!uptime) return 'N/A';
    
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
  }

  /** 📡 Envoie le résultat de l'action au serveur central */
  private notifyActionResult(action: string, processId: string, success: boolean): void {
    if (!this.socket || !this.socket.connected) return;

    const result = {
      macAddress: this.macAddress,
      actionType: action,
      targetId: processId,
      success,
      timestamp: new Date().toISOString(),
    };

    this.socket.emit('action-result', result);
    console.log(`📤 Sent action-result for ${action} on ${processId}: ${success ? '✅' : '❌'}`);
  }

  /** 📥 Traite la réponse de la liste des processus */
  private async handleProcessListResponse(data: any): Promise<void> {
    try {
      console.log('📥 Processing process list response for agent:', data.macAddress);
      
      if (data.macAddress === this.macAddress) {
        console.log('✅ Process list response confirmed for this agent');
      } else {
        console.log('ℹ️ Process list response for different agent:', data.macAddress);
      }
    } catch (error: any) {
      console.error('❌ Error handling process list response:', error?.message || error);
    }
  }

  /** 📂 Méthode vide pour compatibilité */
  public async loadMonitoringFile(): Promise<void> {
    console.log("ℹ️ LoadProcess no longer manages monitoring files");
    return Promise.resolve();
  }

  /** 📤 NOUVELLE MÉTHODE: Envoyer immédiatement la liste des processus */
  public async sendInitialProcessList(): Promise<void> {
    console.log('📤 Sending initial process list...');
    await this.sendProcessList();


}  }  

