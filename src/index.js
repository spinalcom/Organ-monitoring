"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
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
var LoadConfigFiles_1 = require("./LoadConfigFiles");
var node_cron_1 = require("node-cron");
var spinal_core_connectorjs_1 = require("spinal-core-connectorjs");
var config_1 = require("./config");
var spinal_lib_organ_monitoring_1 = require("spinal-lib-organ-monitoring");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var conn, protocol, connect_opt, fileName, type, Ip, RequestPort;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    protocol = process.env.SPINALHUB_PROTOCOL || "http";
                    connect_opt = "".concat(protocol, "://").concat(config_1["default"].spinalConnector.user, ":").concat(config_1["default"].spinalConnector.password, "@").concat(config_1["default"].spinalConnector.host);
                    if (config_1["default"].spinalConnector.port !== undefined) {
                        connect_opt += ":".concat(config_1["default"].spinalConnector.port, "/");
                    }
                    // initialize the connection
                    conn = spinal_core_connectorjs_1.spinalCore.connect(connect_opt);
                    fileName = process.env.ORGAN_NAME;
                    type = process.env.ORGAN_TYPE;
                    Ip = process.env.SPINALHUB_IP === undefined ? "" : process.env.SPINALHUB_IP;
                    RequestPort = process.env.REQUESTS_PORT === undefined ? "" : process.env.REQUESTS_PORT;
                    if (!(fileName !== undefined && type !== undefined)) return [3 /*break*/, 2];
                    return [4 /*yield*/, spinal_lib_organ_monitoring_1["default"].init(conn, fileName, type, Ip, parseInt(RequestPort))];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    //await LoadConfigFiles.initFiles(conn);
                    // Delay the start of the cron job by a certain amount of time
                    setTimeout(function () {
                        node_cron_1["default"].schedule('*/1 * * * *', function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, LoadConfigFiles_1["default"].initFiles(conn)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    }, 60000); // 5 sec delay
                    return [2 /*return*/];
            }
        });
    });
}
;
main();
