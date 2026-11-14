"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const env_1 = require("../config/env");
const { combine, timestamp, errors, json, colorize, simple } = winston_1.default.format;
const developmentFormat = combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), simple());
const productionFormat = combine(timestamp(), errors({ stack: true }), json());
exports.logger = winston_1.default.createLogger({
    level: env_1.env.LOG_LEVEL,
    format: env_1.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
    defaultMeta: { service: 'freshguard-api' },
    transports: [
        new winston_1.default.transports.Console(),
    ],
    // Suppress during tests
    silent: env_1.env.NODE_ENV === 'test',
});
//# sourceMappingURL=logger.js.map