const User = require('../src/user');

describe('User Model Tests', () => {
    let user;

    beforeEach(() => {
        user = new User('testuser', 'test@example.com');
    });

    test('should create user with default values', () => {
        expect(user.username).toBe('testuser');
        expect(user.email).toBe('test@example.com');
        expect(user.role).toBe('user');
        expect(user.isActive).toBe(true);
        expect(user.lastLogin).toBeNull();
        expect(user.createdAt).toBeInstanceOf(Date);
    });

    test('should update last login', () => {
        user.updateLastLogin();
        expect(user.lastLogin).toBeInstanceOf(Date);
    });

    test('should deactivate user', () => {
        user.deactivate();
        expect(user.isActive).toBe(false);
    });

    test('should activate user', () => {
        user.deactivate();
        user.activate();
        expect(user.isActive).toBe(true);
    });

    test('should change user role', () => {
        user.changeRole('admin');
        expect(user.role).toBe('admin');
    });

    test('should convert to JSON', () => {
        const json = user.toJSON();
        expect(json).toEqual({
            username: 'testuser',
            email: 'test@example.com',
            role: 'user',
            createdAt: user.createdAt,
            lastLogin: null,
            isActive: true
        });
    });
});