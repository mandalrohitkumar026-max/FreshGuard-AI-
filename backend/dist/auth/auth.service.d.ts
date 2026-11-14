export declare class AuthService {
    private generateAccessToken;
    private generateRefreshToken;
    register(name: string, email: string, password: string): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            role: "user" | "admin";
            plan: "free" | "pro";
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    login(email: string, password: string): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            role: "user" | "admin";
            plan: "free" | "pro";
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    logout(userId: string): Promise<void>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map