const WebSocket = require ('ws');
const server = new WebSocket.Server({port:8080});

const clients = new Set();
const usernames = new Set();
const anonymousNumbers = new Set(); // e.g. contains [1, 2, 4]

function getNextAnonymousName() {
    let i = 1;
    while (anonymousNumbers.has(i)) {
        i++;
    }
    anonymousNumbers.add(i);
    return `anonymous${i}`;
}

server.on('connection', socket => {
    console.log('New client connected');
    clients.add(socket);

    socket.username = null;

    socket.on('message', msg => {
        try {
            const parsed = JSON.parse(msg);

            // First message must be a registration
            if (!socket.username) {
                if (parsed.type === 'register') {
                    let requestedName = (parsed.name || '').trim();

                    // Handle anonymous
                    if (!requestedName || requestedName.toLowerCase() === 'anonymous') {
                        requestedName = getNextAnonymousName();
                    } else if (usernames.has(requestedName)) {
                        // Name taken, send error and return
                        socket.send(JSON.stringify({
                            type: 'error',
                            error: 'name_taken'
                        }));
                        return;
                    }

                    // Register the username
                    socket.username = requestedName;
                    usernames.add(requestedName);

                    // Acknowledge registration
                    socket.send(JSON.stringify({
                        type: 'registered',
                        name: requestedName
                    }));

                    return;
                } else {
                    // Must register first
                    socket.send(JSON.stringify({
                        type: 'error',
                        error: 'must_register_first'
                    }));
                    return;
                }
            }

            // Handle normal chat messages
            if (parsed.type === 'message' && typeof parsed.text === 'string') {
                const now = new Date();
                const timestamp = now.toLocaleTimeString();

                const formattedMessage = JSON.stringify({
                    type: 'message',
                    name: socket.username,
                    text: parsed.text.trim(),
                    time: timestamp
                });

                for (let client of clients) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(formattedMessage);
                    }
                }
            }

        } catch (err) {
            console.error('Invalid message:', msg);
        }
    });

    socket.on('close', () => {
        console.log('Client disconnected');
        clients.delete(socket);
        if (socket.username) {
            usernames.delete(socket.username);

            const anonMatch = socket.username.match(/^anonymous(\d+)$/);
            if (anonMatch) {
                const num = parseInt(anonMatch[1], 10);
                anonymousNumbers.delete(num); // Free the anonymous number
            }
        }
    });
});