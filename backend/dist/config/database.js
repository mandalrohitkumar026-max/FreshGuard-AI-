"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMongoConnected = isMongoConnected;
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("./logger");
function isMongoConnected() {
    return mongoose_1.default.connection.readyState === 1;
}
async function connectDB() {
    try {
        mongoose_1.default.set('strictQuery', true);
        await mongoose_1.default.connect(env_1.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            minPoolSize: 2,
            maxPoolSize: 10,
        });
        logger_1.logger.info('✅ MongoDB connected', {
            host: mongoose_1.default.connection.host,
            name: mongoose_1.default.connection.name,
        });
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.logger.error('MongoDB connection error', { error: err.message });
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.logger.warn('MongoDB disconnected');
        });
    }
    catch (error) {
        logger_1.logger.warn('⚠️ MongoDB connection could not be established. Operating in resilient hybrid/in-memory mode.', {
            error: error instanceof Error ? error.message : String(error),
        });
    }
}
async function disconnectDB() {
    if (mongoose_1.default.connection.readyState !== 0) {
        await mongoose_1.default.disconnect();
        logger_1.logger.info('MongoDB disconnected gracefully');
    }
}
//# sourceMappingURL=database.js.map