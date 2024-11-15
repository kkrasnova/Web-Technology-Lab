// Глобальні змінні для зберігання активних підключень
let websocket = null;
let longPollTimeout = null;
let regularPollInterval = null;

// Конфігурація
const SERVER_URL = 'ws://localhost:3000';
const API_URL = 'http://localhost:3000/api';
const REGULAR_POLL_INTERVAL = 2000; // 2 секунди

// Утиліта для оновлення відображення
function updateDisplay(type, data) {
    const card = document.getElementById(type);
    if (!card) return;

    card.querySelector('.btc').textContent = `$${data.bitcoin.toFixed(2)}`;
    card.querySelector('.eth').textContent = `$${data.ethereum.toFixed(2)}`;
    card.querySelector('.timestamp').textContent = `Last update: ${new Date(data.timestamp).toLocaleTimeString()}`;
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
        
        // Відразу запускаємо наступний запит
        longPollTimeout = setTimeout(longPoll, 0);
    } catch (error) {
        console.error('Long polling error:', error);
        // При помилці повторюємо через 5 секунд
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
    regularPoll(); // Перший запит одразу
    regularPollInterval = setInterval(regularPoll, REGULAR_POLL_INTERVAL);
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

    // Очистка дисплеїв
    ['websocket', 'longpoll', 'regularpoll'].forEach(type => {
        const card = document.getElementById(type);
        if (card) {
            card.querySelector('.btc').textContent = '-';
            card.querySelector('.eth').textContent = '-';
            card.querySelector('.timestamp').textContent = 'Last update: -';
        }
    });
}

// Додамо моніторинг мережевого трафіку
const originalFetch = window.fetch;
let totalBytesSent = 0;
let totalBytesReceived = 0;

window.fetch = async function(...args) {
    const startTime = performance.now();
    const response = await originalFetch(...args);
    const endTime = performance.now();

    // Підрахунок приблизного розміру запиту
    const requestSize = JSON.stringify(args).length;
    totalBytesSent += requestSize;

    // Клонуємо відповідь для підрахунку розміру
    const clone = response.clone();
    const text = await clone.text();
    totalBytesReceived += text.length;

    console.log(`Request took ${endTime - startTime}ms`);
    console.log(`Total bytes sent: ${totalBytesSent}`);
    console.log(`Total bytes received: ${totalBytesReceived}`);

    return response;
};