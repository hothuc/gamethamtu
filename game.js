const socket = io();

function joinGame() {
  const name = document.getElementById('name').value;
  socket.emit('join', name);
}

socket.on('player-list', ({ players, hostId, gmId, myId }) => {
  const playersDiv = document.getElementById('players');
  playersDiv.innerHTML = '<h3>👥 Người chơi:</h3>';

  for (const [id, name] of Object.entries(players)) {
    const playerLine = document.createElement('div');
    playerLine.style.display = 'flex';
    playerLine.style.alignItems = 'center';
    playerLine.style.gap = '8px';

    const nameSpan = document.createElement('span');
    nameSpan.innerText = name;

    playerLine.appendChild(nameSpan);

    // Nếu là host, thêm checkbox để chọn GM
    if (myId === hostId) {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = (id === gmId);
      checkbox.onclick = () => {
        socket.emit('set-gamemaster', id);
      };
      playerLine.appendChild(checkbox);
    }

    // Nếu là GM, thêm biểu tượng
    if (id === gmId) {
      const gmLabel = document.createElement('span');
      gmLabel.innerText = '🎲 Quản trò';
      playerLine.appendChild(gmLabel);
    }

    playersDiv.appendChild(playerLine);
  }
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

socket.on('confirm-button-hide', () => {
  const btn = document.getElementById('confirmBtn');
  if (btn) btn.remove();
});

socket.on('all-player-items', ({ allItems, playerNames, murdererId, myId }) => {
  const oldTable = document.getElementById('playerItemGrid');
  if (oldTable) oldTable.remove();

  const table = document.createElement('table');
  table.id = 'playerItemGrid';

  const title = document.createElement('h2');
  // title.innerText = '📋 Danh sách hung khí & bằng chứng';
  // document.body.appendChild(title);
  document.body.appendChild(table);

  let selectedWeapon = null;
  let selectedEvidence = null;

  for (const id in allItems) {
    const items = allItems[id];

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
      btn.classList.add('interactive-btn');
      btn.innerText = weapon;
      btn.style.backgroundColor = '#00FFFF';
      btn.dataset.type = 'weapon';
      btn.dataset.owner = id;

      const originalColor = btn.style.backgroundColor;

      if (myId === murdererId && myId === id) {
        btn.onclick = () => {
          if (btn.classList.contains('selected')) {
            btn.classList.remove('selected');
            btn.style.backgroundColor = originalColor;
            selectedWeapon = null;
          } else {
            if (selectedWeapon) return;
            btn.classList.add('selected');
            btn.style.backgroundColor = 'red';
            selectedWeapon = weapon;
          }
          updateConfirmBtn();
        };
      }

      td.appendChild(btn);
      td.style.background = '#00FFFF';
      weaponRow.appendChild(td);
    });
    table.appendChild(weaponRow);

    const evidenceRow = document.createElement('tr');
    items.evidences.forEach(evi => {
      const td = document.createElement('td');
      const btn = document.createElement('button');
      btn.className = 'cell-button';
      btn.classList.add('interactive-btn');
      btn.innerText = evi;
      btn.style.backgroundColor = '#FFD700';
      btn.dataset.type = 'evidence';
      btn.dataset.owner = id;

      const originalColor = btn.style.backgroundColor;

      if (myId === murdererId && myId === id) {
        btn.onclick = () => {
          if (btn.classList.contains('selected')) {
            btn.classList.remove('selected');
            btn.style.backgroundColor = originalColor;
            selectedEvidence = null;
          } else {
            if (selectedEvidence) return;
            btn.classList.add('selected');
            btn.style.backgroundColor = 'red';
            selectedEvidence = evi;
          }
          updateConfirmBtn();
        };
      }

      td.appendChild(btn);
      td.style.background = '#FFD700';
      evidenceRow.appendChild(td);
    });
    table.appendChild(evidenceRow);

    const spacer = document.createElement('tr');
    const spacerTd = document.createElement('td');
    spacerTd.colSpan = 9;
    spacerTd.style.height = '10px';
    spacerTd.style.background = 'transparent';
    spacer.appendChild(spacerTd);
    table.appendChild(spacer);
  }

  // Nếu là Murderer thì thêm nút xác nhận
  if (myId === murdererId) {
    const confirmBtn = document.createElement('button');
    confirmBtn.id = 'confirmBtn';
    confirmBtn.innerText = '✅ Xác nhận gây án';
    confirmBtn.disabled = true;
    confirmBtn.style.marginTop = '10px';
    confirmBtn.onclick = () => {
      socket.emit('murderer-selection', {
        evidence: selectedEvidence,
        weapon: selectedWeapon
      });
      confirmBtn.remove();
    };
    document.body.appendChild(confirmBtn);
  }

  function updateConfirmBtn() {
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
      confirmBtn.disabled = !(selectedWeapon && selectedEvidence);
    }
  }
  socket.on('enable-interaction', () => {
  document.querySelectorAll('.interactive-btn').forEach(button => {
    const originalColor = button.dataset.type === 'weapon' ? '#00FFFF' : '#FFD700';

    button.onclick = () => {
      if (button.classList.contains('selected')) {
        button.classList.remove('selected');
        button.style.backgroundColor = originalColor;
      } else {
        button.classList.add('selected');
        button.style.backgroundColor = 'red';
        }
      };
    });
  });

});

window.onload = function () {
  const container = document.getElementById("cause-container");
  const locationContainer = document.getElementById("location-container");

  causeOfDeathTile.forEach((cause) => {
    const btn = document.createElement("button");
    btn.className = "cell-button";
    btn.innerText = cause;

    btn.addEventListener("click", () => {
      const isSelected = !btn.classList.contains("selected");
      socket.emit("selectTile", {
      type: "cause", // hoặc "location"
      value: btn.innerText,
      selected: isSelected
      });
      btn.classList.toggle("selected");
    });
    container.appendChild(btn);
  });

  const flatLocations = locations.flat(); // giả sử danh sách locations là mảng lồng
  const totalCells = 24;
  const buttons = [];

  for (let i = 0; i < totalCells; i++) {
    const btn = document.createElement("button");
    btn.className = "cell-button";

    if (i < flatLocations.length) {
      btn.innerText = flatLocations[i];
    } else {
      btn.disabled = true; // giữ chỗ nhưng không dùng
      btn.style.visibility = "hidden"; // hoặc "visible" nếu bạn muốn giữ ô trống nhìn thấy
    }
  // Gán index hàng cho từng button
    btn.dataset.row = Math.floor(i / 6); // mỗi hàng có 6 cột → hàng = index / 6

    // Thêm sự kiện click
    btn.addEventListener("click", () => {
      const isSelected = !btn.classList.contains("selected");
      socket.emit("selectTile", {
        type: "location", 
        value: btn.innerText,
        selected: isSelected
      });
      btn.classList.toggle("selected");
      const selectedRow = btn.dataset.row;

      buttons.forEach(b => {
        if (b.dataset.row === selectedRow) {
          b.style.display = "inline-block"; // hiện
        } else {
          b.style.display = "none"; // ẩn
        }
      });
    });
    buttons.push(btn);
    locationContainer.appendChild(btn);
  }
}

socket.on("tileSelected", data => {
  const { type, value, selected } = data;

  let containerId = type === "cause" ? "cause-container" : "location-container";
  const container = document.getElementById(containerId);
  const buttons = container.querySelectorAll("button");

  buttons.forEach(btn => {
    if (btn.innerText === value) {
      if (selected) {
        btn.classList.add("selected");
      } else {
        btn.classList.remove("selected");
      }
    }
  });
});
