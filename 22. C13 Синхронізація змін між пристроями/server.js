// Імпорт необхідних модулів
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Створення HTTP-сервера
const server = http.createServer((req, res) => {
    // Визначення шляху до файлу
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    // Визначення типу контенту на основі розширення файлу
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css'
    }[extname] || 'application/octet-stream';

    // Читання та відправка файлу
    fs.readFile(filePath, (error, content) => {
        if (error) {
            // Обробка помилок читання файлу
            if(error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('Файл не знайдено');
            } else {
                res.writeHead(500);
                res.end('Вибачте, зверніться до адміністратора сайту щодо помилки: '+error.code+' ..\n');
            }
        } else {
            // Відправка успішної відповіді
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Створення WebSocket-сервера
const wss = new WebSocket.Server({ server });

// Шлях до файлу з даними
const dataPath = path.join(__dirname, 'data.json');

// Функція для читання даних з файлу
function readData() {
    try {
        const data = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Помилка читання файлу даних:', error);
        return { todos: [] };
    }
}

// Функція для запису даних у файл
function writeData(data) {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Помилка запису у файл даних:', error);
    }
}

// Зчитування початкових даних
let { todos } = readData();

// Функція для розсилки оновлень всім клієнтам
function broadcastUpdate() {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
                type: 'update', 
                todos: todos
            }));
        }
    });
}

// Обробка нових WebSocket-з'єднань
wss.on('connection', function connection(ws) {
    console.log('Новий клієнт підключився');
    
    // Відправка повного стану при підключенні
    ws.send(JSON.stringify({ type: 'fullState', todos }));
    
    // Обробка вхідних повідомлень
    ws.on('message', function incoming(message) {
        console.log('Отримано повідомлення:', message.toString());
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'action') {
                let updated = false;
                switch(data.action) {
                    case 'add':
                        todos.push(data.todo);
                        updated = true;
                        break;
                    case 'toggle':
                        const todoToToggle = todos.find(t => t.id === data.todo.id);
                        if (todoToToggle) {
                            todoToToggle.completed = data.todo.completed;
                            updated = true;
                        }
                        break;
                    case 'delete':
                        todos = todos.filter(t => t.id !== data.todo.id);
                        updated = true;
                        break;
                    case 'clearCompleted':
                        todos = todos.filter(todo => !todo.completed);
                        updated = true;
                        break;
                }
                
                // Якщо були зміни, зберігаємо дані та розсилаємо оновлення
                if (updated) {
                    writeData({ todos });
                    broadcastUpdate();
                }
            }
        } catch (error) {
            console.error('Помилка обробки повідомлення:', error);
        }
    });

    // Обробка закриття з'єднання
    ws.on('close', function() {
        console.log('Клієнт відключився');
    });
});

// Запуск сервера
server.listen(8080, () => {
    console.log('Сервер запущено на http://localhost:8080');
});