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

socket.on('your-items', (data) => {
  const div = document.createElement('div');
  div.innerHTML = `
    <h3>🧳 Vật chứng của bạn</h3>
    <p><strong>Bằng chứng:</strong></p>
    <ul>${data.evidences.map(e => `<li>${e}</li>`).join('')}</ul>
    <p><strong>Hung khí:</strong></p>
    <ul>${data.weapons.map(w => `<li>${w}</li>`).join('')}</ul>
  `;
  document.body.appendChild(div);
});

socket.on('murder-info', (data) => {
  const div = document.createElement('div');
  div.innerHTML = `
    <h3>🕵️ Manh mối từ hiện trường</h3>
    <p><strong>Bằng chứng:</strong> ${data.evidence}</p>
    <p><strong>Hung khí:</strong> ${data.weapon}</p>
  `;
  document.body.appendChild(div);
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


