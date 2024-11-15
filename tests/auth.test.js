const AuthService = require('../src/auth');

describe('Authentication Tests', () => {
    let authService;

    beforeEach(() => {
        authService = new AuthService();
    });

    describe('Registration', () => {
        test('should successfully register a new user', async () => {
            const user = await authService.register(
                'testuser',
                'test@example.com',
                'password123'
            );
            expect(user.username).toBe('testuser');
            expect(user.email).toBe('test@example.com');
        });

        test('should throw error when registering existing user', async () => {
            await authService.register('testuser', 'test@example.com', 'password123');
            await expect(
                authService.register('testuser', 'test@example.com', 'password123')
            ).rejects.toThrow('User already exists');
        });

        test('should throw error for invalid email', async () => {
            await expect(
                authService.register('testuser', 'invalid-email', 'password123')
            ).rejects.toThrow('Invalid email format');
        });
    });

    describe('Login', () => {
        test('should successfully login and return token', async () => {
            await authService.register('testuser', 'test@example.com', 'password123');
            const result = await authService.login('testuser', 'password123');
            
            expect(result.token).toBeTruthy();
            expect(result.user.username).toBe('testuser');
            expect(result.user.email).toBe('test@example.com');
        });

        test('should throw error for non-existent user', async () => {
            await expect(
                authService.login('nonexistent', 'password123')
            ).rejects.toThrow('User not found');
        });

        test('should throw error for invalid password', async () => {
            await authService.register('testuser', 'test@example.com', 'password123');
            await expect(
                authService.login('testuser', 'wrongpassword')
            ).rejects.toThrow('Invalid password');
        });
    });

    describe('Token Verification', () => {
        test('should verify valid token', async () => {
            await authService.register('testuser', 'test@example.com', 'password123');
            const { token } = await authService.login('testuser', 'password123');
            const decoded = authService.verifyToken(token);
            expect(decoded.username).toBe('testuser');
        });

        test('should throw error for invalid token', () => {
            expect(() => 
                authService.verifyToken('invalid-token')
            ).toThrow('Invalid token');
        });
    });

    describe('User Management', () => {
        test('should deactivate and activate user', async () => {
            await authService.register('testuser', 'test@example.com', 'password123');
            
            let user = authService.deactivateUser('testuser');
            expect(user.isActive).toBe(false);

            user = authService.activateUser('testuser');
            expect(user.isActive).toBe(true);
        });

        test('should change user role', async () => {
            await authService.register('testuser', 'test@example.com', 'password123');
            
            const user = authService.changeUserRole('testuser', 'admin');
            expect(user.role).toBe('admin');
        });
    });
});