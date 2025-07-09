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

socket.on('all-player-items', ({ allItems, playerNames }) => {
  const oldTable = document.getElementById('playerItemGrid');
  if (oldTable) oldTable.remove();

  const table = document.createElement('table');
  table.id = 'playerItemGrid';

  for (const id in allItems) {
    const items = allItems[id];

    // Row 1: weapons
    const weaponRow = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.rowSpan = 2;
    nameCell.innerText = playerNames[id] || 'Người chơi';
    nameCell.style.background = '#f3f3f3';
    nameCell.style.textAlign = 'center';
    nameCell.style.fontWeight = 'bold';
    weaponRow.appendChild(nameCell);

    items.weapons.forEach(weapon => {
      const td = document.createElement('td');
      const btn = document.createElement('button');
      btn.className = 'cell-button';
      btn.innerText = weapon;
      btn.style.backgroundColor = '#00FFFF';
      btn.onclick = () => {
        btn.classList.toggle('selected');
      };
      td.appendChild(btn);
      td.style.background = '#00FFFF';
      weaponRow.appendChild(td);
    });
    table.appendChild(weaponRow);

    // Row 2: evidences
    const evidenceRow = document.createElement('tr');
    items.evidences.forEach(evi => {
      const td = document.createElement('td');
      const btn = document.createElement('button');
      btn.className = 'cell-button';
      btn.innerText = evi;
      btn.style.backgroundColor = '#FFD700';
      btn.onclick = () => {
        btn.classList.toggle('selected');
      };
      td.appendChild(btn);
      td.style.background = '#FFD700';
      evidenceRow.appendChild(td);
    });
    table.appendChild(evidenceRow);

    // Khoảng cách giữa các người chơi (dòng trắng)
    const spacer = document.createElement('tr');
    const spacerTd = document.createElement('td');
    spacerTd.colSpan = 9;
    spacerTd.style.height = '10px';
    spacerTd.style.background = 'transparent';
    spacer.appendChild(spacerTd);
    table.appendChild(spacer);
  }

  const title = document.createElement('h2');
  title.innerText = '📋 Danh sách hung khí & bằng chứng';
  document.body.appendChild(title);
  document.body.appendChild(table);
});
