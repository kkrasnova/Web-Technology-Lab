const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('./user');

class AuthService {
    constructor() {
        this.users = new Map();
        this.userCredentials = new Map();
        this.SECRET_KEY = 'your-secret-key';
    }

    async register(username, email, password) {
        if (this.users.has(username)) {
            throw new Error('User already exists');
        }

        // Проверка формата email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User(username, email);
        
        this.users.set(username, newUser);
        this.userCredentials.set(username, hashedPassword);

        return newUser;
    }

    async login(username, password) {
        const user = this.users.get(username);
        const hashedPassword = this.userCredentials.get(username);

        if (!user || !hashedPassword) {
            throw new Error('User not found');
        }

        if (!user.isActive) {
            throw new Error('User account is deactivated');
        }

        const isValid = await bcrypt.compare(password, hashedPassword);
        if (!isValid) {
            throw new Error('Invalid password');
        }

        user.updateLastLogin();
        const token = jwt.sign({ 
            username,
            role: user.role,
            email: user.email 
        }, this.SECRET_KEY, { 
            expiresIn: '1h' 
        });

        return { token, user: user.toJSON() };
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, this.SECRET_KEY);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    getUser(username) {
        const user = this.users.get(username);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    deactivateUser(username) {
        const user = this.getUser(username);
        user.deactivate();
        return user;
    }

    activateUser(username) {
        const user = this.getUser(username);
        user.activate();
        return user;
    }

    changeUserRole(username, newRole) {
        const user = this.getUser(username);
        user.changeRole(newRole);
        return user;
    }
}

module.exports = AuthService;