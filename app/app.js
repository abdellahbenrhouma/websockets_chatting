const socket = new WebSocket ('ws://localhost:8080');

const chatDiv = document.getElementById('chat');
const input = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');

function addMessage(who, text) {
    const p = document.createElement('p');
    p.textContent = `${who}: ${text}`;
    chatDiv.appendChild(p);
}

socket.onopen = () => {
    console.log('Connected to server');
};

socket.onmessage = ({data})=>{
    addMessage('Server', data);
};

const sendMessage = () => {
    const msg = input.value.trim();
    if (msg) {
        socket.send(msg);
        addMessage('You', msg);
        input.value = '';
    }
};

sendBtn.onclick = sendMessage;

input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});