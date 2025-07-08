const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let players = {};
let roles = {};

function assignRoles() {
  const ids = Object.keys(players);
  if (ids.length < 3) return;

  const murderer = ids[Math.floor(Math.random() * ids.length)];
  ids.forEach(id => {
    roles[id] = (id === murderer) ? 'Murderer' : 'Investigator';
    io.to(id).emit('role', roles[id]);
  });
}

io.on('connection', (socket) => {
  console.log('🟢 Kết nối:', socket.id);

  socket.on('join', (name) => {
    players[socket.id] = name;
    io.emit('player-list', Object.values(players));
    if (Object.keys(players).length >= 3) {
      assignRoles();
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    delete roles[socket.id];
    io.emit('player-list', Object.values(players));
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
