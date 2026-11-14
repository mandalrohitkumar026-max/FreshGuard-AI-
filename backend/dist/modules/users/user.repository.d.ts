import { IUser } from './user.model';
export declare class UserRepository {
    findByEmail(email: string, includePassword?: boolean): Promise<IUser | null>;
    findById(id: string, includeSecrets?: boolean): Promise<IUser | null>;
    create(userData: {
        name: string;
        email: string;
        passwordHash: string;
        role?: 'user' | 'admin';
        plan?: 'free' | 'pro';
    }): Promise<IUser>;
    update(id: string, updates: Partial<IUser>): Promise<IUser | null>;
    private wrapInMemoryUser;
}
export declare const userRepository: UserRepository;
//# sourceMappingURL=user.repository.d.ts.map