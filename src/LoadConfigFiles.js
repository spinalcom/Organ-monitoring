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
var spinal_core_connectorjs_1 = require("spinal-core-connectorjs");
var path = require("path");
var config_1 = require("./config");
var ApiConnector_1 = require("./ApiConnector");
var dotenv_1 = require("dotenv");
dotenv_1["default"].config();
var LoadConfigFiles = /** @class */ (function () {
    function LoadConfigFiles() {
        this.apiConnector = new ApiConnector_1.ApiConnector();
    }
    LoadConfigFiles.prototype.safeParsePercentage = function (value) {
        if (typeof value === 'string') {
            return parseFloat(value.replace('%', '').trim());
        }
        else if (typeof value === 'number') {
            return value;
        }
        return 0;
    };
    LoadConfigFiles.getInstance = function () {
        if (!this.instance)
            this.instance = new LoadConfigFiles();
        return this.instance;
    };
    LoadConfigFiles.prototype.initFiles = function (conn) {
        return __awaiter(this, void 0, void 0, function () {
            var promiseEtc, promisesOrganFiles, hubStatus, files, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promiseEtc = new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                            var directory, _i, directory_1, file, fileLoaded;
                            var _a, _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0: return [4 /*yield*/, conn.load_or_make_dir("/etc")];
                                    case 1:
                                        directory = _c.sent();
                                        _i = 0, directory_1 = directory;
                                        _c.label = 2;
                                    case 2:
                                        if (!(_i < directory_1.length)) return [3 /*break*/, 5];
                                        file = directory_1[_i];
                                        if (!(((_b = (_a = file._info) === null || _a === void 0 ? void 0 : _a.model_type) === null || _b === void 0 ? void 0 : _b.get()) === "model_status")) return [3 /*break*/, 4];
                                        return [4 /*yield*/, file.load()];
                                    case 3:
                                        fileLoaded = _c.sent();
                                        resolve(fileLoaded);
                                        return [2 /*return*/];
                                    case 4:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 5:
                                        reject(new Error("/etc not Found"));
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        promisesOrganFiles = new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                            var directory, files, _i, directory_2, file;
                            var _a, _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0: return [4 /*yield*/, conn.load_or_make_dir("/etc/Organs/Monitoring")];
                                    case 1:
                                        directory = _c.sent();
                                        if (!directory) {
                                            reject(new Error("/etc/Organs/Monitoring not Found"));
                                            return [2 /*return*/];
                                        }
                                        files = [];
                                        for (_i = 0, directory_2 = directory; _i < directory_2.length; _i++) {
                                            file = directory_2[_i];
                                            if (((_b = (_a = file._info) === null || _a === void 0 ? void 0 : _a.model_type) === null || _b === void 0 ? void 0 : _b.get()) === "ConfigFile") {
                                                files.push(file._ptr.load());
                                            }
                                        }
                                        resolve(Promise.all(files));
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, promiseEtc];
                    case 2:
                        hubStatus = _a.sent();
                        return [4 /*yield*/, promisesOrganFiles];
                    case 3:
                        files = _a.sent();
                        return [4 /*yield*/, this.pushDataInMonitoringPlatform(this.apiConnector, files, hubStatus)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        console.error("❌ Failed to initialize files:", error_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    LoadConfigFiles.prototype.pushDataInMonitoringPlatform = function (apiConnector, files, hubStatus) {
        return __awaiter(this, void 0, void 0, function () {
            var vmMonitoringData, infoFiles, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        console.log("🔄 Preparing data for monitoring platform...");
                        return [4 /*yield*/, this.processVmMonitoringFile(files, apiConnector)];
                    case 1:
                        vmMonitoringData = _a.sent();
                        return [4 /*yield*/, this.processOtherFiles(files)];
                    case 2:
                        infoFiles = (_a.sent()).infoFiles;
                        return [4 /*yield*/, this.sendConsolidatedData(apiConnector, hubStatus, infoFiles)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        console.error("❌ Error in pushDataInMonitoringPlatform:", error_2);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    LoadConfigFiles.prototype.processVmMonitoringFile = function (files, apiConnector) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
        return __awaiter(this, void 0, void 0, function () {
            var _i, files_1, file, fileName, vmMonitoringData, payload, pushUrl, error_3;
            return __generator(this, function (_v) {
                switch (_v.label) {
                    case 0:
                        _i = 0, files_1 = files;
                        _v.label = 1;
                    case 1:
                        if (!(_i < files_1.length)) return [3 /*break*/, 8];
                        file = files_1[_i];
                        _v.label = 2;
                    case 2:
                        _v.trys.push([2, 6, , 7]);
                        fileName = (_a = file.genericOrganData) === null || _a === void 0 ? void 0 : _a.name.get();
                        console.log('📝 Processing file:', fileName);
                        if (!(fileName && fileName.startsWith("VM_MONITORING_"))) return [3 /*break*/, 5];
                        console.log("💻 VM_MONITORING detected - processing...");
                        vmMonitoringData = {
                            serverName: String((_c = (_b = file.genericOrganData) === null || _b === void 0 ? void 0 : _b.serverName) === null || _c === void 0 ? void 0 : _c.get()),
                            cpuUsage: this.safeParsePercentage((_e = (_d = file.genericOrganData) === null || _d === void 0 ? void 0 : _d.cpuUsage) === null || _e === void 0 ? void 0 : _e.get()),
                            ramUsage: this.safeParsePercentage((_g = (_f = file.genericOrganData) === null || _f === void 0 ? void 0 : _f.ramUsage) === null || _g === void 0 ? void 0 : _g.get()),
                            totalRam: parseFloat(String((_j = (_h = file.genericOrganData) === null || _h === void 0 ? void 0 : _h.totalRam) === null || _j === void 0 ? void 0 : _j.get()).replace(' GB', '')),
                            freeRam: parseFloat(String((_l = (_k = file.genericOrganData) === null || _k === void 0 ? void 0 : _k.freeRam) === null || _l === void 0 ? void 0 : _l.get()).replace(' GB', '')),
                            totalDisk: parseFloat(String((_o = (_m = file.genericOrganData) === null || _m === void 0 ? void 0 : _m.totalDisk) === null || _o === void 0 ? void 0 : _o.get()).replace(' GB', '')),
                            freeDisk: parseFloat(String((_q = (_p = file.genericOrganData) === null || _p === void 0 ? void 0 : _p.freeDisk) === null || _q === void 0 ? void 0 : _q.get()).replace(' GB', '')),
                            diskUsage: this.safeParsePercentage((_s = (_r = file.genericOrganData) === null || _r === void 0 ? void 0 : _r.diskUsage) === null || _s === void 0 ? void 0 : _s.get()),
                            timestamp: ((_u = (_t = file.genericOrganData) === null || _t === void 0 ? void 0 : _t.lastHealthTime) === null || _u === void 0 ? void 0 : _u.get()) || new Date().toISOString()
                        };
                        payload = {
                            registerKey: process.env.REGISTER_KEY || "defaultKey",
                            infoServer: vmMonitoringData
                        };
                        console.log("📤 Sending VM_MONITORING data:", JSON.stringify(payload, null, 2));
                        pushUrl = config_1["default"].monitoringApiConfig.pushDataServer;
                        if (!pushUrl) return [3 /*break*/, 4];
                        return [4 /*yield*/, apiConnector.post(pushUrl, payload)];
                    case 3:
                        _v.sent();
                        console.log("✅ VM_MONITORING metrics pushed to", pushUrl);
                        _v.label = 4;
                    case 4: return [2 /*return*/, vmMonitoringData];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_3 = _v.sent();
                        console.error('❌ Error processing VM_MONITORING file:', error_3);
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 1];
                    case 8: return [2 /*return*/, null];
                }
            });
        });
    };
    LoadConfigFiles.prototype.processOtherFiles = function (files) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
        return __awaiter(this, void 0, void 0, function () {
            var infoFiles, _i, files_2, file, fileName, infofile;
            return __generator(this, function (_x) {
                infoFiles = [];
                for (_i = 0, files_2 = files; _i < files_2.length; _i++) {
                    file = files_2[_i];
                    try {
                        fileName = (_a = file.genericOrganData) === null || _a === void 0 ? void 0 : _a.name.get();
                        if (fileName === "VM_MONITORING")
                            continue; // Skip already processed
                        console.log('🗂️ Processing other file:', fileName);
                        infofile = {
                            genericOrganData: {
                                id: (_b = file.genericOrganData) === null || _b === void 0 ? void 0 : _b.id.get(),
                                name: fileName,
                                type: (_c = file.genericOrganData) === null || _c === void 0 ? void 0 : _c.type.get(),
                                serverName: (_e = (_d = file.genericOrganData) === null || _d === void 0 ? void 0 : _d.serverName) === null || _e === void 0 ? void 0 : _e.get(),
                                bootTimestamp: (_g = (_f = file.genericOrganData) === null || _f === void 0 ? void 0 : _f.bootTimestamp) === null || _g === void 0 ? void 0 : _g.get(),
                                lastHealthTime: (_j = (_h = file.genericOrganData) === null || _h === void 0 ? void 0 : _h.lastHealthTime) === null || _j === void 0 ? void 0 : _j.get(),
                                ramRssUsed: (_l = (_k = file.genericOrganData) === null || _k === void 0 ? void 0 : _k.ramRssUsed) === null || _l === void 0 ? void 0 : _l.get(),
                                macAdress: (_o = (_m = file.genericOrganData) === null || _m === void 0 ? void 0 : _m.macAdress) === null || _o === void 0 ? void 0 : _o.get(),
                                logList: []
                            },
                            specificOrganData: {
                                port: (_q = (_p = file.specificOrganData) === null || _p === void 0 ? void 0 : _p.port) === null || _q === void 0 ? void 0 : _q.get(),
                                lastAction: {
                                    message: (_t = (_s = (_r = file.specificOrganData) === null || _r === void 0 ? void 0 : _r.lastAction) === null || _s === void 0 ? void 0 : _s.message) === null || _t === void 0 ? void 0 : _t.get(),
                                    date: (_w = (_v = (_u = file.specificOrganData) === null || _u === void 0 ? void 0 : _u.lastAction) === null || _v === void 0 ? void 0 : _v.date) === null || _w === void 0 ? void 0 : _w.get()
                                }
                            }
                        };
                        infoFiles.push(infofile);
                    }
                    catch (error) {
                        console.error('❌ Error processing non-VM file:', error);
                    }
                }
                return [2 /*return*/, { infoFiles: infoFiles }];
            });
        });
    };
    LoadConfigFiles.prototype.sendConsolidatedData = function (apiConnector, hubStatus, infoFiles) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var objBosFile, healthUrl;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        objBosFile = {
                            registerKey: process.env.REGISTER_KEY || "defaultKey",
                            infoHub: {
                                bootTimestamp: (_a = hubStatus.boot_timestamp) === null || _a === void 0 ? void 0 : _a.get(),
                                ramUsageRes: hubStatus.ram_usage_res.get() / 1024,
                                ramUsageVirt: hubStatus.ram_usage_virt.get() / 1024,
                                countSessions: hubStatus.count_sessions.get(),
                                countUsers: hubStatus.count_users.get()
                            },
                            infoOrgans: infoFiles
                        };
                        console.log("📤 Sending consolidated Hub and Organs data:", JSON.stringify(objBosFile, null, 2));
                        healthUrl = config_1["default"].monitoringApiConfig.monitoring_helath_url;
                        if (!healthUrl) return [3 /*break*/, 2];
                        return [4 /*yield*/, apiConnector.post(healthUrl, objBosFile)];
                    case 1:
                        _b.sent();
                        console.log("✅ Non-VM data pushed to", healthUrl);
                        return [3 /*break*/, 3];
                    case 2:
                        console.warn("⚠️ No health URL configured, skipping non-VM push.");
                        _b.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    LoadConfigFiles.prototype._loadConfigFiles = function (connect, fileName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        spinal_core_connectorjs_1.spinalCore.load(connect, path.resolve("/etc/Organs/Monitoring/".concat(fileName)), function (file) { return resolve(file); }, function () {
                            console.error("❌ Error loading file:", fileName);
                            reject("error load file");
                        });
                    })];
            });
        });
    };
    return LoadConfigFiles;
}());
exports["default"] = LoadConfigFiles.getInstance();
