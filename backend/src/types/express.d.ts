export interface RequestUser {
  userId: string;
  email: string;
  role?: 'user' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
      userId?: string;
      userEmail?: string;
      userRole?: 'user' | 'admin';
    }
  }
}

declare module 'supertest' {
  const supertest: any;
  export default supertest;
}
