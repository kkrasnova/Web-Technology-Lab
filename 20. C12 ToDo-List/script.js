const input = document.getElementById('todo-input');
const addButton = document.getElementById('add-button');
const todoList = document.getElementById('todo-list');
const allBtn = document.getElementById('all-btn');
const activeBtn = document.getElementById('active-btn');
const completedBtn = document.getElementById('completed-btn');
const clearCompletedBtn = document.getElementById('clear-completed-btn');

let currentFilter = 'all';

// Функція для збереження списку у localStorage
function saveToLocalStorage(todos) {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Функція для отримання списку з localStorage
function getTodos() {
    return JSON.parse(localStorage.getItem('todos')) || [];
}

// Функція для додавання задачі у DOM
function addTodoToDOM(todo) {
    const li = document.createElement('li');
    li.innerHTML = `
        <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
        <div>
            <button class="complete-btn"><i class="fas fa-check"></i></button>
            <button class="delete-btn"><i class="fas fa-trash"></i></button>
        </div>
    `;
    li.dataset.id = todo.id;
    todoList.appendChild(li);

    // Додаємо обробники подій для кнопок
    li.querySelector('.complete-btn').addEventListener('click', () => toggleComplete(li, todo));
    li.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(li, todo));
}

// Функція для зміни стану виконаності завдання
function toggleComplete(li, todo) {
    todo.completed = !todo.completed;
    li.querySelector('.todo-text').classList.toggle('completed');
    updateLocalStorage();
    applyFilter();
}

// Функція для видалення завдання
function deleteTodo(li, todo) {
    li.remove();
    const todos = getTodos().filter(t => t.id !== todo.id);
    saveToLocalStorage(todos);
}

// Функція для оновлення списку у localStorage
function updateLocalStorage() {
    const todos = Array.from(todoList.children).map(li => ({
        id: li.dataset.id,
        text: li.querySelector('.todo-text').textContent,
        completed: li.querySelector('.todo-text').classList.contains('completed')
    }));
    saveToLocalStorage(todos);
}

// Функція для застосування фільтрації завдань
function applyFilter() {
    const todos = getTodos();
    todoList.innerHTML = '';
    todos.forEach(todo => {
        if (
            currentFilter === 'all' ||
            (currentFilter === 'active' && !todo.completed) ||
            (currentFilter === 'completed' && todo.completed)
        ) {
            addTodoToDOM(todo);
        }
    });
}

// Додати нову задачу
addButton.addEventListener('click', () => {
    const todoText = input.value.trim();
    if (todoText) {
        const newTodo = { id: Date.now().toString(), text: todoText, completed: false };
        const todos = getTodos();
        todos.push(newTodo);
        saveToLocalStorage(todos);
        addTodoToDOM(newTodo);
        input.value = '';
        applyFilter();
    }
});

// Відновлення списку при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    applyFilter();
});

// Додати обробник події для натискання Enter
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addButton.click();
    }
});

// Додати обробник події для натискання кнопок фільтрації
allBtn.addEventListener('click', () => {
    currentFilter = 'all';
    applyFilter();
    setActiveFilterButton(allBtn);
});

activeBtn.addEventListener('click', () => {
    currentFilter = 'active';
    applyFilter();
    setActiveFilterButton(activeBtn);
});

completedBtn.addEventListener('click', () => {
    currentFilter = 'completed';
    applyFilter();
    setActiveFilterButton(completedBtn);
});

clearCompletedBtn.addEventListener('click', () => {
    const todos = getTodos().filter(todo => !todo.completed);
    saveToLocalStorage(todos);
    applyFilter();
});

// Функція для встановлення активної кнопки фільтрації
function setActiveFilterButton(button) {
    [allBtn, activeBtn, completedBtn].forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
}