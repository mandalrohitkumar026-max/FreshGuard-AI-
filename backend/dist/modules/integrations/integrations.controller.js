"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationsController = exports.IntegrationsController = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const integrations_service_1 = require("./integrations.service");
class IntegrationsController {
    getStatus = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const status = await integrations_service_1.integrationsService.getStatus();
        return ApiResponse_1.ApiResponse.ok(res, status, 'Integration status retrieved');
    });
}
exports.IntegrationsController = IntegrationsController;
exports.integrationsController = new IntegrationsController();
//# sourceMappingURL=integrations.controller.js.map