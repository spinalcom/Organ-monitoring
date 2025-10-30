export default class ProcessSocketManager {
    private socket;
    private socketUrl;
    private macAddress;
    private vmProcesses;
    constructor(socketUrl: string);
    /** 🏷️ Définit l'adresse MAC (fournie par LoadConfigFiles) */
    setMacAddress(macAddress: string): void;
    /** 📂 NOUVELLE MÉTHODE: Définit les processus depuis le fichier VM_Monitoring */
    setVmProcesses(processes: any[]): void;
    /** 🔌 Initialise la connexion socket.io */
    initialize(): Promise<void>;
    /** 🧠 Gestion des actions reçues (restart, stop, start, etc.) */
    private handleAction;
    /** 🔗 Connexion à PM2 */
    private connectToPM2;
    /** ♻️ Redémarre un processus PM2 */
    private restartProcess;
    /** ⛔ Arrête un processus PM2 */
    private stopProcess;
    /** ▶️ Démarre un processus PM2 */
    private startProcess;
    /** 📋 Envoie la liste des processus du fichier VM_Monitoring au serveur */
    private sendProcessList;
    /** 📋 NOUVELLE MÉTHODE: Affiche la liste des processus du fichier VM_Monitoring */
    private displayVmProcessList;
    /** 🎨 Retourne l'émoji correspondant au statut */
    private getStatusEmoji;
    /** ⏱️ Formate le temps d'activité */
    private formatUptime;
    /** 📡 Envoie le résultat de l'action au serveur central */
    private notifyActionResult;
    /** 📥 Traite la réponse de la liste des processus */
    private handleProcessListResponse;
    /** 📂 Méthode vide pour compatibilité */
    loadMonitoringFile(): Promise<void>;
}
