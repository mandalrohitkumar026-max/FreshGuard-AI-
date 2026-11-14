import { userRepository } from './user.repository';
import { ApiError } from '../../utils/ApiError';
import { IUser } from './user.model';

export class UserService {
  async getProfile(userId: string): Promise<Partial<IUser>> {
    const user = await userRepository.findById(userId, false);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, updates: { name?: string }): Promise<Partial<IUser>> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const updated = await userRepository.update(userId, updates);
    if (!updated) {
      throw ApiError.internal('Failed to update user profile');
    }
    return updated;
  }
}

export const userService = new UserService();
