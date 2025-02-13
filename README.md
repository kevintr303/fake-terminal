# 🖥️ Fake Terminal  
A **fully interactive, fake command-line interface**—built for fun, learning, and because they're cool.

🚀 **[Try it here](https://kevintr303.github.io/fake-terminal/)**  

---

## **🔧 Features**  
✅ **Real (simulated) terminal commands** – Supports `ls`, `cd`, `cat`, `pwd`, `mkdir`, `rm`, `echo`, and more.  
✅ **Easily extensible** – Add **your own commands** in `commands.js` with minimal effort.  
✅ **Typing sounds** – Realistic keyboard typing & enter key sound effects.  
✅ **Simulated file system** – Navigate directories, read/write files, and execute commands.  
✅ **Fun commands** – Try `joke`, `weather`, `fortune`, `matrix`, `flip`, and `roll`.  
✅ **User IP detection & system info** – Mimics real terminal commands like `whoami` & `neofetch`.   

---

## **📜 How to Use**  
1️⃣ Open the **[live demo](https://kevintr303.github.io/fake-terminal/)**.  
2️⃣ Start typing commands—just like a real terminal!  
3️⃣ Press **Enter** to execute a command.  
4️⃣ Explore the built-in commands or **add your own** in `commands.js`.  

---

## **🛠 Easily Add Your Own Commands!**  
The terminal is **fully extensible**—you can add your own commands with minimal effort.  

### **📌 Example: Adding a New Command**  
To add a new command (`hello`), edit `commands.js` and add:  
```js
commands.hello = {
    description: "Say hello!",
    handler: (context) => {
        context.addLine("Hello, world!");
        context.createNewLine();
    },
};
```
Now typing `hello` in the terminal will display:
```
Hello, world!
```
It's that easy!