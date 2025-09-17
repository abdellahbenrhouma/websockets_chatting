const socket = new WebSocket('ws://localhost:8080');

const chatDiv = document.getElementById('chat');
const input = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');

const statusDiv = document.getElementById('status');

const createRoomBtn = document.getElementById('createRoomBtn');
const createRoomName = document.getElementById('createRoomName');
const createRoomCapacity = document.getElementById('createRoomCapacity');

const joinRoomBtn = document.getElementById('joinRoomBtn');
const joinRoomName = document.getElementById('joinRoomName');

let username = '';
let isRegistered = false;
let room = null;

function setStatus(text) {
    statusDiv.textContent = text;
}

function addMessage(who, text, time) {
    const p = document.createElement('p');
    p.textContent = `${who}: ${text} (${time})`;
    chatDiv.appendChild(p);
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

function registerUser() {
    let name = prompt("Enter your name (or leave blank for anonymous):") || 'anonymous';
    socket.send(JSON.stringify({ type: 'register', name }));
}

createRoomBtn.onclick = () => {
    const room = createRoomName.value.trim();
    const cap = parseInt(createRoomCapacity.value);
    if (!room || ![4, 5, 6].includes(cap)) {
        alert('Please provide valid room name and capacity.');
        return;
    }
    socket.send(JSON.stringify({ type: 'create_room', room, capacity: cap }));
};

joinRoomBtn.onclick = () => {
    const room = joinRoomName.value.trim();
    if (!room) {
        alert("Please enter a room name.");
        return;
    }
    socket.send(JSON.stringify({ type: 'join_room', room }));
};

socket.onopen = () => {
    setStatus('Connected to server.');
    registerUser();
};

socket.onmessage = ({ data }) => {
    try {
        const msg = JSON.parse(data);

        if (msg.type === 'error') {
            let message = '❌ Error: ';
            switch (msg.error) {
                case 'name_taken':
                    alert("Name already taken.");
                    registerUser();
                    break;
                case 'server_full':
                    message += "Server is full. No more rooms allowed.";
                    break;
                case 'room_exists_or_invalid':
                    message += "Room already exists or name is invalid.";
                    break;
                case 'invalid_capacity':
                    message += "Capacity must be 4, 5 or 6.";
                    break;
                case 'room_not_found':
                    message += "Room not found.";
                    break;
                case 'room_full':
                    message += "Room is full.";
                    break;
                case 'not_in_room':
                    message += "You must join a room first.";
                    break;
                default:
                    message += msg.error;
            }
            setStatus(message);
            return;
        }

        if (msg.type === 'registered') {
            username = msg.name;
            isRegistered = true;
            setStatus(`✅ Registered as: ${username}`);
            return;
        }

        if (msg.type === 'room_joined') {
            room = msg.room;
            setStatus(`✅ Joined room: ${room}`);
            return;
        }

        if (msg.type === 'message') {
            addMessage(msg.name, msg.text, msg.time);
        }

    } catch (e) {
        console.error("Failed to parse message:", data);
    }
};

const sendMessage = () => {
    const msg = input.value.trim();
    if (!msg) return;

    socket.send(JSON.stringify({ type: 'message', text: msg }));
    input.value = '';
};

sendBtn.onclick = sendMessage;
input.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
});
