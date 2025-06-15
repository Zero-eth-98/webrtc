const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let viewer = null;
let sharer = null;

wss.on('connection', socket => {
  socket.on('message', message => {
    const data = JSON.parse(message);

    if (data.type === 'viewer') {
      viewer = socket;
    } else if (data.type === 'sharer') {
      sharer = socket;
    }

    if (data.target === 'viewer' && viewer) {
      viewer.send(JSON.stringify(data));
    } else if (data.target === 'sharer' && sharer) {
      sharer.send(JSON.stringify(data));
    }
  });

  socket.on('close', () => {
    if (socket === viewer) viewer = null;
    if (socket === sharer) sharer = null;
  });
});

app.use(express.static(path.join(__dirname, 'public')));

server.listen(3001, () => {
  console.log('✅ WebSocket server in ascolto su http://localhost:3001');
});
