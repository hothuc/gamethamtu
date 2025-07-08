const socket = io();

function joinGame() {
  const name = document.getElementById('name').value;
  socket.emit('join', name);
}

socket.on('player-list', (players) => {
  document.getElementById('players').innerHTML =
    '<h3>👥 Người chơi:</h3>' + players.map(p => `<div>${p}</div>`).join('');
});

socket.on('role', (role) => {
  document.getElementById('role').innerText = `🎭 Vai trò của bạn: ${role}`;
});
