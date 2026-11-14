"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const freshnessWatchController_1 = require("./freshnessWatchController");
const authenticate_1 = require("../../middleware/authenticate");
const router = (0, express_1.Router)();
router.post('/', authenticate_1.optionalAuthenticate, freshnessWatchController_1.freshnessWatchController.createWatch);
router.get('/', authenticate_1.optionalAuthenticate, freshnessWatchController_1.freshnessWatchController.listWatches);
router.get('/alerts', authenticate_1.optionalAuthenticate, freshnessWatchController_1.freshnessWatchController.getAlerts);
router.get('/:id', authenticate_1.optionalAuthenticate, freshnessWatchController_1.freshnessWatchController.getWatch);
router.post('/:id/check', authenticate_1.optionalAuthenticate, freshnessWatchController_1.freshnessWatchController.triggerCheck);
router.patch('/:id/toggle', authenticate_1.optionalAuthenticate, freshnessWatchController_1.freshnessWatchController.toggleWatch);
router.delete('/:id', authenticate_1.optionalAuthenticate, freshnessWatchController_1.freshnessWatchController.cancelWatch);
exports.default = router;
//# sourceMappingURL=freshnessWatch.routes.js.map