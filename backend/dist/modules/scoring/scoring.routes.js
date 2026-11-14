"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scoringController_1 = require("./scoringController");
const authenticate_1 = require("../../middleware/authenticate");
const router = (0, express_1.Router)();
router.get('/config', scoringController_1.scoringController.getConfig);
router.post('/evaluate-claim', authenticate_1.optionalAuthenticate, scoringController_1.scoringController.evaluateClaim);
router.post('/evaluate-answer', authenticate_1.optionalAuthenticate, scoringController_1.scoringController.evaluateAnswer);
router.post('/recalculate/:sessionId', authenticate_1.optionalAuthenticate, scoringController_1.scoringController.recalculateSession);
exports.default = router;
//# sourceMappingURL=scoring.routes.js.map