const socket = new WebSocket('ws://localhost:8080');

const chatDiv = document.getElementById('chat');
const input = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');

const statusDiv = document.getElementById('status');
const usernameSpan = document.getElementById('username');
const roomSpan = document.getElementById('roomName');
const leaveRoomBtn = document.getElementById('leaveRoomBtn');

const createRoomBtn = document.getElementById('createRoomBtn');
const createRoomName = document.getElementById('createRoomName');
const createRoomCapacity = document.getElementById('createRoomCapacity');

const joinRoomBtn = document.getElementById('joinRoomBtn');
const joinRoomName = document.getElementById('joinRoomName');

let username = '';
let isRegistered = false;
let currentRoom = null;

function setStatus(text) {
  statusDiv.textContent = text;
}

function updateUserInfo() {
  usernameSpan.textContent = username;
  roomSpan.textContent = currentRoom || "Public";
  leaveRoomBtn.style.display = currentRoom ? 'inline-block' : 'none';
}

function addMessage(who, text, time, isPublic = false) {
  const p = document.createElement('p');
  p.textContent = `${who}: ${text} (${time})`;
  if (isPublic) p.style.color = 'blue'; // only # messages
  else p.style.color = 'black'; // all others
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

leaveRoomBtn.onclick = () => {
  socket.send(JSON.stringify({ type: 'leave_room' }));
};

socket.onopen = () => {
  setStatus('Connected to server.');
  registerUser();
};

socket.onmessage = ({ data }) => {
  try {
    const msg = JSON.parse(data);

    if (msg.type === 'error') {
      alert("Error: " + msg.error);
      return;
    }

    if (msg.type === 'registered') {
      username = msg.name;
      isRegistered = true;
      updateUserInfo();
      setStatus(`✅ Registered as: ${username}`);
      return;
    }

    if (msg.type === 'room_joined') {
      currentRoom = msg.room;
      updateUserInfo();
      setStatus(`✅ Joined room: ${currentRoom}`);
      return;
    }

    if (msg.type === 'room_left') {
      currentRoom = null;
      updateUserInfo();
      setStatus("You left the room. Back to public chat.");
      return;
    }

    if (msg.type === 'message') {
      const isPublic = msg.isPublic === true;
      addMessage(msg.name, msg.text, msg.time, isPublic);
    }
  } catch (e) {
    console.error("Invalid message:", data);
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
