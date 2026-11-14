"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const integrations_controller_1 = require("./integrations.controller");
const ai_controller_1 = require("../ai/ai.controller");
const search_controller_1 = require("../search/search.controller");
const router = (0, express_1.Router)();
router.get('/status', integrations_controller_1.integrationsController.getStatus);
router.get('/bifrost/health', ai_controller_1.aiController.getBifrostHealth);
router.get('/tavily/health', search_controller_1.searchController.getTavilyHealth);
exports.default = router;
//# sourceMappingURL=integrations.routes.js.map