const WebSocket = require ('ws');
const server = new WebSocket.Server({port:8080});

const clients = new Set();

server.on('connection',socket=>{
    console.log(`new client connected`);
    clients.add(socket);

    socket.on('message', message => {
        try {
            const parsed = JSON.parse(message);

            const now = new Date();
            const timestamp = now.toLocaleTimeString();
            // Format message as JSON string to send to all clients
            const formattedMessage = JSON.stringify({
                name: parsed.name || 'Anonymous',
                text: parsed.text || '',
                time: timestamp
            });

            // Broadcast to all clients except sender
            for (let client of clients) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(formattedMessage);
                }
            }

        } catch (err) {
            console.error('Invalid message received:', message);
        }
    });

    socket.on('close', () => {
        console.log('Client disconnected');
        clients.delete(socket);
    });
})