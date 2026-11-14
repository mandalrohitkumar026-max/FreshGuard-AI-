"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const user_repository_1 = require("./user.repository");
const ApiError_1 = require("../../utils/ApiError");
class UserService {
    async getProfile(userId) {
        const user = await user_repository_1.userRepository.findById(userId, false);
        if (!user) {
            throw ApiError_1.ApiError.notFound('User not found');
        }
        return user;
    }
    async updateProfile(userId, updates) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw ApiError_1.ApiError.notFound('User not found');
        }
        const updated = await user_repository_1.userRepository.update(userId, updates);
        if (!updated) {
            throw ApiError_1.ApiError.internal('Failed to update user profile');
        }
        return updated;
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
//# sourceMappingURL=user.service.js.map