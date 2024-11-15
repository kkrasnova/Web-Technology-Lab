class User {
    constructor(username, email, role = 'user') {
        this.username = username;
        this.email = email;
        this.role = role;
        this.createdAt = new Date();
        this.lastLogin = null;
        this.isActive = true;
    }

    updateLastLogin() {
        this.lastLogin = new Date();
    }

    deactivate() {
        this.isActive = false;
    }

    activate() {
        this.isActive = true;
    }

    changeRole(newRole) {
        this.role = newRole;
    }

    toJSON() {
        return {
            username: this.username,
            email: this.email,
            role: this.role,
            createdAt: this.createdAt,
            lastLogin: this.lastLogin,
            isActive: this.isActive
        };
    }
}

module.exports = User;