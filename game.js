const socket = io();
let myId = null;
let gmId = null;
let hostId = null;
let chatHistory = [];
let gmChatHistory = [];
let reportWeapon = null;
let reportEvidence = null;
let selectedWeapon = null;
let selectedEvidence = null;
let currentRole = null;

function clearGmInternalChat() {
  gmChatHistory = [];
  const chatBox = document.getElementById('gm-chat-log');
  if (!chatBox) return;
  chatBox.innerHTML = '<h4>Lịch sử nội bộ</h4>';
}

function resetReportUI() {
  const reportBtn = document.getElementById('report-btn');
  if (reportBtn) reportBtn.disabled = false;
  reportWeapon = null;
  reportEvidence = null;
  selectedWeapon = null;
  selectedEvidence = null;
  document.querySelectorAll('.interactive-btn').forEach((button) => {
    button.classList.remove('selected');
    button.style.backgroundColor = button.dataset.type === 'weapon' ? '#00FFFF' : '#FFD700';
  });
  const shootPanel = document.getElementById('shoot-panel');
  if (shootPanel) shootPanel.remove();
  const oldConfirmBtn = document.getElementById('confirmBtn');
  if (oldConfirmBtn) oldConfirmBtn.remove();
  clearGmInternalChat();
}

function joinGame() {
  const name = document.getElementById('name').value;
  socket.emit('join', name);
}

function startGame() {
  socket.emit('start-game');
}

window.joinGame = joinGame;
window.startGame = startGame;

socket.on('player-list', ({  players, hostId: hId, gmId: serverGmId, myId: clientId }) => {
  hostId = hId;
  gmId = serverGmId;
  myId = clientId;
  
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
  const eventBtn = document.getElementById("add-event-btn");
    if (myId === gmId) {
      eventBtn.style.display = "inline-block";
    } else {
      eventBtn.style.display = "none";
    }
});



socket.on('role', (role) => {
  currentRole = role;
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

socket.on('new-round', resetReportUI);
socket.on('reset-game', resetReportUI);

socket.on('all-player-items', ({ allItems, playerNames, myId: payloadMyId }) => {
  resetReportUI();

  const oldTable = document.getElementById('playerItemGrid');
  if (oldTable) oldTable.remove();

  const table = document.createElement('table');
  table.id = 'playerItemGrid';

  const title = document.createElement('h2');
  // title.innerText = '📋 Danh sách hung khí & bằng chứng';
  // document.body.appendChild(title);
  document.body.appendChild(table);

  selectedWeapon = null;
  selectedEvidence = null;

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

      if (currentRole === 'Murderer' && (myId === id || payloadMyId === id)) {
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

      if (currentRole === 'Murderer' && (myId === id || payloadMyId === id)) {
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
  if (currentRole === 'Murderer') {
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
  } else {
    console.log('[debug] confirmBtn hidden because not murderer', {
      globalMyId: myId,
      payloadMyId,
      currentRole
    });
  }

  function updateConfirmBtn() {
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
      confirmBtn.disabled = !(selectedWeapon && selectedEvidence);
    }
  }
});

window.onload = function () {
  const container = document.getElementById("cause-container");
  const locationContainer = document.getElementById("location-container");

  causeOfDeathTile.forEach((cause) => {
    const btn = document.createElement("button");
    btn.className = "cell-button";
    btn.innerText = cause;

    btn.addEventListener("click", () => {
      if (myId !== gmId) return;
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
      if (myId !== gmId) return;
      const isSelected = !btn.classList.contains("selected");
      const selectedRow = btn.dataset.row;

      socket.emit("selectTile", {
        type: "location",
        value: btn.innerText,
        selected: isSelected,
        row: selectedRow   // 👈 Gửi thêm chỉ số hàng
      });

      btn.classList.toggle("selected");

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
  const { type, value, selected, row } = data;

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

    if (type === "location") {
      if (selected) {
        if (btn.dataset.row === row) {
          btn.style.display = "inline-block"; // hiện hàng được chọn
        } else {
          btn.style.display = "none"; // ẩn hàng khác
        }
      } else {
        // 🔁 Nếu bỏ chọn => hiện lại toàn bộ
        btn.style.display = "inline-block";
      }
    }
  });
  const reportButton = document.getElementById("report-btn");
  if (reportButton && myId !== gmId) {
    reportButton.style.display = "inline-block";
  }
});

socket.on('enable-interaction', () => {
  reportWeapon = null;
  reportEvidence = null;

  document.querySelectorAll('.interactive-btn').forEach(button => {
    button.onclick = () => {
      if (button.dataset.type === 'weapon') {
        document.querySelectorAll('.interactive-btn[data-type="weapon"]').forEach(btn => {
          btn.classList.remove('selected');
          btn.style.backgroundColor = '#00FFFF';
        });
        button.classList.add('selected');
        button.style.backgroundColor = 'red';
        reportWeapon = button.innerText;
      }

      if (button.dataset.type === 'evidence') {
        document.querySelectorAll('.interactive-btn[data-type="evidence"]').forEach(btn => {
          btn.classList.remove('selected');
          btn.style.backgroundColor = '#FFD700';
        });
        button.classList.add('selected');
        button.style.backgroundColor = 'red';
        reportEvidence = button.innerText;
      }
    };
  });
});

function getRandomEvent() {
  const index = Math.floor(Math.random() * eventTiles.length);
  return eventTiles[index];
}

socket.on("new-event", ({event: eventArray,rowId}) => {
  const container = document.getElementById("event-container");
  const groupSize = 8;
  for (let i = 0; i < eventArray.length; i += groupSize) {
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("event-row");
    rowDiv.dataset.rowId = rowId; // Đánh dấu index hàng

    const group = eventArray.slice(i, i + groupSize);
    
    group.forEach((eventItem) => {
      const btn = document.createElement("button");
      btn.innerText = eventItem;
      btn.classList.add("event-btn");

      btn.addEventListener("click", () => {
        if (myId !== gmId) return;
        btn.classList.toggle("selected");
        socket.emit("toggle-event", eventItem);
      });

      rowDiv.appendChild(btn);
    });

    // Thêm nút X để xóa hàng
    if (myId === gmId) {
      const removeBtn = document.createElement("button");
      removeBtn.innerText = "X";
      removeBtn.classList.add("remove-row-btn");

      removeBtn.addEventListener("click", () => {
        socket.emit("remove-event-row", rowId); // Gửi index dòng cần xóa
      });

      rowDiv.appendChild(removeBtn);
    }

    container.appendChild(rowDiv);
  }
});

socket.on("remove-event-row", (rowId) => {
  const allRows = document.querySelectorAll(".event-row");
  allRows.forEach(row => {
    if (row.dataset.rowId === rowId) {
      row.remove();
    }
  });
});


document.addEventListener("DOMContentLoaded", () => {
  const addEventBtn = document.getElementById("add-event-btn");
  const reportBtn = document.getElementById("report-btn");
  addEventBtn.addEventListener("click", () => {
    if (myId !== gmId) return;

    const event = getRandomEvent();
    socket.emit("add-random-event", event);
  });
  reportBtn.addEventListener("click", () => {
    if (!reportWeapon || !reportEvidence) {
      alert('Bạn phải chọn 1 hung khí và 1 bằng chứng trước khi tố cáo!');
      return;
    }

    socket.emit('update-report', {
      weapon: reportWeapon,
      evidence: reportEvidence
    });

    reportBtn.disabled = true;
  });
  socket.on("you-are-gamemaster", () => {
    console.log("Bạn là Quản trò (GM)!");
    document.getElementById("gm-chat-log").style.display = "block";
  });
  
});

socket.on("toggle-event", (eventItem) => {
  const buttons = document.querySelectorAll("#event-container .event-btn");
  buttons.forEach((btn) => {
    if (btn.innerText === eventItem) {
      btn.classList.toggle("selected");
    }
  });
});

socket.on("update-event-selection", (selectedEvents) => {
  const buttons = document.querySelectorAll(".event-btn");

  buttons.forEach((btn) => {
    if (selectedEvents.includes(btn.innerText)) {
      btn.classList.add("selected");
    } else {
      btn.classList.remove("selected");
    }
  });
});


function renderChatHistory() {
  const chatContainer = document.getElementById("chatLog");
  chatContainer.innerHTML = ""; // clear cũ

  chatHistory.forEach(msg => {
    const div = document.createElement("div");
    div.classList.add("chat-message");
    div.textContent = `[${msg.timestamp}] ${msg.sender}: ${msg.content}`;
    chatContainer.appendChild(div);
  });

  // Tự động cuộn xuống dòng mới nhất
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Gọi khi có chat mới
function addChatMessage(sender, content) {
  const message = {
    sender,
    content,
    timestamp: new Date().toLocaleTimeString()
  };
  chatHistory.push(message);
  renderChatHistory();
}

socket.on("chat-message", ({ sender, content }) => {
  addChatMessage(sender, content);
});

socket.on("private-message", ({ message }) => {
  gmChatHistory.push(message);
  const chatBox = document.getElementById("gm-chat-log");
  const entry = document.createElement("div");
  entry.innerHTML = message.replace(/\n/g, "<br>");
  chatBox.appendChild(entry);
});

socket.on("witness-info", ({ murdererName }) => {
  alert(`🕵️ Bạn là Nhân chứng. Hung thủ là: ${murdererName}`);
  addChatMessage("Hệ thống", `Bạn là Nhân chứng. Hung thủ là: ${murdererName}`);
});

socket.on("game-ended-awaiting-shot", () => {
  const reportBtn = document.getElementById("report-btn");
  if (reportBtn) {
    reportBtn.disabled = true;
  }
});

socket.on("murderer-must-shoot", ({ targets }) => {
  if (!Array.isArray(targets) || targets.length === 0) {
    alert("Không có mục tiêu hợp lệ để bắn.");
    return;
  }

  const oldPanel = document.getElementById("shoot-panel");
  if (oldPanel) oldPanel.remove();

  const panel = document.createElement("div");
  panel.id = "shoot-panel";
  panel.style.border = "2px solid #c0392b";
  panel.style.padding = "12px";
  panel.style.margin = "12px 0";
  panel.style.borderRadius = "8px";
  panel.style.backgroundColor = "#fff5f5";

  const title = document.createElement("h3");
  title.innerText = "💥 Chọn 1 người để bắn";
  panel.appendChild(title);

  const note = document.createElement("p");
  note.innerText = "Bạn là hung thủ. Hãy chọn chính xác 1 mục tiêu.";
  panel.appendChild(note);

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.flexWrap = "wrap";
  actions.style.gap = "8px";

  targets.forEach((target) => {
    const btn = document.createElement("button");
    btn.classList.add("cell-button");
    btn.innerText = `Bắn ${target.name}`;
    btn.addEventListener("click", () => {
      socket.emit("murderer-shoot", { targetId: target.id });
      panel.remove();
    });
    actions.appendChild(btn);
  });

  panel.appendChild(actions);
  document.body.appendChild(panel);
});

socket.on("murderer-shot-result", ({ shooterName, targetName, didHitWitness, winner }) => {
  const panel = document.getElementById("shoot-panel");
  if (panel) panel.remove();
  const murdererWins = winner === 'Murderer' || didHitWitness === true;
  const resultMessage = murdererWins
    ? "Sát nhân thắng vì đã bắn trúng Nhân chứng."
    : "Phe người chơi thắng vì sát nhân không bắn trúng Nhân chứng.";
  alert(`${shooterName} đã bắn ${targetName}. ${resultMessage}`);
});

// const reportButton = document.getElementById("report-button");

// reportButton.addEventListener("click", () => {
//   const confirm = window.confirm("Bạn có chắc muốn tố cáo người chơi này?");
//   if (confirm) {
//     // Giả sử bạn muốn gửi report đến server
//     socket.emit("report-player", { reporterId: playerId });
//     reportButton.disabled = true;
//     reportButton.textContent = "Đã tố cáo"; // Cập nhật giao diện
//     // Thông báo lại người chơi
//     alert("Đã gửi tố cáo đến quản trò.");
//   }
// });

// socket.on("new-round", () => {
//   const reportButton = document.getElementById("report-button");
//   if (!isGM && reportButton) {
//     reportButton.disabled = false;
//     reportButton.textContent = "🚨 Tố cáo";
//     reportButton.style.backgroundColor = ""; // Reset màu nếu bạn có đổi màu
//     reportButton.style.cursor = "pointer";
//   }
// });

