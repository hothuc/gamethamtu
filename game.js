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
let includeAccomplice = false;
let hostSettingsInitialized = false;
let gmPlayerRoles = {};

const ROLE_LABELS = {
  Murderer: 'Sát nhân',
  Witness: 'Nhân chứng',
  Accomplice: 'Tòng phạm',
  Investigator: 'Điều tra viên',
  'Quản trò': 'Quản trò'
};

function getRoleLabel(role) {
  return ROLE_LABELS[role] || role;
}

const GM_VISIBLE_ROLES = new Set(['Murderer', 'Witness', 'Accomplice']);

function buildGmRoleSummary(rolesByPlayer, players) {
  const filteredRoles = {};
  const lines = ['🔐 Phân vai ván này:'];

  Object.entries(rolesByPlayer || {}).forEach(([id, role]) => {
    if (!GM_VISIBLE_ROLES.has(role)) return;
    filteredRoles[id] = role;
    const name = players?.[id] || 'Người chơi';
    lines.push(`- ${name}: ${getRoleLabel(role)}`);
  });

  return { filteredRoles, message: lines.join('\n') };
}

function clearGmInternalChat() {
  gmChatHistory = [];
  gmPlayerRoles = {};
  const chatBox = document.getElementById('gm-chat-log');
  if (!chatBox) return;
  chatBox.innerHTML = '<h4>Lịch sử nội bộ</h4>';
}

function showGmInternalChat() {
  const chatBox = document.getElementById('gm-chat-log');
  if (chatBox) chatBox.style.display = 'block';
}

function appendGmInternalMessage(message) {
  gmChatHistory.push(message);
  showGmInternalChat();
  const chatBox = document.getElementById('gm-chat-log');
  if (!chatBox) return;
  const entry = document.createElement('div');
  entry.classList.add('gm-internal-entry');
  entry.innerHTML = message.replace(/\n/g, '<br>');
  chatBox.appendChild(entry);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function renderPlayerList(players) {
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

    if (myId === hostId) {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = (id === gmId);
      checkbox.onclick = () => {
        socket.emit('set-gamemaster', id);
      };
      playerLine.appendChild(checkbox);
    }

    if (id === gmId) {
      const gmLabel = document.createElement('span');
      gmLabel.innerText = '🎲 Quản trò';
      playerLine.appendChild(gmLabel);
    }

    if (myId === gmId && gmPlayerRoles[id] && gmPlayerRoles[id] !== 'Investigator') {
      const roleLabel = document.createElement('span');
      roleLabel.style.fontWeight = 'bold';
      roleLabel.style.color = '#8b0000';
      roleLabel.innerText = `[${getRoleLabel(gmPlayerRoles[id])}]`;
      playerLine.appendChild(roleLabel);
    }

    playersDiv.appendChild(playerLine);
  }

  const eventBtn = document.getElementById('add-event-btn');
  if (myId === gmId) {
    eventBtn.style.display = 'inline-block';
  } else {
    eventBtn.style.display = 'none';
  }
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
  const eventContainer = document.getElementById('event-container');
  if (eventContainer) eventContainer.innerHTML = '';
}

function joinGame() {
  const name = document.getElementById('name').value;
  socket.emit('join', name);
}

function getIncludeAccompliceChoice() {
  const accompCheckbox = document.getElementById('include-accomplice-checkbox');
  return accompCheckbox ? accompCheckbox.checked : includeAccomplice;
}

function startGame() {
  const withAccomplice = getIncludeAccompliceChoice();
  includeAccomplice = withAccomplice;
  socket.emit('start-game', { includeAccomplice: withAccomplice });
}

window.joinGame = joinGame;
window.startGame = startGame;

socket.on('player-list', ({ players, hostId: hId, gmId: serverGmId, myId: clientId, includeAccomplice: serverIncludeAccomplice }) => {
  hostId = hId;
  gmId = serverGmId;
  myId = clientId;
  if (typeof serverIncludeAccomplice === 'boolean') {
    includeAccomplice = serverIncludeAccomplice;
  }

  const accompCheckbox = document.getElementById('include-accomplice-checkbox');
  if (accompCheckbox) accompCheckbox.checked = includeAccomplice;

  renderPlayerList(players);
});



socket.on('you-are-gamemaster', () => {
  showGmInternalChat();
});

socket.on('role', (role) => {
  currentRole = role;
  document.getElementById('role').innerText = `🎭 Vai trò của bạn: ${getRoleLabel(role)}`;
});

function ensureHostSettingsUI() {
  if (hostSettingsInitialized) return;
  hostSettingsInitialized = true;

  const hostNote = document.createElement('div');
  hostNote.id = 'host-note';
  hostNote.innerText = '👑 Bạn là người điều khiển (host)';
  document.body.appendChild(hostNote);

  const settings = document.createElement('div');
  settings.id = 'host-settings';
  settings.style.margin = '8px 0';

  const accompLabel = document.createElement('label');
  accompLabel.style.display = 'flex';
  accompLabel.style.alignItems = 'center';
  accompLabel.style.gap = '8px';

  const accompCheckbox = document.createElement('input');
  accompCheckbox.type = 'checkbox';
  accompCheckbox.id = 'include-accomplice-checkbox';
  accompCheckbox.checked = includeAccomplice;
  accompCheckbox.addEventListener('change', () => {
    socket.emit('set-include-accomplice', accompCheckbox.checked);
  });

  const accompText = document.createElement('span');
  accompText.innerText = 'Thêm vai Tòng phạm (biết hung thủ)';

  accompLabel.appendChild(accompCheckbox);
  accompLabel.appendChild(accompText);
  settings.appendChild(accompLabel);
  document.body.appendChild(settings);

  const btn = document.createElement('button');
  btn.id = 'host-start-btn';
  btn.innerText = '🔔 Bắt đầu ván chơi';
  btn.onclick = () => startGame();
  document.body.appendChild(btn);
}

socket.on('you-are-host', () => {
  ensureHostSettingsUI();
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

function isBrownCategoryLabel(text) {
  return /^Brown(\(|$)/i.test(String(text).trim());
}

function getDisplayableEventItems(eventArray) {
  return eventArray.filter((item) => !isBrownCategoryLabel(item));
}

socket.on("new-event", ({event: eventArray, rowId}) => {
  const container = document.getElementById("event-container");
  const rowDiv = document.createElement("div");
  rowDiv.classList.add("event-row");
  rowDiv.dataset.rowId = rowId;

  const displayItems = getDisplayableEventItems(eventArray);

  displayItems.forEach((eventItem) => {
    const btn = document.createElement("button");
    btn.innerText = eventItem;
    btn.classList.add("event-btn");
    if (eventItem.length > 50) {
      btn.classList.add("event-btn-long");
    }

    btn.addEventListener("click", () => {
      if (myId !== gmId) return;
      btn.classList.toggle("selected");
      socket.emit("toggle-event", eventItem);
    });

    rowDiv.appendChild(btn);
  });

  if (myId === gmId) {
    const removeBtn = document.createElement("button");
    removeBtn.innerText = "X";
    removeBtn.classList.add("remove-row-btn");

    removeBtn.addEventListener("click", () => {
      socket.emit("remove-event-row", rowId);
    });

    rowDiv.appendChild(removeBtn);
  }

  container.appendChild(rowDiv);
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
    socket.emit("add-random-event");
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
  if (myId !== gmId) return;
  appendGmInternalMessage(message);
});

socket.on('gm-role-summary', ({ rolesByPlayer, players }) => {
  if (myId !== gmId) return;
  const { filteredRoles, message } = buildGmRoleSummary(rolesByPlayer, players);
  gmPlayerRoles = filteredRoles;
  appendGmInternalMessage(message);
  if (players) renderPlayerList(players);
});

function notifyMurdererIdentity(roleLabel, murdererName) {
  alert(`🕵️ Bạn là ${roleLabel}. Hung thủ là: ${murdererName}`);
  addChatMessage("Hệ thống", `Bạn là ${roleLabel}. Hung thủ là: ${murdererName}`);
}

socket.on("witness-info", ({ murdererName }) => {
  notifyMurdererIdentity('Nhân chứng', murdererName);
});

socket.on("accomplice-info", ({ murdererName }) => {
  notifyMurdererIdentity('Tòng phạm', murdererName);
});

function disableReportButton() {
  const reportBtn = document.getElementById("report-btn");
  if (reportBtn) reportBtn.disabled = true;
}

socket.on("game-ended-awaiting-shot", () => {
  disableReportButton();
});

socket.on("game-ended", ({ winner, reason, murdererName }) => {
  disableReportButton();
  const shootPanel = document.getElementById("shoot-panel");
  if (shootPanel) shootPanel.remove();

  if (reason === 'all-wrong-reports' && winner === 'Murderer') {
    alert(`🏁 Ván đấu kết thúc!\nTất cả tố cáo đều sai. Phe Sát nhân thắng.\nSát nhân là: ${murdererName}`);
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
    ? "Phe sát nhân thắng vì đã bắn trúng Nhân chứng."
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

