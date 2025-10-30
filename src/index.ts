/*
 * Copyright 2023 SpinalCom - www.spinalcom.com
 * 
 * This file is part of SpinalCore.
 * 
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 * 
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 * 
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */

import LoadConfigFiles from "./LoadConfigFiles";
import ProcessSocketManager from "./LoadProcess";
import cron from 'node-cron';
import { spinalCore, FileSystem } from "spinal-core-connectorjs";
import config from './config';

async function main() {
  const conn = spinalCore.connect(`${config.spinalConnector.protocol}://${config.spinalConnector.user}:${config.spinalConnector.password}@${config.spinalConnector.host}:${config.spinalConnector.port}/`);

  // ✅ CORRECTION: Utiliser getInstance() correctement
  const loaderConfigFiles = LoadConfigFiles.getInstance();
  console.log("📚 Chargement des fichiers de configuration...");
  try {
    await loaderConfigFiles.initFiles(conn);
    console.log("✅ Fichiers de métriques chargés");
  } catch (error: any) {
    console.error("❌ Erreur lors du chargement des métriques:", error?.message || error);
  }

  // ✅ CORRECTION: Récupérer MAC et processus VM après l'initialisation
  const macAddress = loaderConfigFiles.getMacAddress();
  const vmProcesses = loaderConfigFiles.getVmProcesses();

  // ✅ Initialiser le gestionnaire de processus
  const processManager = new ProcessSocketManager(config.monitoringApiConfig.socketUrl);
  
  // ✅ Passer l'adresse MAC
  if (macAddress) {
    processManager.setMacAddress(macAddress);
    console.log(`🔗 MAC Address passed to ProcessManager: ${macAddress}`);
  } else {
    console.warn("⚠️ No MAC address found in LoadConfigFiles");
  }

  // ✅ AJOUT: Passer les processus VM si disponibles
  if (vmProcesses.length > 0) {
    console.log(`📂 Transferring ${vmProcesses.length} VM processes to ProcessSocketManager`);
    processManager.setVmProcesses(vmProcesses);
  } else {
    console.warn('⚠️ No VM processes found to transfer');
  }

  console.log("🔌 Initialisation du gestionnaire de processus...");
  try {
    await processManager.initialize();
    await processManager.loadMonitoringFile();
    console.log("✅ Gestionnaire de processus initialisé");
    
    // ✅ AJOUT: Envoyer immédiatement les processus VM après l'initialisation
    if (vmProcesses.length > 0) {
      console.log("📤 Sending initial VM processes via WebSocket...");
      // Déclencher l'envoi des processus
      await processManager.sendInitialProcessList();
    }
    
  } catch (error: any) {
    console.error("❌ Erreur lors de l'initialisation des processus:", error?.message || error);
    console.log("🔄 L'application continue avec fonctionnalités limitées...");
  }

  // ✅ Cron job pour recharger les métriques ET les processus
  setTimeout(() => {
    cron.schedule('*/1 * * * *', async () => {
      console.log("🔄 Cron job: Rechargement des métriques...");
      try {
        await loaderConfigFiles.initFiles(conn);
        
        // ✅ AMÉLIORATION: Mettre à jour ET envoyer les processus VM à chaque rechargement
        const updatedVmProcesses = loaderConfigFiles.getVmProcesses();
        if (updatedVmProcesses.length > 0) {
          console.log(`🔄 Updating VM processes: ${updatedVmProcesses.length} processes`);
          processManager.setVmProcesses(updatedVmProcesses);
          
          // ✅ AJOUT: Envoyer les processus mis à jour
          await processManager.sendInitialProcessList();
        }
        
      } catch (error: any) {
        console.error("❌ Erreur dans le cron job:", error?.message || error);
      }
    });
    console.log("⏰ Cron job programmé pour les métriques toutes les minutes");
  }, 60000);
}

main().catch((error: any) => {
  console.error("❌ Erreur dans main():", error?.message || error);
  process.exit(1);
});