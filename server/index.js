const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

const clients = new Set(); // all connected sockets
const usernames = new Set(); // to avoid duplicates
const anonymousNumbers = new Set(); // anonymous1, 2, etc.

const rooms = new Map(); // roomName -> { capacity: number, members: Set<socket> }

function getNextAnonymousName() {
    let i = 1;
    while (anonymousNumbers.has(i)) i++;
    anonymousNumbers.add(i);
    return `anonymous${i}`;
}

function cleanupUser(socket) {
    if (socket.username) {
        usernames.delete(socket.username);
        const match = socket.username.match(/^anonymous(\d+)$/);
        if (match) anonymousNumbers.delete(Number(match[1]));
    }

    // Remove user from their room
    if (socket.room && rooms.has(socket.room)) {
        const room = rooms.get(socket.room);
        room.members.delete(socket);
        if (room.members.size === 0) {
            rooms.delete(socket.room);
            console.log(`Room ${socket.room} deleted`);
        }
    }
}

server.on('connection', socket => {
    clients.add(socket);
    socket.username = null;
    socket.room = null;

    socket.on('message', raw => {
        try {
            const msg = JSON.parse(raw);

            // Registration
            if (!socket.username && msg.type === 'register') {
                let name = (msg.name || '').trim();
                if (!name || name.toLowerCase() === 'anonymous') {
                    name = getNextAnonymousName();
                } else if (usernames.has(name)) {
                    return socket.send(JSON.stringify({ type: 'error', error: 'name_taken' }));
                }

                socket.username = name;
                usernames.add(name);
                socket.send(JSON.stringify({ type: 'registered', name }));
                return;
            }

            // Must register before doing anything else
            if (!socket.username) {
                return socket.send(JSON.stringify({ type: 'error', error: 'must_register_first' }));
            }

            // Create Room
            if (msg.type === 'create_room') {
                if (rooms.size >= 4) {
                    return socket.send(JSON.stringify({ type: 'error', error: 'server_full' }));
                }

                const roomName = msg.room.trim();
                const capacity = parseInt(msg.capacity, 10);

                if (!roomName || rooms.has(roomName)) {
                    return socket.send(JSON.stringify({ type: 'error', error: 'room_exists_or_invalid' }));
                }

                if (![4, 5, 6].includes(capacity)) {
                    return socket.send(JSON.stringify({ type: 'error', error: 'invalid_capacity' }));
                }

                rooms.set(roomName, { capacity, members: new Set([socket]) });
                socket.room = roomName;

                socket.send(JSON.stringify({ type: 'room_joined', room: roomName }));
                return;
            }

            // Join Room
            if (msg.type === 'join_room') {
                const roomName = msg.room.trim();
                if (!rooms.has(roomName)) {
                    return socket.send(JSON.stringify({ type: 'error', error: 'room_not_found' }));
                }

                const room = rooms.get(roomName);
                if (room.members.size >= room.capacity) {
                    return socket.send(JSON.stringify({ type: 'error', error: 'room_full' }));
                }

                room.members.add(socket);
                socket.room = roomName;

                socket.send(JSON.stringify({ type: 'room_joined', room: roomName }));
                return;
            }

            // inside message handler

            if (msg.type === 'leave_room') {
                if (socket.room && rooms.has(socket.room)) {
                    const room = rooms.get(socket.room);
                    room.members.delete(socket);
                    if (room.members.size === 0) {
                        rooms.delete(socket.room);
                        console.log(`Room ${socket.room} deleted`);
                    }
                    socket.room = null;
                    socket.send(JSON.stringify({ type: 'room_left' }));
                }
                return;
            }

            if (msg.type === 'message') {
                const text = msg.text.trim();
                if (!text) return;
                        
                const now = new Date().toLocaleTimeString();
                        
                const isHashedPublic = text.startsWith('#'); // only # messages are blue
                const isInRoom = !!socket.room;
                        
                const payload = JSON.stringify({
                    type: 'message',
                    name: socket.username,
                    text: isHashedPublic ? text.substring(1).trim() : text,
                    time: now,
                    isPublic: isHashedPublic // only true for # messages
                });
            
                if (!isInRoom || isHashedPublic) {
                    for (let client of clients) {
                        const isTargetInRoom = client.room;
                        if (client.readyState === WebSocket.OPEN && (!isTargetInRoom || isHashedPublic)) {
                            client.send(payload);
                        }
                    }
                } else if (isInRoom && rooms.has(socket.room)) {
                    const room = rooms.get(socket.room);
                    for (let member of room.members) {
                        if (member.readyState === WebSocket.OPEN) {
                            member.send(payload);
                        }
                    }
                }
            }



            


        } catch (err) {
            console.error("Error parsing message:", raw);
        }
    });

    socket.on('close', () => {
        cleanupUser(socket);
        clients.delete(socket);
    });
});
