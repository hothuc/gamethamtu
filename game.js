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

socket.on('you-are-host', () => {
  const btn = document.createElement('button');
  btn.innerText = '🔔 Bắt đầu ván chơi';
  btn.onclick = () => socket.emit('start-game');
  document.body.appendChild(btn);

  const hostNote = document.createElement('div');
  hostNote.innerText = '👑 Bạn là người điều khiển (host)';
  document.body.appendChild(hostNote);
});

socket.on('message', msg => {
  alert(msg); // Hiển thị thông báo từ server (ví dụ: chưa đủ người)
});

socket.on('show-evidence-weapon', (data) => {
  const div = document.createElement('div');
  div.innerHTML = `
    <h3>🧾 Bằng chứng</h3>
    <ul>${data.evidences.map(e => `<li>${e}</li>`).join('')}</ul>
    <h3>🔪 Hung khí</h3>
    <ul>${data.weapons.map(w => `<li>${w}</li>`).join('')}</ul>
  `;
  document.body.appendChild(div);
});
