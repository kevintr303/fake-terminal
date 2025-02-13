"use strict";

import { commands } from "./commands.js";

document.addEventListener("DOMContentLoaded", () => {
    const terminal = document.getElementById("terminal");
    const promptStr = "kevintr303@github:~$ ";
    const commandHistory = [];
    let historyIndex = 0;
    let userIP = "Unknown";

    const keySound1 = document.getElementById("keySound1");
    const keySound2 = document.getElementById("keySound2");
    const keySound3 = document.getElementById("keySound3");
    const enterSound = document.getElementById("enterSound");
    const keySounds = [keySound1, keySound2, keySound3];
    let soundIndex = 0;

    // For realistic key sound behavior
    const heldKeys = new Set();

    // Retrieve the user's IP address
    fetch("https://api.ipify.org?format=json")
        .then((response) => response.json())
        .then((data) => {
            userIP = data.ip;
        })
        .catch(() => {
            userIP = "Could not retrieve IP";
        });

    let currentInputSpan = null;
    createNewLine();

    // Refocus the current input on any click
    document.addEventListener("click", () => {
        if (currentInputSpan) currentInputSpan.focus();
    });

    // Allow keys to be re-triggered on subsequent presses
    document.addEventListener("keyup", (event) => {
        heldKeys.delete(event.key.toLowerCase());
    });

    function createNewLine() {
        const line = document.createElement("div");
        line.className = "line";
        line.innerHTML = `<span class="prompt">${promptStr}</span><span class="input" contenteditable="true"></span>`;
        terminal.appendChild(line);

        const inputSpan = line.querySelector(".input");
        inputSpan.focus();
        currentInputSpan = inputSpan;
        terminal.scrollTop = terminal.scrollHeight;

        inputSpan.addEventListener("keydown", handleKeyDown);
        inputSpan.addEventListener("input", () => showSuggestions(inputSpan));
    }

    function handleKeyDown(event) {
        const inputSpan = event.target;
        const normalizedKey = event.key.toLowerCase();

        if (normalizedKey === "enter" && event.repeat) {
            event.preventDefault();
            return;
        }

        if (!heldKeys.has(normalizedKey)) {
            heldKeys.add(normalizedKey);

            if (normalizedKey === "enter") {
                event.preventDefault();
                playSound(enterSound);
                processCommand(inputSpan.innerText.trim(), inputSpan.parentElement);
                return;
            } else if (!["shift", "alt", "meta", "control"].includes(normalizedKey)) {
                playSound(keySounds[soundIndex]);
                soundIndex = (soundIndex + 1) % keySounds.length;
            }
        }

        switch (event.key) {
            case "ArrowUp":
                event.preventDefault();
                if (commandHistory.length && historyIndex > 0) {
                    historyIndex--;
                    inputSpan.innerText = commandHistory[historyIndex];
                    setCaretToEnd(inputSpan);
                }
                break;
            case "ArrowDown":
                event.preventDefault();
                if (commandHistory.length && historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    inputSpan.innerText = commandHistory[historyIndex];
                    setCaretToEnd(inputSpan);
                } else {
                    historyIndex = commandHistory.length;
                    inputSpan.innerText = "";
                }
                break;
            case "Tab":
                event.preventDefault();
                handleAutocomplete(inputSpan);
                break;
            default:
                break;
        }
    }

    function playSound(audioElement) {
        if (!audioElement) return;
        const clone = audioElement.cloneNode(true);
        clone.play().catch(() => { });
    }

    function processCommand(command, lineElement) {
        const inputSpan = lineElement.querySelector(".input");
        inputSpan.contentEditable = "false";

        if (command === "") {
            createNewLine();
            return;
        }

        commandHistory.push(command);
        historyIndex = commandHistory.length;

        // Prepare a context for command handlers
        const context = {
            terminal,
            createNewLine,
            addLine,
            userIP,
            commands,
        };

        const [cmdName, ...args] = command.split(" ");

        if (commands.hasOwnProperty(cmdName)) {
            const cmd = commands[cmdName];
            if (typeof cmd.handler === "function") {
                cmd.handler(context, args);
            } else if (cmd.response) {
                outputText(cmd.response);
                createNewLine();
            }
        } else {
            outputText(`${cmdName}: command not found`);
            createNewLine();
        }
    }

    function outputText(text) {
        text.split("\n").forEach((lineText) => {
            if (lineText.trim() !== "") {
                const newLine = document.createElement("div");
                newLine.className = "line";
                newLine.innerText = lineText;
                terminal.appendChild(newLine);
            }
        });
        terminal.scrollTop = terminal.scrollHeight;
    }

    function handleAutocomplete(inputSpan) {
        const currentText = inputSpan.innerText.trim();
        const matching = Object.keys(commands)
            .filter(cmd => !commands[cmd].hidden)
            .filter(cmd => cmd.startsWith(currentText));
        if (matching.length === 1) {
            inputSpan.innerText = matching[0];
            setCaretToEnd(inputSpan);
            clearSuggestions();
        }
    }

    function showSuggestions(inputSpan) {
        clearSuggestions();
        const currentText = inputSpan.innerText.trim();
        if (!currentText) return;
        const matching = Object.keys(commands)
            .filter(cmd => !commands[cmd].hidden)
            .filter(cmd => cmd.startsWith(currentText));
        if (matching.length === 0 || (matching.length === 1 && matching[0] === currentText))
            return;

        const suggestionsBox = document.createElement("div");
        suggestionsBox.className = "suggestions";
        matching.forEach((cmd) => {
            const item = document.createElement("div");
            item.className = "suggestion-item";
            item.innerText = cmd;
            item.addEventListener("click", () => {
                inputSpan.innerText = cmd;
                setCaretToEnd(inputSpan);
                clearSuggestions();
            });
            suggestionsBox.appendChild(item);
        });
        const rect = inputSpan.getBoundingClientRect();
        suggestionsBox.style.top = rect.bottom + "px";
        suggestionsBox.style.left = rect.left + "px";
        document.body.appendChild(suggestionsBox);
    }

    function clearSuggestions() {
        document.querySelectorAll(".suggestions").forEach((el) => el.remove());
    }

    function setCaretToEnd(el) {
        el.focus();
        if (window.getSelection && document.createRange) {
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    // Helper: Add a new output line
    function addLine(text) {
        const newLine = document.createElement("div");
        newLine.className = "line";
        newLine.innerText = text;
        terminal.appendChild(newLine);
        terminal.scrollTop = terminal.scrollHeight;
    }
});
