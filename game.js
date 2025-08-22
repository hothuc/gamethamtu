const socket = io();
let myId = null;
let gmId = null;
let chatHistory = [];
let gmChatHistory = [];
function joinGame() {
  const name = document.getElementById('name').value;
  socket.emit('join', name);
}

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
        // Nếu là nút vũ khí
        if (button.dataset.type === 'weapon') {
          // Bỏ chọn vũ khí trước đó
          document.querySelectorAll('.interactive-btn[data-type="weapon"]').forEach(btn => {
            btn.classList.remove('selected');
            btn.style.backgroundColor = '#00FFFF';
          });
          // Chọn vũ khí mới
          button.classList.add('selected');
          button.style.backgroundColor = 'red';
          reportWeapon = button.innerText;
        }

        // Nếu là nút bằng chứng
        if (button.dataset.type === 'evidence') {
          // Bỏ chọn bằng chứng trước đó
          document.querySelectorAll('.interactive-btn[data-type="evidence"]').forEach(btn => {
            btn.classList.remove('selected');
            btn.style.backgroundColor = '#FFD700';
          });
          // Chọn bằng chứng mới
          button.classList.add('selected');
          button.style.backgroundColor = 'red';
          reportEvidence = button.innerText;
        }
      };
    });

    // Nút tố cáo
    const reportBtn = document.getElementById('report-btn');
    reportBtn.onclick = () => {
      if (!reportWeapon || !reportEvidence) {
        alert('Bạn phải chọn 1 hung khí và 1 bằng chứng trước khi tố cáo!');
        return;
      }

      // Gửi dữ liệu tố cáo lên server
      socket.emit('update-report', {
        weapon: reportWeapon,
        evidence: reportEvidence
      });

      // Sau khi tố cáo thì disable nút tố cáo để không spam
      reportBtn.disabled = true;
    };
  });

// Khi server reset game -> reset lại nút tố cáo
socket.on('reset-game', () => {
  document.getElementById('report-btn').disabled = false;
  selectedWeapon = null;
  selectedEvidence = null;
  document.querySelectorAll('.interactive-btn').forEach(button => {
    button.classList.remove('selected');
    button.style.backgroundColor = button.dataset.type === 'weapon' ? '#00FFFF' : '#FFD700';
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
  const reportButton = document.getElementById("report-button");
  if (!gmId) {
    reportButton.style.display = "inline-block";
  }
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
  addEventBtn.addEventListener("click", () => {
    if (myId !== gmId) return;

    const event = getRandomEvent();
    socket.emit("add-random-event", event);
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
  const chatBox = document.getElementById("gm-chat-log");
  const entry = document.createElement("div");
  entry.innerHTML = message.replace(/\n/g, "<br>");
  chatBox.appendChild(entry);
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

