"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const Notification_1 = require("../../models/Notification");
const sessionStore_1 = require("../../services/sessionStore");
const freshnessWatchService_1 = require("./freshnessWatchService");
const mongoose_1 = __importDefault(require("mongoose"));
class NotificationController {
    listNotifications = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const userId = req.userId;
        if ((0, sessionStore_1.isMongoConnected)() && userId && mongoose_1.default.Types.ObjectId.isValid(userId)) {
            const dbNotifications = await Notification_1.NotificationModel.find({
                userId: new mongoose_1.default.Types.ObjectId(userId),
            })
                .sort({ createdAt: -1 })
                .limit(50);
            const unreadCount = await Notification_1.NotificationModel.countDocuments({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                read: false,
            });
            return ApiResponse_1.ApiResponse.ok(res, {
                total: dbNotifications.length,
                unreadCount,
                notifications: dbNotifications,
            }, 'Notifications retrieved');
        }
        // In-memory fallback
        const memoryAlerts = freshnessWatchService_1.freshnessWatchService.getAllAlerts(userId);
        return ApiResponse_1.ApiResponse.ok(res, {
            total: memoryAlerts.length,
            unreadCount: memoryAlerts.filter((a) => !a.read).length,
            notifications: memoryAlerts.map((a) => ({
                id: a.id,
                title: `Drift Alert: ${a.type}`,
                message: a.message,
                type: a.type,
                read: a.read,
                createdAt: a.timestamp,
            })),
        }, 'Notifications retrieved');
    });
    markAsRead = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const id = String(req.params.id);
        if ((0, sessionStore_1.isMongoConnected)() && mongoose_1.default.Types.ObjectId.isValid(id)) {
            const query = { _id: id };
            if (req.userId && req.userId !== '000000000000000000000001' && req.userRole !== 'admin') {
                query.userId = new mongoose_1.default.Types.ObjectId(req.userId);
            }
            await Notification_1.NotificationModel.findOneAndUpdate(query, {
                read: true,
                readAt: new Date(),
            });
        }
        return ApiResponse_1.ApiResponse.ok(res, { success: true }, 'Notification marked as read');
    });
    markAllAsRead = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const userId = req.userId;
        if ((0, sessionStore_1.isMongoConnected)() && userId && mongoose_1.default.Types.ObjectId.isValid(userId)) {
            await Notification_1.NotificationModel.updateMany({ userId: new mongoose_1.default.Types.ObjectId(userId), read: false }, { read: true, readAt: new Date() });
        }
        return ApiResponse_1.ApiResponse.ok(res, { success: true }, 'All notifications marked as read');
    });
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
//# sourceMappingURL=notification.controller.js.map