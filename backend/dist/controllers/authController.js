"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.refresh = exports.login = exports.register = void 0;
const asyncWrapper_1 = require("../utils/asyncWrapper");
const authService_1 = require("../services/authService");
exports.register = (0, asyncWrapper_1.asyncWrapper)(async (req, res) => {
    const { name, email, password } = req.body;
    const { user, accessToken, refreshToken } = await (0, authService_1.registerUser)(name, email, password);
    const response = {
        success: true,
        data: {
            userId: user._id.toString(),
            name: user.name,
            email: user.email,
            plan: user.plan,
            accessToken,
            refreshToken,
            expiresIn: 900,
        },
    };
    res.status(201).json(response);
});
exports.login = (0, asyncWrapper_1.asyncWrapper)(async (req, res) => {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await (0, authService_1.loginUser)(email, password);
    res.json({
        success: true,
        data: {
            userId: user._id.toString(),
            name: user.name,
            email: user.email,
            plan: user.plan,
            accessToken,
            refreshToken,
            expiresIn: 900,
        },
    });
});
exports.refresh = (0, asyncWrapper_1.asyncWrapper)(async (req, res) => {
    const { refreshToken } = req.body;
    const tokens = await (0, authService_1.refreshAccessToken)(refreshToken);
    res.json({ success: true, data: { ...tokens, expiresIn: 900 } });
});
exports.logout = (0, asyncWrapper_1.asyncWrapper)(async (req, res) => {
    await (0, authService_1.logoutUser)(req.userId);
    res.json({ success: true, data: { message: 'Logged out successfully' } });
});
exports.getMe = (0, asyncWrapper_1.asyncWrapper)(async (req, res) => {
    res.json({
        success: true,
        data: { userId: req.userId, email: req.userEmail },
    });
});
//# sourceMappingURL=authController.js.map