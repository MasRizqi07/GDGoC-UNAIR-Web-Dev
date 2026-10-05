document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const taskCount = document.getElementById('taskCount');
    const clearBtn = document.getElementById('clearBtn');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('i');

    // Theme Management
    let isDarkMode = localStorage.getItem('theme') === 'dark';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeIcon.className = 'fa-solid fa-sun';
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        themeIcon.className = isDarkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    });

    // State management: Load from Local Storage or default to empty array
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // Initialize UI
    renderTasks();

    // Event Listeners
    addTaskBtn.addEventListener('click', handleAddTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddTask();
    });
    clearBtn.addEventListener('click', handleClearAll);

    // Add a new task
    function handleAddTask() {
        const text = taskInput.value.trim();
        if (!text) {
            taskInput.focus();
            return;
        }

        const newTask = {
            id: Date.now().toString(),
            text: text,
            completed: false
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        
        taskInput.value = '';
        taskInput.focus();
    }

    // Toggle completion status
    function toggleTaskStatus(id) {
        tasks = tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
    }

    // Delete a specific task
    function deleteTask(id, liElement) {
        // Trigger fade out animation before removing
        liElement.style.animation = 'fadeOut 0.3s ease forwards';
        
        setTimeout(() => {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
        }, 300); // Matches CSS animation duration
    }

    // Clear all tasks
    function handleClearAll() {
        if (tasks.length === 0) return;
        
        if (confirm('Are you sure you want to clear all tasks?')) {
            tasks = [];
            saveTasks();
            renderTasks();
        }
    }

    // Save tasks to Local Storage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateTaskCount();
    }

    // Update the task counter at the bottom
    function updateTaskCount() {
        const count = tasks.length;
        taskCount.textContent = `${count} ${count === 1 ? 'task' : 'tasks'}`;
        clearBtn.style.display = count > 0 ? 'block' : 'none';
    }

    // Render the task list to the DOM
    function renderTasks() {
        taskList.innerHTML = '';

        if (tasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <i class="fa-regular fa-clipboard"></i>
                    <p>No tasks yet. Add one above!</p>
                </div>
            `;
            updateTaskCount();
            return;
        }

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            // Determine icon based on status
            const iconClass = task.completed ? 'fa-solid fa-circle-check check-icon' : 'fa-regular fa-circle check-icon';
            
            li.innerHTML = `
                <div class="task-content">
                    <i class="${iconClass}"></i>
                    <span class="task-text">${escapeHTML(task.text)}</span>
                </div>
                <button class="delete-btn" aria-label="Delete task">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;

            // Event delegation for item interactions
            const taskContent = li.querySelector('.task-content');
            taskContent.addEventListener('click', () => toggleTaskStatus(task.id));

            const delBtn = li.querySelector('.delete-btn');
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering toggle
                deleteTask(task.id, li);
            });

            taskList.appendChild(li);
        });

        updateTaskCount();
    }

    // Helper to prevent XSS (Cross-Site Scripting)
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});