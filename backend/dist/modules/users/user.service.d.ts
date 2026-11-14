import { IUser } from './user.model';
export declare class UserService {
    getProfile(userId: string): Promise<Partial<IUser>>;
    updateProfile(userId: string, updates: {
        name?: string;
    }): Promise<Partial<IUser>>;
}
export declare const userService: UserService;
//# sourceMappingURL=user.service.d.ts.map