const API_URL = "http://127.0.0.1:5000/chat";

function sendMessage() {
    const input = document.getElementById("user-input");
    const message = input.value.trim();

    if (message === "") return;

    appendMessage("You: " + message, "user");
    input.value = "";

    fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: message })
    })
    .then(response => response.json())
    .then(data => {

        // 🟢 TEXT RESPONSE (greetings / info)
        if (data.type === "text") {
            appendMessage("🤖 " + data.response, "bot");
            return;
        }

        // 📚 BOOK RESPONSE
        if (data.type === "books") {

            if (!data.response || data.response.length === 0) {
                appendMessage("🤖 No books found.", "bot");
                return;
            }

            data.response.forEach(book => {
                appendMessage(
                    `📖 <strong>${book.title}</strong><br>
                     👤 ${book.author}<br>
                     📄 ${book.description}<br>
                     ⭐ Rating: ${book.rating}/5`,
                    "bot"
                );
            });
        }

    })
    .catch(error => {
        console.error("REAL ERROR:", error);
        appendMessage("⚠️ Something went wrong.", "bot");
    });
}

function appendMessage(text, className) {
    const chatBox = document.getElementById("chat-box");

    const div = document.createElement("div");
    div.className = "message " + className;
    div.innerHTML = text;

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Allow Enter key
document.getElementById("user-input")
.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});