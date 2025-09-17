const socket = new WebSocket ('ws://localhost:8080');

const chatDiv = document.getElementById('chat');
const input = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');

let username='';
function addMessage(who, text, time) {
    const p = document.createElement('p');
    p.textContent = `${who}: ${text} (${time})`;
    chatDiv.appendChild(p);
}

window.onload = () => {
    username = prompt("Enter your name:");
    if (!username) {
        username = "Anonymous";
    }
};

socket.onopen = () => {
    console.log('Connected to server');
};

socket.onmessage = ({ data }) => {
    try {
        const msg = JSON.parse(data);
        addMessage(msg.name, msg.text, msg.time);
    } catch (e) {
        console.error("Invalid message format:", data);
    }
};


const sendMessage = () => {
    const msg = input.value.trim();
    if (msg && username) {
        const messageObject = {
            name: username,
            text: msg
        };
        socket.send(JSON.stringify(messageObject));
        input.value = '';
    }
};

sendBtn.onclick = sendMessage;

input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});