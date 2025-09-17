const WebSocket = require ('ws');
const server = new WebSocket.Server({port:8080});



server.on('connection',socket=>{
    console.log(`new client connected`);

    socket.on('message',message=>{
        console.log(`Received: ${message}`);

        
        const msg = message.toString().trim().toLowerCase();
        console.log(`Raw received:`, JSON.stringify(msg));
        
        if (msg === 'hello') {
            socket.send('hi there');
        } else if (msg === 'are u ok') {
            socket.send("i'm good how about you");
        } else {
            socket.send(`roger that! ${msg}`);
        }
    });

    socket.on('close', () => {
        console.log('Client disconnected');
    });
})