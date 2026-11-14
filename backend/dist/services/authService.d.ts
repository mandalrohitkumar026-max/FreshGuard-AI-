import { IUser } from '../models/User';
import { JwtPayload } from '../types/verification.types';
export declare function verifyAccessToken(token: string): JwtPayload;
export declare function verifyRefreshToken(token: string): JwtPayload;
export declare function registerUser(name: string, email: string, password: string): Promise<{
    user: IUser;
    accessToken: string;
    refreshToken: string;
}>;
export declare function loginUser(email: string, password: string): Promise<{
    user: IUser;
    accessToken: string;
    refreshToken: string;
}>;
export declare function refreshAccessToken(incomingRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
}>;
export declare function logoutUser(userId: string): Promise<void>;
//# sourceMappingURL=authService.d.ts.map