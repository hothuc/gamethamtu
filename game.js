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

// socket.on('all-player-items', ({ allItems, playerNames }) => {
//   // Xóa bảng cũ nếu đã tồn tại
//   const oldTable = document.getElementById('playerItemGrid');
//   if (oldTable) oldTable.remove();

//   // Tạo bảng mới
//   const table = document.createElement('table');
//   table.id = 'playerItemGrid';
//   table.border = 1;
//   table.style.borderCollapse = 'collapse';
//   table.style.marginTop = '20px';
//   table.style.width = 'auto';
//   table.style.maxWidth = '100%';
//   table.style.tableLayout = 'auto';


//   // Duyệt qua tất cả người chơi
//   for (const id in allItems) {
//     const items = allItems[id];

//     // === Dòng 1: Tên người chơi + danh sách hung khí ===
//     const weaponRow = document.createElement('tr');

//     const nameCell = document.createElement('td');
//     nameCell.rowSpan = 2;
//     nameCell.style.fontWeight = 'bold';
//     nameCell.style.textAlign = 'center';
//     nameCell.style.background = '#f0f0f0';
//     nameCell.innerText = playerNames[id] || 'Người chơi';
//     weaponRow.appendChild(nameCell);

//     items.weapons.forEach(weapon => {
//       const td = document.createElement('td');
//       td.style.background = '#00FFFF';
//       td.innerText = weapon;
//       weaponRow.appendChild(td);
//     });
//     table.appendChild(weaponRow);

//     // === Dòng 2: bằng chứng ===
//     const evidenceRow = document.createElement('tr');
//     items.evidences.forEach(ev => {
//       const td = document.createElement('td');
//       td.style.background = '#FFD700';
//       td.innerText = ev;
//       evidenceRow.appendChild(td);
//     });
//     table.appendChild(evidenceRow);
//   }

//   // Hiển thị tiêu đề và bảng
//   const title = document.createElement('h2');
//   title.innerText = '📋 Danh sách vũ khí và bằng chứng của tất cả người chơi';
//   document.body.appendChild(title);
//   document.body.appendChild(table);
// });

socket.on('all-player-items', ({ allItems, playerNames }) => {
  // Xóa bảng cũ nếu đã tồn tại
  const oldTable = document.getElementById('playerItemGrid');
  if (oldTable) oldTable.remove();

  // Tạo bảng mới
  const table = document.createElement('table');
  table.id = 'playerItemGrid';
  table.border = 1;
  table.style.borderCollapse = 'collapse';
  table.style.marginTop = '20px';
  table.style.width = 'auto';
  table.style.maxWidth = '100%';
  table.style.tableLayout = 'auto';

  // Duyệt qua tất cả người chơi
  for (const id in allItems) {
    const items = allItems[id];

    // === Dòng 1: Tên người chơi + danh sách hung khí ===
    const weaponRow = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.rowSpan = 2;
    nameCell.style.fontWeight = 'bold';
    nameCell.style.textAlign = 'center';
    nameCell.style.background = '#f0f0f0';
    nameCell.style.padding = '10px';
    nameCell.innerText = playerNames[id] || 'Người chơi';
    weaponRow.appendChild(nameCell);

    items.weapons.forEach(weapon => {
      const td = document.createElement('td');
      td.style.background = '#00FFFF';
      td.innerText = weapon;
      weaponRow.appendChild(td);
    });
    table.appendChild(weaponRow);

    // === Dòng 2: Bằng chứng ===
    const evidenceRow = document.createElement('tr');
    items.evidences.forEach((ev, index) => {
      const td = document.createElement('td');
      td.style.background = '#FFD700';
      td.innerText = ev;
      td.style.fontWeight = 'normal'; // Không in đậm
      evidenceRow.appendChild(td);
    });
    table.appendChild(evidenceRow);

    // === Dòng trống ===
    const spacerRow = document.createElement('tr');
    const spacerTd = document.createElement('td');
    spacerTd.colSpan = 5; // 1 tên + 4 ô
    spacerTd.style.height = '10px';
    spacerTd.style.background = '#ffffff';
    spacerRow.appendChild(spacerTd);
    table.appendChild(spacerRow);
  }

  // Hiển thị tiêu đề và bảng
  const title = document.createElement('h2');
  title.innerText = '📋 Danh sách vũ khí và bằng chứng của tất cả người chơi';
  document.body.appendChild(title);
  document.body.appendChild(table);
});
