const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '../client')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Імітація отримання даних про ціни
function getCryptoPrice() {
    return {
        bitcoin: Math.random() * 40000 + 30000,
        ethereum: Math.random() * 2000 + 1000,
        timestamp: new Date().toISOString()
    };
}

// WebSocket підключення
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    // Відправляємо оновлення кожні 2 секунди
    const interval = setInterval(() => {
        ws.send(JSON.stringify(getCryptoPrice()));
    }, 2000);

    ws.on('close', () => {
        clearInterval(interval);
    });
});

// REST endpoint для Long Poll
let clients = [];
app.get('/api/prices/poll', (req, res) => {
    const client = {
        id: Date.now(),
        res
    };
    clients.push(client);

    req.on('close', () => {
        clients = clients.filter(c => c.id !== client.id);
    });
});

// Оновлення даних для Long Poll клієнтів
setInterval(() => {
    const price = getCryptoPrice();
    clients.forEach(client => {
        client.res.json(price);
    });
    clients = [];
}, 2000);

// Звичайний REST endpoint для Regular Polling
app.get('/api/prices', (req, res) => {
    res.json(getCryptoPrice());
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});