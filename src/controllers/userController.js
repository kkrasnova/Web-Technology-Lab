const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

const UserController = {
    // Отримати всіх користувачів
    getAllUsers(req, res) {
        res.json(users);
    },

    // Отримати користувача за ID
    getUserById(req, res) {
        const user = users.find(u => u.id === parseInt(req.params.id));
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    },

    // Створити нового користувача
    createUser(req, res) {
        const { name, email } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const newUser = {
            id: users.length + 1,
            name,
            email
        };

        users.push(newUser);
        res.status(201).json(newUser);
    },

    // Оновити користувача
    updateUser(req, res) {
        const { name, email } = req.body;
        const user = users.find(u => u.id === parseInt(req.params.id));

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email;

        res.json(user);
    },

    // Видалити користувача
    deleteUser(req, res) {
        const index = users.findIndex(u => u.id === parseInt(req.params.id));
        
        if (index === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        users.splice(index, 1);
        res.status(204).send();
    }
};

module.exports = UserController;