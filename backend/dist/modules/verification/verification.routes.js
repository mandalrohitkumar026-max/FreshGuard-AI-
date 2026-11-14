"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verification_controller_1 = require("./verification.controller");
const authenticate_1 = require("../../middleware/authenticate");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const zodValidationMiddleware_1 = require("../../middleware/zodValidationMiddleware");
const verification_validation_1 = require("./verification.validation");
const router = (0, express_1.Router)();
// Phase 08 Direct Verification Runner
router.post('/run', authenticate_1.optionalAuthenticate, rateLimiter_1.verifyRateLimiter, verification_controller_1.verificationController.verifyDirect);
// Answer Evolution Runner (Submit Revision)
router.post('/evolve', authenticate_1.optionalAuthenticate, rateLimiter_1.verifyRateLimiter, verification_controller_1.verificationController.submitRevision);
// Standard Session Creation
router.post('/', authenticate_1.optionalAuthenticate, rateLimiter_1.verifyRateLimiter, (0, zodValidationMiddleware_1.validate)({ body: verification_validation_1.createVerificationSchema.shape.body }), verification_controller_1.verificationController.createVerification);
router.get('/', authenticate_1.optionalAuthenticate, (0, zodValidationMiddleware_1.validate)({ query: verification_validation_1.verificationQuerySchema.shape.query }), verification_controller_1.verificationController.listSessions);
// Specific Claim Evidence Retrieval
router.get('/claims/:claimId/evidence', authenticate_1.optionalAuthenticate, verification_controller_1.verificationController.getClaimEvidence);
// Run Verification Pipeline on Session
router.post('/:id/run', authenticate_1.optionalAuthenticate, rateLimiter_1.verifyRateLimiter, (0, zodValidationMiddleware_1.validate)({ params: verification_validation_1.verificationIdParamSchema.shape.params }), verification_controller_1.verificationController.runVerification);
// Get Verification Results
router.get('/:id/results', authenticate_1.optionalAuthenticate, (0, zodValidationMiddleware_1.validate)({ params: verification_validation_1.verificationIdParamSchema.shape.params }), verification_controller_1.verificationController.getResults);
// Get Grounded Correction
router.get('/:id/correction', authenticate_1.optionalAuthenticate, (0, zodValidationMiddleware_1.validate)({ params: verification_validation_1.verificationIdParamSchema.shape.params }), verification_controller_1.verificationController.getCorrection);
// Get Evidence Conflicts
router.get('/:id/conflicts', authenticate_1.optionalAuthenticate, (0, zodValidationMiddleware_1.validate)({ params: verification_validation_1.verificationIdParamSchema.shape.params }), verification_controller_1.verificationController.getConflicts);
// Get Answer Evolution
router.get('/:id/evolution', authenticate_1.optionalAuthenticate, (0, zodValidationMiddleware_1.validate)({ params: verification_validation_1.verificationIdParamSchema.shape.params }), verification_controller_1.verificationController.getEvolution);
// Get Verification Audit Trail
router.get('/:id/audit-trail', authenticate_1.optionalAuthenticate, (0, zodValidationMiddleware_1.validate)({ params: verification_validation_1.verificationIdParamSchema.shape.params }), verification_controller_1.verificationController.getAuditTrail);
// Export Downloadable JSON Audit Package
router.get('/:id/audit-trail/export', authenticate_1.optionalAuthenticate, (0, zodValidationMiddleware_1.validate)({ params: verification_validation_1.verificationIdParamSchema.shape.params }), verification_controller_1.verificationController.exportAuditTrail);
router.get('/:id', authenticate_1.optionalAuthenticate, (0, zodValidationMiddleware_1.validate)({ params: verification_validation_1.verificationIdParamSchema.shape.params }), verification_controller_1.verificationController.getSession);
router.delete('/:id', authenticate_1.optionalAuthenticate, (0, zodValidationMiddleware_1.validate)({ params: verification_validation_1.verificationIdParamSchema.shape.params }), verification_controller_1.verificationController.deleteSession);
router.get('/:id/claims', authenticate_1.optionalAuthenticate, (0, zodValidationMiddleware_1.validate)({ params: verification_validation_1.verificationIdParamSchema.shape.params }), verification_controller_1.verificationController.getClaims);
router.get('/:id/report', authenticate_1.optionalAuthenticate, (0, zodValidationMiddleware_1.validate)({ params: verification_validation_1.verificationIdParamSchema.shape.params }), verification_controller_1.verificationController.getReport);
exports.default = router;
//# sourceMappingURL=verification.routes.js.map