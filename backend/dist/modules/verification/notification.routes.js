"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const authenticate_1 = require("../../middleware/authenticate");
const router = (0, express_1.Router)();
router.get('/', authenticate_1.optionalAuthenticate, notification_controller_1.notificationController.listNotifications);
router.patch('/read-all', authenticate_1.optionalAuthenticate, notification_controller_1.notificationController.markAllAsRead);
router.patch('/:id/read', authenticate_1.optionalAuthenticate, notification_controller_1.notificationController.markAsRead);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map