// SERVER WEB SOCKET - GESTISCE CONNESSIONI E MESSAGGI TRA SHARER E VIEWER

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let sharers = new Set();
let viewers = new Set();

wss.on('connection', socket => {
  console.log('🔌 Nuova connessione WebSocket');

  socket.on('message', message => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error('❌ Messaggio non valido:', message);
      return;
    }

    if (data.type === 'sharer') {
      sharers.add(socket);
      socket.role = 'sharer';
      console.log('📤 Sharer connesso');
    } else if (data.type === 'viewer') {
      viewers.add(socket);
      socket.role = 'viewer';
      console.log('📥 Viewer connesso');
    }

    // Reinvio messaggi ai destinatari giusti
    if (data.target === 'viewer') {
      viewers.forEach(viewer => {
        if (viewer.readyState === WebSocket.OPEN) {
          viewer.send(JSON.stringify(data));
        }
      });
    } else if (data.target === 'sharer') {
      sharers.forEach(sharer => {
        if (sharer.readyState === WebSocket.OPEN) {
          sharer.send(JSON.stringify(data));
        }
      });
    }
  });

  socket.on('close', () => {
    if (socket.role === 'sharer') sharers.delete(socket);
    if (socket.role === 'viewer') viewers.delete(socket);
    console.log(`❎ Connessione ${socket.role || 'ignota'} chiusa`);
  });
});

// Serve i file statici (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));

server.listen(3001, () => {
  console.log('✅ WebSocket server attivo su http://localhost:3001');
});
