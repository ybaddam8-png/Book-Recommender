const API_URL = "http://127.0.0.1:5000/chat";

async function sendMessage() {

const input = document.getElementById("user-input");
const message = input.value.trim();

if (message === "") return;

appendMessage(message, "user");

input.value = "";

showTyping();

try {

const response = await fetch(API_URL, {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({ message: message })
});

const data = await response.json();

removeTyping();

if (data.type === "text") {

appendMessage(data.response, "bot");
return;

}

if (data.type === "books") {

if (!data.response || data.response.length === 0) {

appendMessage("No books found.", "bot");
return;

}

for (const book of data.response) {

await appendBookCard(book);

}

}

} catch (error) {

removeTyping();
console.error(error);
appendMessage("⚠️ Something went wrong.", "bot");

}

}

function appendMessage(text, type) {

const chatBox = document.getElementById("chat-box");

const div = document.createElement("div");
div.className = "message " + type;
div.innerHTML = text;

chatBox.appendChild(div);
chatBox.scrollTop = chatBox.scrollHeight;

}

async function appendBookCard(book) {

const chatBox = document.getElementById("chat-box");

const div = document.createElement("div");
div.className = "message bot";

let coverURL = "https://via.placeholder.com/60x90?text=Book";

try {

const encodedTitle = encodeURIComponent(book.title);

const res = await fetch(`https://openlibrary.org/search.json?title=${encodedTitle}`);

const data = await res.json();

if (data.docs && data.docs.length > 0 && data.docs[0].cover_i) {

coverURL = `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`;

}

} catch (e) {

console.log("Cover fetch failed");

}

div.innerHTML = `

<div class="book-card">

<img class="book-cover"
src="${coverURL}"
onerror="this.src='https://via.placeholder.com/60x90?text=Book'">

<div class="book-info">

<div class="book-title">📖 ${book.title}</div>

<div class="book-author">👤 ${book.author}</div>

<div class="book-desc">${book.description}</div>

<div class="book-rating">⭐ ${book.rating}/5</div>

</div>

</div>

`;

chatBox.appendChild(div);
chatBox.scrollTop = chatBox.scrollHeight;

}

function showTyping() {

const chatBox = document.getElementById("chat-box");

const div = document.createElement("div");
div.className = "message bot typing";
div.id = "typing";

div.innerHTML = `
<span></span>
<span></span>
<span></span>
`;

chatBox.appendChild(div);
chatBox.scrollTop = chatBox.scrollHeight;

}

function removeTyping() {

const typing = document.getElementById("typing");

if (typing) typing.remove();

}

document
.getElementById("user-input")
.addEventListener("keypress", function (e) {

if (e.key === "Enter") {
sendMessage();
}

});