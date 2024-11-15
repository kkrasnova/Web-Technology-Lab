// Глобальні змінні для зберігання активних підключень
let websocket = null;
let longPollTimeout = null;
let regularPollInterval = null;
let graphqlInterval = null;

// Конфігурація
const SERVER_URL = 'ws://localhost:3000';
const API_URL = 'http://localhost:3000/api';
const REGULAR_POLL_INTERVAL = 2000;

// Статистика
const statistics = {
    websocket: { bytes: 0, time: 0, updates: 0 },
    longpoll: { bytes: 0, time: 0, updates: 0 },
    regularpoll: { bytes: 0, time: 0, updates: 0 },
    graphql: { bytes: 0, time: 0, updates: 0 }
};

// Утиліта для оновлення відображення
function updateDisplay(type, data) {
    const card = document.getElementById(type);
    if (!card) return;

    const startTime = performance.now();
    
    card.querySelector('.btc').textContent = `$${data.bitcoin.toFixed(2)}`;
    card.querySelector('.eth').textContent = `$${data.ethereum.toFixed(2)}`;
    card.querySelector('.timestamp').textContent = `Last update: ${new Date(data.timestamp).toLocaleTimeString()}`;

    // Оновлення статистики
    const dataSize = JSON.stringify(data).length;
    statistics[type].bytes += dataSize;
    statistics[type].updates += 1;
    statistics[type].time = performance.now() - startTime;

    // Оновлення відображення статистики
    document.getElementById(`${type}-bytes`).textContent = statistics[type].bytes;
    document.getElementById(`${type}-time`).textContent = statistics[type].time.toFixed(2);
}

// WebSocket реалізація
function startWebSocket() {
    if (websocket) {
        websocket.close();
    }

    websocket = new WebSocket(SERVER_URL);
    
    websocket.onopen = () => {
        console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        updateDisplay('websocket', data);
    };

    websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
        console.log('WebSocket disconnected');
        websocket = null;
    };
}

// Long Polling реалізація
async function longPoll() {
    try {
        const response = await fetch(`${API_URL}/prices/poll`);
        const data = await response.json();
        updateDisplay('longpoll', data);
        
        longPollTimeout = setTimeout(longPoll, 0);
    } catch (error) {
        console.error('Long polling error:', error);
        longPollTimeout = setTimeout(longPoll, 5000);
    }
}

function startLongPoll() {
    if (longPollTimeout) {
        clearTimeout(longPollTimeout);
    }
    longPoll();
}

// Regular Polling реалізація
async function regularPoll() {
    try {
        const response = await fetch(`${API_URL}/prices`);
        const data = await response.json();
        updateDisplay('regularpoll', data);
    } catch (error) {
        console.error('Regular polling error:', error);
    }
}

function startRegularPoll() {
    if (regularPollInterval) {
        clearInterval(regularPollInterval);
    }
    regularPoll();
    regularPollInterval = setInterval(regularPoll, REGULAR_POLL_INTERVAL);
}

// GraphQL реалізація
async function fetchGraphQLPrices() {
    const query = `
        query {
            getCryptoPrices {
                bitcoin
                ethereum
                timestamp
            }
        }
    `;

    try {
        const response = await fetch('http://localhost:3000/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });

        const { data } = await response.json();
        return data.getCryptoPrices;
    } catch (error) {
        console.error('GraphQL error:', error);
        return null;
    }
}

async function startGraphQLPoll() {
    if (graphqlInterval) {
        clearInterval(graphqlInterval);
    }

    const pollGraphQL = async () => {
        const data = await fetchGraphQLPrices();
        if (data) {
            updateDisplay('graphql', data);
        }
    };

    await pollGraphQL();
    graphqlInterval = setInterval(pollGraphQL, REGULAR_POLL_INTERVAL);
}

// Функція для зупинки всіх підключень
function stopAll() {
    // Зупинка WebSocket
    if (websocket) {
        websocket.close();
        websocket = null;
    }

    // Зупинка Long Polling
    if (longPollTimeout) {
        clearTimeout(longPollTimeout);
        longPollTimeout = null;
    }

    // Зупинка Regular Polling
    if (regularPollInterval) {
        clearInterval(regularPollInterval);
        regularPollInterval = null;
    }

    // Зупинка GraphQL
    if (graphqlInterval) {
        clearInterval(graphqlInterval);
        graphqlInterval = null;
    }

    // Очистка дисплеїв
    ['websocket', 'longpoll', 'regularpoll', 'graphql'].forEach(type => {
        const card = document.getElementById(type);
        if (card) {
            card.querySelector('.btc').textContent = '-';
            card.querySelector('.eth').textContent = '-';
            card.querySelector('.timestamp').textContent = 'Last update: -';
        }
    });
}