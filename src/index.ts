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
// import { ConfigFileModel, ConfigFile } from "spinal-lib-organ-monitoring"
// console.log(ConfigFile);
import LoadConfigFiles from "./LoadConfigFiles";
import cron from 'node-cron';
import { Lst, spinalCore, FileSystem } from "spinal-core-connectorjs";
import config from './config';
import ConfigFile from 'spinal-lib-organ-monitoring';

async function main() {

  let conn: FileSystem;
    // connection string to connect to spinalhub
    const protocol = process.env.SPINALHUB_PROTOCOL || "http";

    let connect_opt = `${protocol}://${config.spinalConnector.user}:${config.spinalConnector.password}@${config.spinalConnector.host}`;
    if (config.spinalConnector.port !== undefined) {
      connect_opt += `:${config.spinalConnector.port}/`;
    }
    // initialize the connection
    conn = spinalCore.connect(connect_opt);
    const fileName = process.env.ORGAN_NAME;
    const type = process.env.ORGAN_TYPE;
    const Ip = process.env.SPINALHUB_IP === undefined ? "" : process.env.SPINALHUB_IP
    const RequestPort = process.env.REQUESTS_PORT === undefined ? "" : process.env.REQUESTS_PORT
    if (fileName !== undefined && type !== undefined) {
      await ConfigFile.init(
        conn,
        fileName,
        type,
        Ip,
        parseInt(RequestPort)
      );
    }

  //await LoadConfigFiles.initFiles(conn);
  
  // Delay the start of the cron job by a certain amount of time
  setTimeout(() => {
    cron.schedule('*/1 * * * *', async () => {
      await LoadConfigFiles.initFiles(conn);
    });
  },60000); // 5 sec delay
};
main();