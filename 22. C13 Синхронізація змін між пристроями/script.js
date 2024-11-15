console.log("Скрипт запущено");

// Отримання посилань на елементи DOM
const input = document.getElementById('todo-input');
const addButton = document.getElementById('add-button');
const todoList = document.getElementById('todo-list');
const allBtn = document.getElementById('all-btn');
const activeBtn = document.getElementById('active-btn');
const completedBtn = document.getElementById('completed-btn');
const clearCompletedBtn = document.getElementById('clear-completed-btn');

// Ініціалізація змінних
let currentFilter = 'all';
let todos = [];

// Створення WebSocket-з'єднання
const socket = new WebSocket('ws://localhost:8080');

// Обробник відкриття з'єднання
socket.onopen = function(event) {
    console.log("WebSocket-з'єднання встановлено");
};

// Обробник помилок WebSocket
socket.onerror = function(error) {
    console.error('Помилка WebSocket: ', error);
};

// Обробник закриття з'єднання
socket.onclose = function(event) {
    console.log("WebSocket-з'єднання закрито");
};

// Обробник вхідних повідомлень
socket.onmessage = function(event) {
    console.log("Отримано повідомлення від сервера:", event.data);
    const data = JSON.parse(event.data);
    if (data.type === 'fullState' || data.type === 'update') {
        todos = data.todos;
        renderTodos();
    }
};

// Функція для відправки оновлень на сервер
function sendUpdate(action, todo) {
    if (socket.readyState === WebSocket.OPEN) {
        console.log("Відправка оновлення на сервер:", action, todo);
        socket.send(JSON.stringify({ type: 'action', action, todo }));
    } else {
        console.warn("WebSocket-з'єднання не відкрите. Неможливо відправити оновлення.");
    }
}

// Функція додавання нового завдання
function addTodo(text) {
    const newTodo = { id: Date.now().toString(), text: text, completed: false };
    sendUpdate('add', newTodo);
}

// Функція перемикання стану завершення завдання
function toggleComplete(todo) {
    sendUpdate('toggle', {...todo, completed: !todo.completed});
}

// Функція видалення завдання
function deleteTodo(todo) {
    sendUpdate('delete', todo);
}

// Функція відображення завдань
function renderTodos() {
    todoList.innerHTML = '';
    todos.forEach(todo => {
        if (
            currentFilter === 'all' ||
            (currentFilter === 'active' && !todo.completed) ||
            (currentFilter === 'completed' && todo.completed)
        ) {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
                <div>
                    <button class="complete-btn"><i class="fas fa-${todo.completed ? 'undo' : 'check'}"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            `;
            li.querySelector('.complete-btn').addEventListener('click', () => toggleComplete(todo));
            li.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(todo));
            todoList.appendChild(li);
        }
    });
}

// Обробник кліку на кнопку додавання
addButton.addEventListener('click', () => {
    const todoText = input.value.trim();
    if (todoText) {
        addTodo(todoText);
        input.value = '';
    }
});

// Обробники кліків на кнопки фільтрів
allBtn.addEventListener('click', () => {
    currentFilter = 'all';
    renderTodos();
    setActiveFilterButton(allBtn);
});

activeBtn.addEventListener('click', () => {
    currentFilter = 'active';
    renderTodos();
    setActiveFilterButton(activeBtn);
});

completedBtn.addEventListener('click', () => {
    currentFilter = 'completed';
    renderTodos();
    setActiveFilterButton(completedBtn);
});

// Обробник кліку на кнопку очищення завершених завдань
clearCompletedBtn.addEventListener('click', () => {
    sendUpdate('clearCompleted', null);
});

// Функція встановлення активної кнопки фільтра
function setActiveFilterButton(button) {
    [allBtn, activeBtn, completedBtn].forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
}

// Початкове відображення завдань
renderTodos();