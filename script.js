document.addEventListener("DOMContentLoaded", () => {
    const CORRECT_PASSWORD = "demo";

    const loginScreen = document.getElementById("login-screen");
    const loginForm = document.getElementById("login-form");
    const passwordInput = document.getElementById("password-input");
    const loginError = document.getElementById("login-error");
    const currentTimeEl = document.getElementById("current-time");
    const lockBtn = document.getElementById("lock-btn");
    const appleMenuBtn = document.getElementById("appleMenuBtn");
    const startMenu = document.getElementById("startMenu");
    const controlCenterBtn = document.getElementById("controlCenterBtn");
    const controlCenter = document.getElementById("controlCenter");
    const contextMenu = document.getElementById("contextMenu");
    const desktopArea = document.getElementById("desktopArea");

    // --- 1. AUTHENTICATION & LOGIN ---
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (passwordInput.value === CORRECT_PASSWORD) {
            loginScreen.classList.remove("active");
            passwordInput.value = "";
            loginError.style.display = "none";
            openWindow("welcome-win");
        } else {
            loginError.style.display = "block";
            passwordInput.value = "";
        }
    });

    window.lockSystem = function() {
        loginScreen.classList.add("active");
        startMenu.classList.add("hidden");
        controlCenter.classList.add("hidden");
    };

    lockBtn.addEventListener("click", lockSystem);

    appleMenuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        startMenu.classList.toggle("hidden");
        controlCenter.classList.add("hidden");
    });

    controlCenterBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        controlCenter.classList.toggle("hidden");
        startMenu.classList.add("hidden");
    });

    document.addEventListener("click", (e) => {
        if (!startMenu.contains(e.target) && e.target !== appleMenuBtn) {
            startMenu.classList.add("hidden");
        }
        if (!controlCenter.contains(e.target) && e.target !== controlCenterBtn) {
            controlCenter.classList.add("hidden");
        }
        hideContextMenu();
    });

    window.toggleStartMenu = function() {
        startMenu.classList.toggle("hidden");
    };

    window.toggleCcTile = function(id) {
        document.getElementById(id).classList.toggle("active");
    };

    window.adjustBrightness = function(val) {
        document.body.style.filter = `brightness(${val / 100})`;
    };

    desktopArea.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        contextMenu.style.left = e.clientX + "px";
        contextMenu.style.top = e.clientY + "px";
        contextMenu.classList.remove("hidden");
    });

    function hideContextMenu() {
        contextMenu.classList.add("hidden");
    }

    // --- 2. WINDOW MANAGEMENT ---
    let highestZIndex = 100;

    window.bringToFront = function(windowId) {
        const win = document.getElementById(windowId);
        if (win) {
            highestZIndex++;
            win.style.zIndex = highestZIndex;
            document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
            win.classList.add('focused');
        }
    };

    window.openWindow = function(id) {
        const win = document.getElementById(id);
        if (win) {
            win.classList.add("active");
            bringToFront(id);
            const dot = document.getElementById(`dot-${id}`);
            if (dot) dot.classList.add('active');
        }
    };

    window.closeWindow = function(id) {
        const win = document.getElementById(id);
        if (win) {
            win.classList.remove("active");
            const dot = document.getElementById(`dot-${id}`);
            if (dot) dot.classList.remove('active');
        }
    };

    window.minimizeWindow = function(id) { closeWindow(id); };

    window.maximizeWindow = function(id) {
        const win = document.getElementById(id);
        if (!win) return;
        if (win.dataset.maximized === "true") {
            win.style.top = win.dataset.prevTop;
            win.style.left = win.dataset.prevLeft;
            win.style.width = win.dataset.prevWidth;
            win.style.height = win.dataset.prevHeight;
            win.dataset.maximized = "false";
        } else {
            win.dataset.prevTop = win.style.top;
            win.dataset.prevLeft = win.style.left;
            win.dataset.prevWidth = win.style.width;
            win.dataset.prevHeight = win.style.height;
            
            win.style.top = "32px";
            win.style.left = "0px";
            win.style.width = "100vw";
            win.style.height = "calc(100vh - 32px)";
            win.dataset.maximized = "true";
        }
    };

    let activeDragWindow = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    window.startDrag = function(e, windowId) {
        if (e.target.closest('.window-controls')) return;
        activeDragWindow = document.getElementById(windowId);
        bringToFront(windowId);
        
        const rect = activeDragWindow.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    function onMouseMove(e) {
        if (!activeDragWindow) return;
        let newX = e.clientX - dragOffsetX;
        let newY = e.clientY - dragOffsetY;
        if (newY < 32) newY = 32;
        activeDragWindow.style.left = newX + "px";
        activeDragWindow.style.top = newY + "px";
    }

    function onMouseUp() {
        activeDragWindow = null;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    }

    window.selectIcon = function(element) {
        document.querySelectorAll('.desktop-icon').forEach(icon => icon.style.background = 'transparent');
        element.style.background = 'rgba(255, 255, 255, 0.15)';
    };

    // --- 3. FILE EXPLORER MOCK SYSTEM ---
    const fileSystem = {
        home: [
            { name: "Welcome.md", type: "file", icon: "fa-file-lines" },
            { name: "Projects", type: "folder", icon: "fa-folder" },
            { name: "Resumes", type: "folder", icon: "fa-folder" }
        ],
        documents: [
            { name: "Note_Draft.txt", type: "file", icon: "fa-file-lines" },
            { name: "Budget_2026.xlsx", type: "file", icon: "fa-file-excel" }
        ],
        pictures: [
            { name: "Wallpaper_Neon.png", type: "file", icon: "fa-image" },
            { name: "Avatar.jpg", type: "file", icon: "fa-image" }
        ],
        system: [
            { name: "kernel.sys", type: "file", icon: "fa-gear" },
            { name: "drivers", type: "folder", icon: "fa-folder" }
        ]
    };

    window.switchFolder = function(folderKey, el) {
        document.querySelectorAll('.exp-nav-item').forEach(e => e.classList.remove('active'));
        if (el) el.classList.add('active');
        renderFiles(fileSystem[folderKey] || []);
    };

    function renderFiles(files) {
        const container = document.getElementById("explorerContentArea");
        if (!container) return;
        container.innerHTML = "";
        files.forEach(file => {
            const div = document.createElement("div");
            div.className = "exp-file-item";
            div.innerHTML = `
                <i class="fa-solid ${file.icon}"></i>
                <span>${file.name}</span>
            `;
            div.ondblclick = () => {
                if (file.type === 'file' && file.name.endsWith('.md')) openWindow('notes-win');
                else alert(`Opened ${file.name}`);
            };
            container.appendChild(div);
        });
    }
    switchFolder('home', document.querySelector('.exp-nav-item'));

    // --- 4. NOTEPAD PERSISTENCE ---
    const notepadArea = document.getElementById("notepadArea");
    const notepadStatus = document.getElementById("notepadStatus");

    if (notepadArea) {
        notepadArea.value = localStorage.getItem("auraos_notes") || "# AuraOS Quick Notes\n\n- Jot down ideas here.\n- Changes auto-save to local storage instantly.";

        notepadArea.addEventListener("input", () => {
            localStorage.setItem("auraos_notes", notepadArea.value);
            notepadStatus.textContent = "Saving...";
            setTimeout(() => { notepadStatus.textContent = "Saved to LocalStorage"; }, 600);
        });
    }

    window.clearNotepad = function() {
        if (confirm("Clear all notes?")) {
            notepadArea.value = "";
            localStorage.removeItem("auraos_notes");
            notepadStatus.textContent = "Cleared";
        }
    };

    window.saveNotepad = function() {
        localStorage.setItem("auraos_notes", notepadArea.value);
        notepadStatus.textContent = "Manually Saved!";
    };

    // --- 5. TERMINAL SHELL SIMULATOR ---
    const terminalOutput = document.getElementById("terminalOutput");
    const terminalInput = document.getElementById("terminalInput");
    const terminalBody = document.getElementById("terminalBody");

    window.focusTerminalInput = function() { if (terminalInput) terminalInput.focus(); };

    window.handleTerminalKey = function(e) {
        if (e.key === "Enter") {
            const cmd = terminalInput.value.trim();
            appendTerminalLine(`alex@auraos:~$ ${cmd}`);
            processCommand(cmd);
            terminalInput.value = "";
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }
    };

    function appendTerminalLine(text) {
        const p = document.createElement("p");
        p.textContent = text;
        terminalOutput.appendChild(p);
    }

    function processCommand(cmd) {
        const parts = cmd.split(" ");
        const action = parts[0].toLowerCase();
        
        switch (action) {
            case "help":
                appendTerminalLine("Available commands: help, clear, ls, date, whoami, neofetch, echo [text]");
                break;
            case "clear":
                terminalOutput.innerHTML = "";
                break;
            case "ls":
                appendTerminalLine("home/  documents/  pictures/  system/");
                break;
            case "date":
                appendTerminalLine(new Date().toString());
                break;
            case "whoami":
                appendTerminalLine("alex (System Administrator)");
                break;
            case "neofetch":
                appendTerminalLine("       /\\        alex@auraos");
                appendTerminalLine("      /  \\       -----------");
                appendTerminalLine("     / /\\ \\      OS: AuraOS 2.0 Web Edition");
                appendTerminalLine("    / ____ \\     Kernel: 6.5.0-webos");
                appendTerminalLine("   /_/    \\_\\    Shell: bash 5.2.15");
                break;
            case "echo":
                appendTerminalLine(parts.slice(1).join(" "));
                break;
            case "":
                break;
            default:
                appendTerminalLine(`Command not found: ${action}. Type 'help' for available commands.`);
        }
    }

    // --- 6. CALCULATOR ENGINE ---
    const calcDisplay = document.getElementById("calcDisplay");
    let calcExpression = "";

    window.calcAppend = function(val) {
        if (calcExpression === "0" && val !== ".") calcExpression = "";
        calcExpression += val;
        calcDisplay.textContent = calcExpression;
    };

    window.calcClear = function() {
        calcExpression = "0";
        calcDisplay.textContent = calcExpression;
    };

    window.calcCalculate = function() {
        try {
            let res = eval(calcExpression.replace('×', '*').replace('÷', '/'));
            calcDisplay.textContent = res;
            calcExpression = res.toString();
        } catch {
            calcDisplay.textContent = "Error";
            calcExpression = "0";
        }
    };

    // --- 7. TASK MANAGER ---
    const processListBody = document.getElementById("processListBody");
    const cpuBar = document.getElementById("cpuBar");
    const ramBar = document.getElementById("ramBar");
    const cpuLoadText = document.getElementById("cpuLoadText");
    const memLoadText = document.getElementById("memLoadText");

    let activeProcesses = [
        { id: 1, name: "AuraOS Kernel", status: "Running", cpu: "2%", memory: "140 MB" },
        { id: 2, name: "Window Compositor", status: "Running", cpu: "4%", memory: "95 MB" },
        { id: 3, name: "File Explorer", status: "Running", cpu: "0.8%", memory: "65 MB" },
        { id: 4, name: "Terminal Shell", status: "Running", cpu: "0.2%", memory: "40 MB" },
        { id: 5, name: "Notepad Daemon", status: "Running", cpu: "0.1%", memory: "30 MB" }
    ];

    function renderProcesses() {
        if (!processListBody) return;
        processListBody.innerHTML = "";
        activeProcesses.forEach(proc => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${proc.name}</strong></td>
                <td><span style="color: ${proc.status === 'Running' ? '#27c93f' : '#888'}">${proc.status}</span></td>
                <td>${proc.cpu}</td>
                <td>${proc.memory}</td>
                <td><button class="end-task-btn" onclick="killProcess(${proc.id})">End Task</button></td>
            `;
            processListBody.appendChild(tr);
        });
    }

    window.killProcess = function(id) {
        activeProcesses = activeProcesses.filter(p => p.id !== id);
        renderProcesses();
    };

    setInterval(() => {
        const randomCpu = Math.floor(Math.random() * 20) + 10;
        const randomRam = Math.floor(Math.random() * 4) + 33;
        if (cpuBar) cpuBar.style.width = randomCpu + "%";
        if (ramBar) ramBar.style.width = randomRam + "%";
        if (cpuLoadText) cpuLoadText.textContent = randomCpu + "%";
        if (memLoadText) memLoadText.textContent = (randomRam * 0.45).toFixed(1) + " GB / 16 GB";
    }, 2000);

    renderProcesses();

    // --- 8. RETRO SNAKE ARCADE GAME ENGINE ---
    const canvas = document.getElementById("snakeCanvas");
    if (canvas) {
        const ctx = canvas.getContext("2d");
        const snakeScoreEl = document.getElementById("snakeScore");
        const snakeHighScoreEl = document.getElementById("snakeHighScore");
        const snakeOverlay = document.getElementById("snakeOverlay");

        let snake = [{x: 10, y: 10}];
        let food = {x: 5, y: 5};
        let dx = 1;
        let dy = 0;
        let score = 0;
        let highScore = localStorage.getItem("snake_highscore") || 0;
        let gameInterval = null;
        let gameRunning = false;

        snakeHighScoreEl.textContent = highScore;

        window.startSnakeGame = function() {
            snake = [{x: 10, y: 10}];
            dx = 1;
            dy = 0;
            score = 0;
            snakeScoreEl.textContent = score;
            spawnFood();
            snakeOverlay.classList.add("hidden");
            
            if (gameInterval) clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, 100);
            gameRunning = true;
        };

        function gameLoop() {
            updateSnake();
            if (checkGameOver()) {
                clearInterval(gameInterval);
                gameRunning = false;
                snakeOverlay.classList.remove("hidden");
                snakeOverlay.querySelector("h3").textContent = "Game Over!";
                snakeOverlay.querySelector("p").textContent = `Final Score: ${score}. Click Start to try again.`;
                return;
            }
            drawGame();
        }

        function updateSnake() {
            const head = {x: snake[0].x + dx, y: snake[0].y + dy};
            snake.unshift(head);
            
            if (head.x === food.x && head.y === food.y) {
                score += 10;
                snakeScoreEl.textContent = score;
                if (score > highScore) {
                    highScore = score;
                    snakeHighScoreEl.textContent = highScore;
                    localStorage.setItem("snake_highscore", highScore);
                }
                spawnFood();
            } else {
                snake.pop();
            }
        }

        function spawnFood() {
            food.x = Math.floor(Math.random() * (canvas.width / 20));
            food.y = Math.floor(Math.random() * (canvas.height / 20));
        }

        function checkGameOver() {
            const head = snake[0];
            const hitWall = head.x < 0 || head.x >= canvas.width / 20 || head.y < 0 || head.y >= canvas.height / 20;
            const hitSelf = snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
            return hitWall || hitSelf;
        }

        function drawGame() {
            ctx.fillStyle = "#111";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = "#ff3b30";
            ctx.fillRect(food.x * 20, food.y * 20, 18, 18);
            
            snake.forEach((segment, index) => {
                ctx.fillStyle = index === 0 ? "#c084fc" : "#a855f7";
                ctx.fillRect(segment.x * 20, segment.y * 20, 18, 18);
            });
        }

        document.addEventListener("keydown", (e) => {
            if (!gameRunning) return;
            if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -1; }
            if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 1; }
            if (e.key === "ArrowLeft" && dx === 0) { dx = -1; dy = 0; }
            if (e.key === "ArrowRight" && dx === 0) { dx = 1; dy = 0; }
        });
    }

    // --- 9. SETTINGS & WALLPAPERS ---
    window.setWallpaper = function(themeClass) {
        document.body.className = themeClass;
        localStorage.setItem("auraos_wallpaper", themeClass);
    };

    const savedWp = localStorage.getItem("auraos_wallpaper");
    if (savedWp) { document.body.className = savedWp; }

    // --- 10. LIVE STATUS BAR CLOCK ---
    function updateClock() {
        const now = new Date();
        currentTimeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    setInterval(updateClock, 1000);
    updateClock();
});