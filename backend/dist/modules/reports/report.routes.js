"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("./report.controller");
const authenticate_1 = require("../../middleware/authenticate");
const router = (0, express_1.Router)();
router.get('/:id', authenticate_1.optionalAuthenticate, report_controller_1.reportController.getReport);
router.post('/:id/share', authenticate_1.optionalAuthenticate, report_controller_1.reportController.shareReport);
exports.default = router;
//# sourceMappingURL=report.routes.js.map