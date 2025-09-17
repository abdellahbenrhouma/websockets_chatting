const socket = new WebSocket('ws://localhost:8080');

const chatDiv = document.getElementById('chat');
const input = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');

let username = '';
let isRegistered = false;

function addMessage(who, text, time) {
    const p = document.createElement('p');
    p.textContent = `${who}: ${text} (${time})`;
    chatDiv.appendChild(p);
}

function promptForName() {
    const name = prompt("Enter your name (leave blank or type 'anonymous' for anonymous):") || 'anonymous';
    socket.send(JSON.stringify({ type: 'register', name }));
}

socket.onopen = () => {
    promptForName();
};

socket.onmessage = ({ data }) => {
    try {
        const msg = JSON.parse(data);

        if (msg.type === 'error') {
            if (msg.error === 'name_taken') {
                alert('That name is already taken. Please choose a different one.');
                promptForName();
            } else if (msg.error === 'must_register_first') {
                alert('You must register a name before sending messages.');
            }
            return;
        }

        if (msg.type === 'registered') {
            username = msg.name;
            isRegistered = true;
            console.log(`Registered as ${username}`);
            return;
        }

        if (msg.type === 'message') {
            addMessage(msg.name, msg.text, msg.time);
        }
    } catch (e) {
        console.error("Invalid message format:", data);
    }
};

const sendMessage = () => {
    const msg = input.value.trim();
    if (msg && isRegistered) {
        const messageObject = {
            type: 'message',
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
