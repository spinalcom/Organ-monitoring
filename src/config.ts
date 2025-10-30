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

const config = {
  spinalConnector: {
    protocol: process.env.SPINALHUB_PROTOCOL || "http", // user id
    user: process.env.SPINAL_USER_ID || "default_user", // user id
    password: process.env.SPINAL_PASSWORD || "default_password", // user password
    host: process.env.SPINALHUB_IP || "localhost", // can be an ip address
    port: process.env.SPINALHUB_PORT || "7777", // port
  },
  socketConfig: {
    url: process.env.SOCKET_SERVER_URL || "http://localhost:3000",
    options: {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    }
  },

  monitoringApiConfig: {
    TokenBosRegister: process.env.TOKEN_BOS_REGISTER,
    monitoring_url: process.env.MONITORING_URL,
    monitoring_helath_url: process.env.MONITORING_HEALTH_URL,
    pushDataServer:process.env.APISERVER,
    organName: process.env.ORGAN_NAME,
    email: process.env.EMAIL,
    password: process.env.PASSWORD,
    grant_type: process.env.GRANT_TYPE,
    processListUrl: process.env.PROCESS_LIST_URL || "http://146.59.157.197:3001/process-list",
    restartProcessUrl: process.env.RESTART_PROCESS_URL || "http://146.59.157.197:3001/restart-process/",
    socketUrl: process.env.SOCKET_IO_URL || "http://146.59.157.197:5053"
  }
};
export default config;