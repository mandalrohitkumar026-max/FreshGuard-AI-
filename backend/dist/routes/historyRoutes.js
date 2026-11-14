"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const historyController_1 = require("../controllers/historyController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', historyController_1.getHistory);
router.get('/analytics', historyController_1.getAnalytics);
exports.default = router;
//# sourceMappingURL=historyRoutes.js.map