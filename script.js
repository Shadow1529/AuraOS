document.addEventListener("DOMContentLoaded", () => {
    const CORRECT_PASSWORD = "demo";

    const loginScreen = document.getElementById("login-screen");
    const loginForm = document.getElementById("login-form");
    const passwordInput = document.getElementById("password-input");
    const loginError = document.getElementById("login-error");
    const currentTimeEl = document.getElementById("current-time");
    const appleMenuBtn = document.getElementById("appleMenuBtn");
    const startMenu = document.getElementById("startMenu");
    const controlCenterBtn = document.getElementById("controlCenterBtn");
    const controlCenter = document.getElementById("controlCenter");
    const contextMenu = document.getElementById("contextMenu");
    const desktopArea = document.getElementById("desktopArea");
    const snapPreview = document.getElementById("snapPreview");

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

    document.getElementById("lock-btn").addEventListener("click", lockSystem);
    document.getElementById("dockLockBtn").addEventListener("click", lockSystem);
    document.getElementById("startMenuPowerBtn").addEventListener("click", lockSystem);

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
        if (!startMenu.contains(e.target) && e.target !== appleMenuBtn) startMenu.classList.add("hidden");
        if (!controlCenter.contains(e.target) && e.target !== controlCenterBtn) controlCenter.classList.add("hidden");
        hideContextMenu();
    });

    document.querySelectorAll(".cc-tile").forEach(tile => {
        tile.addEventListener("pointerdown", (e) => {
            e.stopPropagation();
            tile.classList.toggle("active");
        });
    });

    const brightnessSlider = document.getElementById("brightnessSlider");
    if (brightnessSlider) {
        brightnessSlider.addEventListener("input", (e) => {
            document.body.style.filter = `brightness(${e.target.value / 100})`;
        });
    }

    desktopArea.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        contextMenu.style.left = e.clientX + "px";
        contextMenu.style.top = e.clientY + "px";
        contextMenu.classList.remove("hidden");
    });

    function hideContextMenu() {
        contextMenu.classList.add("hidden");
    }

    document.getElementById("ctxRefresh").addEventListener("click", () => location.reload());

    // --- 2. UNIFIED POINTER EVENTS FOR TOUCH-RESPONSIVE APP LAUNCHING ---
    function bindAppOpener(selector, appIdGetter) {
        document.querySelectorAll(selector).forEach(el => {
            el.addEventListener("pointerdown", (e) => {
                e.preventDefault();
                const appId = typeof appIdGetter === 'function' ? appIdGetter(el) : el.getAttribute(appIdGetter);
                if (appId) openWindow(appId);
                startMenu.classList.add("hidden");
            });
        });
    }

    bindAppOpener(".desktop-icon", el => el.getAttribute("data-app"));
    bindAppOpener(".start-app-tile", el => el.getAttribute("data-app"));
    bindAppOpener(".dock-item[data-app]", el => el.getAttribute("data-app"));
    bindAppOpener(".menu-item[data-action]", el => el.getAttribute("data-action"));
    bindAppOpener(".ctx-item[data-ctx]", el => el.getAttribute("data-ctx"));

    // --- 3. ADVANCED WINDOW MANAGEMENT, SNAPPING & TOUCH DRAGGING ---
    let highestZIndex = 100;
    let activeDragWindow = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let currentSnapState = null; // 'left', 'right', or null

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
            win.classList.remove("minimized");
            win.classList.add("active");
            bringToFront(id);
            const dot = document.getElementById(`dot-${id}`);
            if (dot) dot.classList.add('active');
        }
    };

    window.closeWindow = function(id) {
        const win = document.getElementById(id);
        if (win) {
            win.classList.remove("active", "minimized");
            const dot = document.getElementById(`dot-${id}`);
            if (dot) dot.classList.remove('active');
        }
    };

    window.minimizeWindow = function(id) {
        const win = document.getElementById(id);
        if (win) {
            win.classList.add("minimized");
            setTimeout(() => {
                win.classList.remove("active");
            }, 250);
        }
    };

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
            
            win.style.top = "36px";
            win.style.left = "0px";
            win.style.width = "100vw";
            win.style.height = "calc(100dvh - 36px)";
            win.dataset.maximized = "true";
        }
    };

    // Header buttons event bindings
    document.querySelectorAll(".window-controls span").forEach(btn => {
        btn.addEventListener("pointerdown", (e) => {
            e.stopPropagation();
            const action = btn.getAttribute("data-win-action");
            const id = btn.getAttribute("data-id");
            if (action === "close") closeWindow(id);
            if (action === "minimize") minimizeWindow(id);
            if (action === "maximize") maximizeWindow(id);
        });
    });

    // Window Dragging & Edge Snapping
    document.querySelectorAll(".window-header").forEach(header => {
        header.addEventListener("pointerdown", (e) => {
            if (e.target.closest('.window-controls')) return;
            const windowId = header.getAttribute("data-window-id");
            activeDragWindow = document.getElementById(windowId);
            bringToFront(windowId);

            const rect = activeDragWindow.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;

            activeDragWindow.style.transition = "none";
            document.addEventListener("pointermove", onPointerMove);
            document.addEventListener("pointerup", onPointerUp);
        });
    });

    function onPointerMove(e) {
        if (!activeDragWindow) return;
        let newX = e.clientX - dragOffsetX;
        let newY = e.clientY - dragOffsetY;
        if (newY < 36) newY = 36;

        activeDragWindow.style.left = newX + "px";
        activeDragWindow.style.top = newY + "px";

        // Snap Assist Visual Feedback
        if (e.clientX <= 15) {
            currentSnapState = 'left';
            snapPreview.style.left = "0px";
            snapPreview.style.width = "50vw";
            snapPreview.classList.remove("hidden");
        } else if (e.clientX >= window.innerWidth - 15) {
            currentSnapState = 'right';
            snapPreview.style.left = "50vw";
            snapPreview.style.width = "50vw";
            snapPreview.classList.remove("hidden");
        } else {
            currentSnapState = null;
            snapPreview.classList.add("hidden");
        }
    }

    function onPointerUp(e) {
        if (!activeDragWindow) return;
        activeDragWindow.style.transition = "";
        snapPreview.classList.add("hidden");

        if (currentSnapState === 'left') {
            activeDragWindow.style.top = "36px";
            activeDragWindow.style.left = "0px";
            activeDragWindow.style.width = "50vw";
            activeDragWindow.style.height = "calc(100dvh - 36px)";
        } else if (currentSnapState === 'right') {
            activeDragWindow.style.top = "36px";
            activeDragWindow.style.left = "50vw";
            activeDragWindow.style.width = "50vw";
            activeDragWindow.style.height = "calc(100dvh - 36px)";
        }

        currentSnapState = null;
        activeDragWindow = null;
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
    }

    // --- 4. FILE EXPLORER MOCK SYSTEM ---
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

    document.querySelectorAll(".exp-nav-item").forEach(item => {
        item.addEventListener("pointerdown", () => {
            document.querySelectorAll('.exp-nav-item').forEach(e => e.classList.remove('active'));
            item.classList.add('active');
            renderFiles(fileSystem[item.getAttribute("data-folder")] || []);
        });
    });

    function renderFiles(files) {
        const container = document.getElementById("explorerContentArea");
        if (!container) return;
        container.innerHTML = "";
        files.forEach(file => {
            const div = document.createElement("div");
            div.className = "exp-file-item";
            div.innerHTML = `<i class="fa-solid ${file.icon}"></i><span>${file.name}</span>`;
            div.addEventListener("dblclick", () => {
                if (file.name.endsWith('.md')) openWindow('notes-win');
                else alert(`Opened ${file.name}`);
            });
            container.appendChild(div);
        });
    }
    renderFiles(fileSystem.home);

    // --- 5. NOTEPAD PERSISTENCE ---
    const notepadArea = document.getElementById("notepadArea");
    const notepadStatus = document.getElementById("notepadStatus");

    if (notepadArea) {
        notepadArea.value = localStorage.getItem("auraos_notes") || "# AuraOS Quick Notes\n\n- Jot down ideas here.\n- Auto-saves to LocalStorage instantly.";
        notepadArea.addEventListener("input", () => {
            localStorage.setItem("auraos_notes", notepadArea.value);
            notepadStatus.textContent = "Saving...";
            setTimeout(() => { notepadStatus.textContent = "Saved to LocalStorage"; }, 500);
        });
    }

    document.getElementById("notepadNewBtn").addEventListener("pointerdown", () => {
        if (confirm("Clear all notes?")) {
            notepadArea.value = "";
            localStorage.removeItem("auraos_notes");
            notepadStatus.textContent = "Cleared";
        }
    });

    document.getElementById("notepadSaveBtn").addEventListener("pointerdown", () => {
        localStorage.setItem("auraos_notes", notepadArea.value);
        notepadStatus.textContent = "Manually Saved!";
    });

    // --- 6. TERMINAL SHELL SIMULATOR ---
    const terminalOutput = document.getElementById("terminalOutput");
    const terminalInput = document.getElementById("terminalInput");
    const terminalBody = document.getElementById("terminalBody");

    terminalBody.addEventListener("pointerdown", () => terminalInput.focus());

    terminalInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const cmd = terminalInput.value.trim();
            appendTerminalLine(`user@auraos:~$ ${cmd}`);
            processCommand(cmd);
            terminalInput.value = "";
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }
    });

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
                appendTerminalLine("Commands: help, clear, ls, date, whoami, neofetch, echo [text]");
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
                appendTerminalLine("user (System Administrator)");
                break;
            case "neofetch":
                appendTerminalLine("       /\\        user@auraos");
                appendTerminalLine("      /  \\       -----------");
                appendTerminalLine("     / /\\ \\      OS: AuraOS 2.5 Web Edition");
                appendTerminalLine("    / ____ \\     Kernel: 6.5.0-webos");
                appendTerminalLine("   /_/    \\_\\    Shell: bash 5.2.15");
                break;
            case "echo":
                appendTerminalLine(parts.slice(1).join(" "));
                break;
            case "":
                break;
            default:
                appendTerminalLine(`Command not found: ${action}. Type 'help'.`);
        }
    }

    // --- 7. CALCULATOR ENGINE ---
    const calcDisplay = document.getElementById("calcDisplay");
    let calcExpression = "";

    document.querySelectorAll(".calc-btn").forEach(btn => {
        btn.addEventListener("pointerdown", () => {
            const val = btn.getAttribute("data-calc");
            if (val === "C") {
                calcExpression = "0";
            } else if (val === "=") {
                try {
                    calcExpression = eval(calcExpression.replace('×', '*').replace('÷', '/')).toString();
                } catch {
                    calcExpression = "Error";
                }
            } else {
                if (calcExpression === "0" && val !== ".") calcExpression = "";
                calcExpression += val;
            }
            calcDisplay.textContent = calcExpression;
            if (calcExpression === "Error") calcExpression = "0";
        });
    });

    // --- 8. MEDIA PLAYER APP ---
    const mediaPlayBtn = document.getElementById("mediaPlayBtn");
    const playIcon = document.getElementById("playIcon");
    let isPlaying = false;

    mediaPlayBtn.addEventListener("pointerdown", () => {
        isPlaying = !isPlaying;
        if (isPlaying) {
            playIcon.className = "fa-solid fa-pause";
        } else {
            playIcon.className = "fa-solid fa-play";
        }
    });

    // --- 9. TASK MANAGER PROCESS OVERHAUL ---
    const processListBody = document.getElementById("processListBody");
    const cpuBar = document.getElementById("cpuBar");
    const ramBar = document.getElementById("ramBar");
    const cpuLoadText = document.getElementById("cpuLoadText");
    const memLoadText = document.getElementById("memLoadText");

    let activeProcesses = [
        { pid: 101, name: "welcome-win", title: "Welcome App", status: "Running", cpu: "2%", memory: "140 MB" },
        { pid: 102, name: "explorer-win", title: "File Explorer", status: "Running", cpu: "1.2%", memory: "95 MB" },
        { pid: 103, name: "notes-win", title: "Notepad", status: "Running", cpu: "0.5%", memory: "65 MB" },
        { pid: 104, name: "terminal-win", title: "Terminal Shell", status: "Running", cpu: "0.3%", memory: "40 MB" },
        { pid: 105, name: "taskmgr-win", title: "Task Manager", status: "Running", cpu: "3.5%", memory: "85 MB" }
    ];

    function renderProcesses() {
        if (!processListBody) return;
        processListBody.innerHTML = "";
        activeProcesses.forEach(proc => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><code>${proc.pid}</code></td>
                <td><strong>${proc.title}</strong></td>
                <td><span style="color: #27c93f">${proc.status}</span></td>
                <td>${proc.cpu}</td>
                <td>${proc.memory}</td>
                <td><button class="end-task-btn" data-pid="${proc.pid}" data-name="${proc.name}">End Process</button></td>
            `;
            processListBody.appendChild(tr);
        });

        document.querySelectorAll(".end-task-btn").forEach(btn => {
            btn.addEventListener("pointerdown", (e) => {
                e.stopPropagation();
                const pid = parseInt(btn.getAttribute("data-pid"));
                const windowName = btn.getAttribute("data-name");
                killProcess(pid, windowName);
            });
        });
    }

    window.killProcess = function(pid, windowName) {
        activeProcesses = activeProcesses.filter(p => p.pid !== pid);
        closeWindow(windowName);
        renderProcesses();
    };

    setInterval(() => {
        const randomCpu = Math.floor(Math.random() * 20) + 10;
        const randomRam = Math.floor(Math.random() * 4) + 32;
        if (cpuBar) cpuBar.style.width = randomCpu + "%";
        if (ramBar) ramBar.style.width = randomRam + "%";
        if (cpuLoadText) cpuLoadText.textContent = randomCpu + "%";
        if (memLoadText) memLoadText.textContent = (randomRam * 0.45).toFixed(1) + " GB / 16 GB";
    }, 2000);

    renderProcesses();

    // --- 10. RETRO SNAKE ARCADE GAME ENGINE ---
    const canvas = document.getElementById("snakeCanvas");
    if (canvas) {
        const ctx = canvas.getContext("2d");
        const snakeScoreEl = document.getElementById("snakeScore");
        const snakeHighScoreEl = document.getElementById("snakeHighScore");
        const snakeOverlay = document.getElementById("snakeOverlay");
        const snakeStartBtn = document.getElementById("snakeStartBtn");

        let snake = [{x: 10, y: 10}];
        let food = {x: 5, y: 5};
        let dx = 1;
        let dy = 0;
        let score = 0;
        let highScore = localStorage.getItem("snake_highscore") || 0;
        let gameInterval = null;
        let gameRunning = false;

        snakeHighScoreEl.textContent = highScore;

        snakeStartBtn.addEventListener("pointerdown", startSnakeGame);

        function startSnakeGame() {
            snake = [{x: 10, y: 10}];
            dx = 1;
            dy = 0;
            score = 0;
            snakeScoreEl.textContent = score;
            spawnFood();
            snakeOverlay.classList.add("hidden");
            
            if (gameInterval) clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, 110);
            gameRunning = true;
        }

        function gameLoop() {
            updateSnake();
            if (checkGameOver()) {
                clearInterval(gameInterval);
                gameRunning = false;
                snakeOverlay.classList.remove("hidden");
                snakeOverlay.querySelector("h3").textContent = "Game Over!";
                snakeOverlay.querySelector("p").textContent = `Final Score: ${score}. Click Start to play again.`;
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

    // --- 11. SETTINGS & WALLPAPERS ---
    document.querySelectorAll(".wp-btn").forEach(btn => {
        btn.addEventListener("pointerdown", () => {
            const themeClass = btn.getAttribute("data-wp");
            document.body.className = themeClass;
            localStorage.setItem("auraos_wallpaper", themeClass);
        });
    });

    const savedWp = localStorage.getItem("auraos_wallpaper");
    if (savedWp) { document.body.className = savedWp; }

    // --- 12. LIVE CLOCK ---
    function updateClock() {
        const now = new Date();
        currentTimeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    setInterval(updateClock, 1000);
    updateClock();
});