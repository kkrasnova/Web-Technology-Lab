const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const { graphqlHTTP } = require('express-graphql');
const { schema, latestPrices } = require('./schema');

console.log('Starting server initialization...');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '../client')));

// Додаємо GraphQL endpoint
app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true
}));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Оновлена функція отримання цін
function getCryptoPrice() {
    const prices = {
        bitcoin: Math.random() * 40000 + 30000,
        ethereum: Math.random() * 2000 + 1000,
        timestamp: new Date().toISOString()
    };
    
    Object.assign(latestPrices, prices);
    return prices;
}

// WebSocket підключення
wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    
    const interval = setInterval(() => {
        ws.send(JSON.stringify(getCryptoPrice()));
    }, 2000);

    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(interval);
    });
});

// REST endpoint для Long Poll
let clients = [];
app.get('/api/prices/poll', (req, res) => {
    console.log('New Long Poll request received');
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
    if (clients.length > 0) {
        console.log(`Sending updates to ${clients.length} long poll clients`);
        clients.forEach(client => {
            client.res.json(price);
        });
        clients = [];
    }
}, 2000);

// Звичайний REST endpoint для Regular Polling
app.get('/api/prices', (req, res) => {
    console.log('Regular Poll request received');
    res.json(getCryptoPrice());
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`WebSocket server is ready`);
    console.log(`GraphQL UI available at http://localhost:${PORT}/graphql`);
    console.log(`Client interface available at http://localhost:${PORT}`);
});