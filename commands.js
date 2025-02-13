// File System Simulation
const fileSystem = {
    "/": {
        type: "directory",
        children: {
            "readme.txt": {
                type: "file",
                content:
                    "Welcome to your simulated terminal!\nFeel free to explore the commands.",
            },
            "todo.txt": {
                type: "file",
                content:
                    "1. Wake up\n2. Eat\n3. Sleep\n4. Repeat",
            },
            "docs": {
                type: "directory",
                children: {
                    "manual.txt": {
                        type: "file",
                        content: "This is the manual for the simulated terminal.",
                    },
                },
            },
        },
    },
};

// Keep track of the current working directory.
let currentPath = "/";

// Helper to get any entry (file or directory) by its path.
function getEntryFromPath(path) {
    if (path === "/") return fileSystem["/"];
    const parts = path.split("/").filter(Boolean);
    let current = fileSystem["/"];
    for (let part of parts) {
        if (!current.children || !current.children[part]) {
            return null;
        }
        current = current.children[part];
    }
    return current;
}

// Helper to ensure the entry is a directory.
function getDirFromPath(path) {
    const entry = getEntryFromPath(path);
    return entry && entry.type === "directory" ? entry : null;
}

// -------------------------
// Terminal Commands
// -------------------------

export const commands = {
    help: {
        description: "Show all commands and their descriptions",
        handler: (context) => {
            context.addLine("Available commands:");
            const sortedCommands = Object.keys(context.commands)
                .filter((cmd) => !context.commands[cmd].hidden)
                .sort();
            sortedCommands.forEach((cmd) => {
                context.addLine(`${cmd} - ${context.commands[cmd].description}`);
            });
            context.createNewLine();
        },
    },
    about: {
        description: "Learn about this simulated terminal",
        response:
            "This is a simulated terminal built with HTML, CSS, and JavaScript. Created by github.com/kevintr303",
    },
    clear: {
        description: "Clear the terminal screen",
        handler: (context) => {
            context.terminal.innerHTML = "";
            context.createNewLine();
        },
    },
    whoami: {
        description: "Display your IP address & User-Agent",
        handler: (context) => {
            const info = `Your IP: ${context.userIP}\nUser-Agent: ${navigator.userAgent}`;
            info.split("\n").forEach((line) => context.addLine(line));
            context.createNewLine();
        },
    },
    datetime: {
        description: "Show the current date and time",
        handler: (context) => {
            const dt = new Date().toString();
            context.addLine(dt);
            context.createNewLine();
        },
    },
    joke: {
        description: "Get a random programming joke",
        handler: async (context) => {
            try {
                const response = await fetch(
                    "https://v2.jokeapi.dev/joke/Programming?type=single"
                );
                const data = await response.json();
                if (data && data.joke) {
                    context.addLine(data.joke);
                } else {
                    context.addLine("Couldn't fetch a joke. Try again later.");
                }
            } catch (error) {
                context.addLine("Error fetching joke.");
            }
            context.createNewLine();
        },
    },
    secretcmd: {
        description: "This is a hidden command!",
        response: "You found the secret command!",
        hidden: true,
    },
    // -------------------------
    // File System Commands
    // -------------------------
    ls: {
        description: "List files in the current directory",
        handler: (context) => {
            const dir = getDirFromPath(currentPath);
            if (dir && dir.children) {
                Object.keys(dir.children).forEach((name) => {
                    const entry = dir.children[name];
                    context.addLine(entry.type === "directory" ? name + "/" : name);
                });
            } else {
                context.addLine("Directory not found.");
            }
            context.createNewLine();
        },
    },
    cat: {
        description: "Display file contents. Usage: cat <filename>",
        handler: (context, args) => {
            const filename = args[0];
            if (!filename) {
                context.addLine("Usage: cat <filename>");
            } else {
                // Resolve path: absolute if starting with '/', or relative to currentPath.
                let filePath =
                    filename.startsWith("/")
                        ? filename
                        : currentPath === "/"
                            ? "/" + filename
                            : currentPath + "/" + filename;
                const entry = getEntryFromPath(filePath);
                if (entry && entry.type === "file") {
                    context.addLine(entry.content);
                } else if (entry && entry.type === "directory") {
                    context.addLine(`cat: ${filename}: Is a directory`);
                } else {
                    context.addLine(`cat: ${filename}: No such file.`);
                }
            }
            context.createNewLine();
        },
    },
    touch: {
        description: "Create a new file. Usage: touch <filename> [content]",
        handler: (context, args) => {
            const filename = args[0];
            if (!filename) {
                context.addLine("Usage: touch <filename> [content]");
            } else {
                const dir = getDirFromPath(currentPath);
                if (!dir) {
                    context.addLine("Current directory not found.");
                } else {
                    dir.children = dir.children || {};
                    dir.children[filename] = {
                        type: "file",
                        content: args.slice(1).join(" ") || "",
                    };
                    context.addLine(`Created file ${filename} in ${currentPath}`);
                }
            }
            context.createNewLine();
        },
    },
    rm: {
        description: "Remove a file. Usage: rm <filename>",
        handler: (context, args) => {
            const filename = args[0];
            if (!filename) {
                context.addLine("Usage: rm <filename>");
            } else {
                const dir = getDirFromPath(currentPath);
                if (!dir || !dir.children || !dir.children[filename]) {
                    context.addLine(`rm: cannot remove '${filename}': No such file.`);
                } else {
                    delete dir.children[filename];
                    context.addLine(`Removed ${filename} from ${currentPath}`);
                }
            }
            context.createNewLine();
        },
    },
    cd: {
        description: "Change directory. Usage: cd <directory>",
        handler: (context, args) => {
            const target = args[0];
            if (!target) {
                context.addLine("Usage: cd <directory>");
                context.createNewLine();
                return;
            }
            let newPath;
            if (target === "/") {
                newPath = "/";
            } else if (target === "..") {
                if (currentPath === "/") {
                    newPath = "/";
                } else {
                    const parts = currentPath.split("/").filter(Boolean);
                    parts.pop();
                    newPath = "/" + parts.join("/");
                    if (newPath === "") newPath = "/";
                }
            } else {
                // Support both relative and absolute paths.
                newPath =
                    target.startsWith("/")
                        ? target
                        : currentPath === "/"
                            ? "/" + target
                            : currentPath + "/" + target;
            }
            // Remove trailing slash unless it's root.
            if (newPath.length > 1 && newPath.endsWith("/")) {
                newPath = newPath.slice(0, -1);
            }
            const dir = getDirFromPath(newPath);
            if (dir) {
                currentPath = newPath;
                context.addLine(`Changed directory to ${currentPath}`);
            } else {
                context.addLine(`cd: no such directory: ${target}`);
            }
            context.createNewLine();
        },
    },
    mkdir: {
        description: "Create a new directory. Usage: mkdir <directoryName>",
        handler: (context, args) => {
            const dirArg = args[0];
            if (!dirArg) {
                context.addLine("Usage: mkdir <directoryName>");
                context.createNewLine();
                return;
            }
            let parentPath, newDirName;
            if (dirArg.includes("/")) {
                const parts = dirArg.split("/").filter(Boolean);
                newDirName = parts.pop();
                parentPath = dirArg.startsWith("/")
                    ? "/" + parts.join("/")
                    : currentPath === "/" ? "/" + parts.join("/") : currentPath + "/" + parts.join("/");
                if (parentPath === "") parentPath = "/";
            } else {
                parentPath = currentPath;
                newDirName = dirArg;
            }
            if (parentPath.length > 1 && parentPath.endsWith("/")) {
                parentPath = parentPath.slice(0, -1);
            }
            const parentDir = getDirFromPath(parentPath);
            if (!parentDir) {
                context.addLine(`mkdir: cannot create directory '${dirArg}': No such directory.`);
            } else if (parentDir.children && parentDir.children[newDirName]) {
                context.addLine(`mkdir: cannot create directory '${newDirName}': File exists.`);
            } else {
                parentDir.children = parentDir.children || {};
                parentDir.children[newDirName] = {
                    type: "directory",
                    children: {}
                };
                context.addLine(`Directory '${newDirName}' created in '${parentPath}'.`);
            }
            context.createNewLine();
        },
    },
    pwd: {
        description: "Print the current working directory",
        handler: (context) => {
            context.addLine(currentPath);
            context.createNewLine();
        },
    },
    rmdir: {
        description: "Remove an empty directory. Usage: rmdir <directoryName>",
        handler: (context, args) => {
            const dirName = args[0];
            if (!dirName) {
                context.addLine("Usage: rmdir <directoryName>");
                context.createNewLine();
                return;
            }
            const dir = getDirFromPath(currentPath);
            if (!dir || !dir.children || !dir.children[dirName]) {
                context.addLine(`rmdir: failed to remove '${dirName}': No such directory.`);
            } else {
                const target = dir.children[dirName];
                if (target.type !== "directory") {
                    context.addLine(`rmdir: failed to remove '${dirName}': Not a directory.`);
                } else if (Object.keys(target.children).length > 0) {
                    context.addLine(`rmdir: failed to remove '${dirName}': Directory not empty.`);
                } else {
                    delete dir.children[dirName];
                    context.addLine(`Directory '${dirName}' removed.`);
                }
            }
            context.createNewLine();
        },
    },
    mv: {
        description: "Move or rename a file/directory (current directory only). Usage: mv <source> <destination>",
        handler: (context, args) => {
            if (args.length < 2) {
                context.addLine("Usage: mv <source> <destination>");
                context.createNewLine();
                return;
            }
            const source = args[0];
            const destination = args[1];
            const dir = getDirFromPath(currentPath);
            if (!dir || !dir.children || !dir.children[source]) {
                context.addLine(`mv: cannot stat '${source}': No such file or directory.`);
            } else if (dir.children[destination]) {
                context.addLine(`mv: cannot move '${source}' to '${destination}': Destination exists.`);
            } else {
                dir.children[destination] = dir.children[source];
                delete dir.children[source];
                context.addLine(`Moved '${source}' to '${destination}'.`);
            }
            context.createNewLine();
        },
    },
    cp: {
        description: "Copy a file/directory (current directory only). Usage: cp <source> <destination>",
        handler: (context, args) => {
            if (args.length < 2) {
                context.addLine("Usage: cp <source> <destination>");
                context.createNewLine();
                return;
            }
            const source = args[0];
            const destination = args[1];
            const dir = getDirFromPath(currentPath);
            if (!dir || !dir.children || !dir.children[source]) {
                context.addLine(`cp: cannot stat '${source}': No such file or directory.`);
            } else if (dir.children[destination]) {
                context.addLine(`cp: cannot copy '${source}' to '${destination}': Destination exists.`);
            } else {
                dir.children[destination] = JSON.parse(JSON.stringify(dir.children[source]));
                context.addLine(`Copied '${source}' to '${destination}'.`);
            }
            context.createNewLine();
        },
    },
    echo: {
        description: "Echo the input text. Usage: echo <text>",
        handler: (context, args) => {
            context.addLine(args.join(" "));
            context.createNewLine();
        },
    },
    calc: {
        description: "Evaluate a simple arithmetic expression. Usage: calc <expression>",
        handler: (context, args) => {
            try {
                const expr = args.join(" ");
                // eslint-disable-next-line no-eval
                const result = eval(expr);
                context.addLine(`${expr} = ${result}`);
            } catch (error) {
                context.addLine("Error evaluating expression.");
            }
            context.createNewLine();
        },
    },
    flip: {
        description: "Flip a coin",
        handler: (context) => {
            const outcome = Math.random() < 0.5 ? "Heads" : "Tails";
            context.addLine(`You flipped: ${outcome}`);
            context.createNewLine();
        },
    },
    roll: {
        description: "Roll a dice. Optionally specify sides (default 6). Usage: roll [sides]",
        handler: (context, args) => {
            const sides = parseInt(args[0]) || 6;
            if (sides < 1) {
                context.addLine("Number of sides must be at least 1.");
            } else {
                const result = Math.floor(Math.random() * sides) + 1;
                context.addLine(`Rolled a ${sides}-sided dice: ${result}`);
            }
            context.createNewLine();
        },
    },
    countdown: {
        description: "Countdown from a number to 0. Usage: countdown <number>",
        handler: async (context, args) => {
            const start = parseInt(args[0]);
            if (isNaN(start) || start < 0) {
                context.addLine("Please provide a valid positive number.");
                context.createNewLine();
                return;
            }
            for (let i = start; i >= 0; i--) {
                context.addLine(i.toString());
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            context.createNewLine();
        },
    },
    reverse: {
        description: "Reverse the input text. Usage: reverse <text>",
        handler: (context, args) => {
            const input = args.join(" ");
            const reversed = input.split("").reverse().join("");
            context.addLine(reversed);
            context.createNewLine();
        },
    },
    matrix: {
        description: "Display a Matrix-style falling text simulation",
        handler: async (context) => {
            const rows = 10;
            const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            for (let i = 0; i < rows; i++) {
                let line = "";
                for (let j = 0; j < 50; j++) {
                    line += characters.charAt(Math.floor(Math.random() * characters.length));
                }
                context.addLine(line);
                await new Promise((resolve) => setTimeout(resolve, 200));
            }
            context.createNewLine();
        },
    },
    fortune: {
        description: "Get a random fortune",
        handler: (context) => {
            const fortunes = [
                "You will have a pleasant surprise.",
                "Now is the time to try something new.",
                "A faithful friend is a strong defense.",
                "You will conquer obstacles to achieve success.",
                "A lifetime of happiness lies ahead of you.",
            ];
            const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
            context.addLine(fortune);
            context.createNewLine();
        },
    },
    neofetch: {
        description: "Display system information",
        handler: (context) => {
            context.addLine("OS: Simulated OS");
            context.addLine(`User Agent: ${navigator.userAgent}`);
            const loadTime = performance.timing.navigationStart;
            const now = Date.now();
            const uptime = Math.floor((now - loadTime) / 1000);
            context.addLine(`Uptime: ${uptime} seconds`);
            context.createNewLine();
        },
    },
    weather: {
        description: "Show current weather using wttr.in. Usage: weather [location]",
        handler: async (context, args) => {
            try {
                const location = args[0] || "";
                const response = await fetch(`https://wttr.in/${location}?format=3`);
                const weather = await response.text();
                context.addLine(weather);
            } catch (error) {
                context.addLine("Error fetching weather.");
            }
            context.createNewLine();
        },
    },
    remind: {
        description: "Set a reminder. Usage: remind <seconds> <message>",
        handler: (context, args) => {
            const seconds = parseInt(args[0]);
            if (isNaN(seconds)) {
                context.addLine("Usage: remind <seconds> <message>");
                context.createNewLine();
            } else {
                const message = args.slice(1).join(" ") || "Reminder!";
                context.addLine(`Reminder set for ${seconds} seconds from now...`);
                context.createNewLine();
                setTimeout(() => {
                    context.addLine(`Reminder: ${message}`);
                    context.createNewLine();
                }, seconds * 1000);
            }
        },
    },
    random: {
        description: "Generate a random number between two values. Usage: random <min> <max>",
        handler: (context, args) => {
            const min = parseFloat(args[0]);
            const max = parseFloat(args[1]);
            if (isNaN(min) || isNaN(max)) {
                context.addLine("Usage: random <min> <max>");
            } else {
                const rand = Math.random() * (max - min) + min;
                context.addLine(`Random number between ${min} and ${max}: ${rand.toFixed(2)}`);
            }
            context.createNewLine();
        },
    },
    ip: {
        description: "Display your IP address",
        handler: (context) => {
            context.addLine(`Your IP address is: ${context.userIP}`);
            context.createNewLine();
        },
    },
    exit: {
        description: "Simulate exiting the terminal",
        handler: (context) => {
            context.addLine("Session ended. Refresh the page to start a new session.");
            const inputs = context.terminal.querySelectorAll(".input");
            inputs.forEach((input) => input.setAttribute("contenteditable", "false"));
        },
    },
    clippy: {
        description: "Get a helpful tip (like Clippy)",
        handler: (context) => {
            const tips = [
                "It looks like you're trying to code. Can I help you?",
                "Don't forget to save your work!",
                "Remember to take breaks and stay hydrated.",
                "Have you tried turning it off and on again?",
            ];
            const tip = tips[Math.floor(Math.random() * tips.length)];
            context.addLine(tip);
            context.createNewLine();
        },
    },
    ping: {
        description: "Simulate a ping command. Usage: ping <host>",
        handler: (context, args) => {
            const host = args[0] || "localhost";
            context.addLine(`Pinging ${host}...`);
            const latency = Math.floor(Math.random() * 100);
            setTimeout(() => {
                context.addLine(`Reply from ${host}: time=${latency}ms`);
                context.createNewLine();
            }, latency + 50);
        },
    },
};
