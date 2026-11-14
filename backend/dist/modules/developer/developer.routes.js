"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const developerController_1 = require("./developerController");
const developerAuthMiddleware_1 = require("./developerAuthMiddleware");
const authenticate_1 = require("../../middleware/authenticate");
const router = (0, express_1.Router)();
// Developer API Key Management
router.post('/keys', authenticate_1.optionalAuthenticate, developerController_1.developerController.createKey);
router.get('/keys', authenticate_1.optionalAuthenticate, developerController_1.developerController.listKeys);
router.delete('/keys/:id', authenticate_1.optionalAuthenticate, developerController_1.developerController.revokeKey);
// Authenticated Developer Endpoints (requireApiKey)
router.post('/verify', developerAuthMiddleware_1.requireApiKey, developerController_1.developerController.verify);
router.get('/reports/:id', developerAuthMiddleware_1.requireApiKey, developerController_1.developerController.getReport);
router.get('/conflicts/:id', developerAuthMiddleware_1.requireApiKey, developerController_1.developerController.getConflicts);
router.get('/audit-trail/:id', developerAuthMiddleware_1.requireApiKey, developerController_1.developerController.getAuditTrail);
exports.default = router;
//# sourceMappingURL=developer.routes.js.map