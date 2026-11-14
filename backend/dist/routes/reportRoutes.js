"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController_1 = require("../controllers/reportController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Public report (no auth)
router.get('/public/:slug', reportController_1.getPublicReport);
// All other report routes require auth
router.use(authMiddleware_1.authMiddleware);
router.get('/', reportController_1.listReports);
router.get('/:reportId', reportController_1.getReport);
router.post('/:reportId/share', reportController_1.shareReport);
exports.default = router;
//# sourceMappingURL=reportRoutes.js.map