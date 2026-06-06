const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let players = {};   // socket.id => names

const fs = require('fs');
const path = require('path');

const evidences = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'evidences.json'), 'utf8'));
const weapons = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'weapons.json'), 'utf8'));
const { locations, causeOfDeathTile, eventTiles } = require('./data/data.js');
const chatHistoryPerPlayer = {};


let roles = {};     // socket.id => role
let playerItems = {}; // playerItems[socket.id] = { evidences: [], weapons: [] }
let murderSet = {};   // { evidence, weapon, murdererId }
let hostId = null;  // ai là host
let murdererConfirmed = false;
let gmId = null; // Game Master ID
let myId = null;
let selectedEvents = new Set();
let chatHistory = [];
let awaitingMurdererShot = false;
let includeAccomplice = false;
let reportedPlayerIds = new Set();
let gameEnded = false;

function getRequiredReporters() {
  return Object.keys(players).filter((id) => id !== gmId);
}

function endGameMurdererWinsAllWrongReports() {
  if (gameEnded) return;
  gameEnded = true;
  awaitingMurdererShot = false;

  const murdererName = players[murderSet.murdererId] || 'Không rõ';
  addSystemMessage('🏁 Ván đấu kết thúc! Tất cả người chơi (trừ Quản trò) đã tố cáo nhưng không ai đoán đúng.');
  addSystemMessage(`Phe Sát nhân thắng. Sát nhân là: ${murdererName}`);

  io.emit('game-ended', {
    winner: 'Murderer',
    reason: 'all-wrong-reports',
    murdererId: murderSet.murdererId,
    murdererName
  });
}

function checkAllReportsComplete() {
  const requiredReporters = getRequiredReporters();
  if (requiredReporters.length === 0) return;

  const allReported = requiredReporters.every((id) => reportedPlayerIds.has(id));
  if (allReported) {
    endGameMurdererWinsAllWrongReports();
  }
}

function broadcastPlayerList() {
  for (const id in players) {
    io.to(id).emit('player-list', {
      players,
      hostId,
      gmId,
      myId: id,
      includeAccomplice
    });
  }
}

function addSystemMessage(content) {
  const message = {
    sender: "Hệ thống",
    content: content,
    timestamp: new Date().toLocaleTimeString()
  };

  chatHistory.push(message);
  io.emit("chat-message", message);
  console.log(`System: ${content}`);
}


function pickRandomId(idList) {
  return idList[Math.floor(Math.random() * idList.length)];
}

function assignRoles() {
  const ids = Object.keys(players);
  if (ids.length < 3) {
    io.to(hostId).emit('message', 'Cần ít nhất 3 người chơi để bắt đầu!');
    return false;
  }

   // Reset
  roles = {};
  playerItems = {};
  murderSet = { murdererId: null, witnessId: null, accompliceId: null, evidence: null, weapon: null };
  murdererConfirmed = false;
  awaitingMurdererShot = false;
  reportedPlayerIds = new Set();
  gameEnded = false;

  // Loại GM khỏi danh sách phân vai
  const assignableIds = ids.filter(id => id !== gmId);
  const minAssignable = includeAccomplice ? 3 : 2;
  if (assignableIds.length < minAssignable) {
    const msg = includeAccomplice
      ? 'Cần tối thiểu 3 người được phân vai khi bật Tòng phạm (Sát nhân + Nhân chứng + Tòng phạm)!'
      : 'Cần tối thiểu 2 người được phân vai để có Sát nhân và Nhân chứng!';
    io.to(hostId).emit('message', msg);
    return false;
  }

  // Tạo danh sách bằng chứng và hung khí ngẫu nhiên
  const shuffledEvidences = evidences.slice().sort(() => 0.5 - Math.random());
  const shuffledWeapons = weapons.slice().sort(() => 0.5 - Math.random());

  // Phân phát cho mỗi người chơi 4 bằng chứng + 4 hung khí
  assignableIds.forEach((id, index) => {

    playerItems[id] = {
      evidences: shuffledEvidences.slice(index * 4, index * 4 + 4),
      weapons: shuffledWeapons.slice(index * 4, index * 4 + 4)
    };
  });

   // ✅ PHẢI khai báo murdererId TRƯỚC khi dùng nó
  const murdererId = pickRandomId(assignableIds);
  roles[murdererId] = 'Murderer';
  murderSet.murdererId = murdererId;

  // Bắt buộc 1 Nhân chứng; nếu host bật thì bắt buộc 1 Tòng phạm
  const nonMurdererIds = assignableIds.filter((id) => id !== murdererId);
  const witnessId = pickRandomId(nonMurdererIds);
  roles[witnessId] = 'Witness';
  murderSet.witnessId = witnessId;

  let remainingIds = nonMurdererIds.filter((id) => id !== witnessId);

  if (includeAccomplice) {
    if (remainingIds.length < 1) {
      io.to(hostId).emit('message', 'Không đủ người để phân vai Tòng phạm. Cần thêm người chơi (không tính Quản trò).');
      return false;
    }

    const accompliceId = pickRandomId(remainingIds);
    roles[accompliceId] = 'Accomplice';
    murderSet.accompliceId = accompliceId;
    remainingIds = remainingIds.filter((id) => id !== accompliceId);

    io.to(accompliceId).emit('accomplice-info', {
      murdererId,
      murdererName: players[murdererId]
    });
  } else {
    murderSet.accompliceId = null;
  }

  remainingIds.forEach((id) => {
    roles[id] = 'Investigator';
  });

  if (includeAccomplice) {
    const accompliceCount = Object.values(roles).filter((role) => role === 'Accomplice').length;
    if (accompliceCount !== 1 || !murderSet.accompliceId) {
      io.to(hostId).emit('message', 'Lỗi phân vai: ván bật Tòng phạm nhưng chưa có đúng 1 Tòng phạm.');
      return false;
    }
    addSystemMessage('Ván này đã có đúng 1 Tòng phạm (biết hung thủ).');
  }

  // Gửi dữ liệu riêng biệt cho từng người chơi
  ids.forEach(id => {
    const role = roles[id] || 'Quản trò'; // GM sẽ nhận là "Spectator"
    io.to(id).emit('role', role);

    if (playerItems[id]) {
      io.to(id).emit('your-items', playerItems[id]);
    }
  });

  // Gửi cho tất cả người chơi thông tin vụ án (chỉ là hung khí + bằng chứng, không biết của ai)
  io.emit('murder-info', {
    evidence: murderSet.evidence,
    weapon: murderSet.weapon
  });

  io.to(murdererId).emit('murderer-choose', {
  items: playerItems[murdererId]
  });

  io.to(witnessId).emit('witness-info', {
    murdererId,
    murdererName: players[murdererId]
  });

  // Gửi toàn bộ danh sách hung khí & bằng chứng của từng người cho tất cả
  ids.forEach(id => {
	io.to(id).emit('all-player-items', {
      allItems: playerItems,
      playerNames: players,
      myId: id
  	});
  });

  return true;
}

io.on('connection', (socket) => {
  console.log('🟢 Kết nối:', socket.id);

  socket.on('start-new-game', () => {
    if (socket.id !== hostId) return;
    awaitingMurdererShot = false;
    gameEnded = false;
    reportedPlayerIds = new Set();
    io.emit('reset-game');
  });

  socket.on('join', (name) => {
    players[socket.id] = name;

    // Gán host nếu là người đầu tiên
    if (!hostId) {
      hostId = socket.id;
      io.to(hostId).emit('you-are-host');
    }

    broadcastPlayerList();
  });

  socket.on('set-include-accomplice', (enabled) => {
    if (socket.id !== hostId) return;
    includeAccomplice = Boolean(enabled);
    broadcastPlayerList();
  });

  socket.on('set-gamemaster', (selectedId) => {
  	if (socket.id !== hostId) return; // chỉ host được set
  	if (!players[selectedId]) return; // kiểm tra người hợp lệ

  	gmId = selectedId;
    io.to(gmId).emit("you-are-gamemaster");

    broadcastPlayerList();
  });

  socket.on('start-game', (options = {}) => {
    if (socket.id !== hostId) return;

    if (typeof options.includeAccomplice === 'boolean') {
      includeAccomplice = options.includeAccomplice;
      broadcastPlayerList();
    }

    const assignableIds = Object.keys(players).filter((id) => id !== gmId);
    const minAssignable = includeAccomplice ? 3 : 2;
    if (Object.keys(players).length < 3) {
      io.to(hostId).emit('message', 'Cần ít nhất 3 người chơi để bắt đầu!');
      return;
    }
    if (assignableIds.length < minAssignable) {
      const msg = includeAccomplice
        ? 'Cần tối thiểu 3 người được phân vai khi bật Tòng phạm (Sát nhân + Nhân chứng + Tòng phạm)!'
        : 'Cần tối thiểu 2 người được phân vai để có Sát nhân và Nhân chứng!';
      io.to(hostId).emit('message', msg);
      return;
    }

    console.log('🔔 Host bắt đầu ván chơi', { includeAccomplice });
    awaitingMurdererShot = false;
    gameEnded = false;
    reportedPlayerIds = new Set();
    io.emit("new-round");
    io.emit('reset-game');

    // Lấy ngẫu nhiên 4 bằng chứng và 4 hung khí
    const selectedEvidences = evidences.slice().sort(() => 0.5 - Math.random()).slice(0, 4);
    const selectedWeapons = weapons.slice().sort(() => 0.5 - Math.random()).slice(0, 4);

    // Gửi xuống tất cả client để hiển thị
    io.emit('show-evidence-weapon', {
        evidences: selectedEvidences,
        weapons: selectedWeapons
    });
    assignRoles();
  });
  socket.on('murderer-selection', ({ evidence, weapon }) => {
  	// Kiểm tra có đúng là murderer không
  	if (!murderSet.murdererId || socket.id !== murderSet.murdererId) return;

  	// Lưu lại lựa chọn
  	murderSet.evidence = evidence;
  	murderSet.weapon = weapon;
  	murdererConfirmed = true;

  	// Gửi thông báo tới tất cả người chơi
  	addSystemMessage('🔒 Murderer đã chọn xong bằng chứng và hung khí!');
     const murdermessage = 
     `Hung thủ (${players[murderSet.murdererId]}) đã chọn:
    - Vũ khí: ${murderSet.weapon}
    - Bằng chứng: ${murderSet.evidence}`;
    io.to(gmId).emit("private-message", { message: murdermessage });

	//cho tuong tac vao bang
	io.emit('enable-interaction');
	// Thông báo riêng để ẩn nút xác nhận
  	io.to(socket.id).emit('confirm-button-hide');
  });

  socket.on("selectTile", data => {
    // Gửi lại cho tất cả người chơi (kể cả người gửi)
    io.emit("tileSelected", data);
  });
  socket.on("add-random-event", (event) => {
    const rowId = Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    // Gửi event đến tất cả client
    io.emit("new-event", {event,rowId});
  });

  socket.on("toggle-event", (eventItem) => {
    if (selectedEvents.has(eventItem)) {
      selectedEvents.delete(eventItem);
    } else {
      selectedEvents.add(eventItem);
    }

    io.emit("update-event-selection", Array.from(selectedEvents));
  });

  socket.on('update-report', (data) => {
    if (gameEnded) return;
    if (awaitingMurdererShot) return;
    if (!murdererConfirmed) return;
    if (socket.id === gmId) return;

    if (reportedPlayerIds.has(socket.id)) {
      io.to(socket.id).emit('message', 'Bạn đã tố cáo rồi.');
      return;
    }

    reportedPlayerIds.add(socket.id);

    console.log(`Người chơi ${socket.id} đã tố cáo với:`);
    console.log(`- Hung khí: ${data.weapon}`);
    console.log(`- Bằng chứng: ${data.evidence}`);

    // Gửi thông báo tố cáo đến tất cả người chơi
    console.log(`Người chơi ${players[socket.id]}`);
    const reportMessage = `Người chơi ${players[socket.id]} tố cáo: hung khí ${data.weapon}, bằng chứng ${data.evidence}`;
    console.log(reportMessage);
    addSystemMessage(reportMessage);

    const isCorrectAccusation =
      data.weapon === murderSet.weapon && data.evidence === murderSet.evidence;

    if (isCorrectAccusation) {
      gameEnded = true;
    } else {
      checkAllReportsComplete();
      return;
    }

    awaitingMurdererShot = true;
    addSystemMessage('🎯 Tố cáo chính xác! Trò chơi tạm kết thúc. Hung thủ phải chọn 1 người để bắn.');

    const shootableTargets = Object.keys(players)
      .filter((id) => {
        if (id === murderSet.murdererId) return false;
        if (id === gmId) return false;
        const role = roles[id];
        return role === 'Witness' || role === 'Investigator' || role === 'Accomplice';
      })
      .map((id) => ({ id, name: players[id], role: roles[id] }));

    io.to(murderSet.murdererId).emit('murderer-must-shoot', {
      targets: shootableTargets
    });
    io.emit('game-ended-awaiting-shot');
  });

  socket.on('murderer-shoot', ({ targetId }) => {
    if (!awaitingMurdererShot) return;
    if (socket.id !== murderSet.murdererId) return;
    if (!players[targetId]) return;
    if (targetId === murderSet.murdererId) return;

    awaitingMurdererShot = false;
    gameEnded = true;
    const shooterName = players[socket.id] || 'Hung thủ';
    const targetName = players[targetId] || 'Người chơi';
    const didHitWitness =
      targetId === murderSet.witnessId || roles[targetId] === 'Witness';
    const winner = didHitWitness ? 'Murderer' : 'Human';
    const winnerMessage = didHitWitness
      ? '💀 Sát nhân bắn trúng Nhân chứng. Sát nhân thắng!'
      : '🛡️ Sát nhân bắn trượt Nhân chứng. Phe người chơi thắng!';
    addSystemMessage(`💥 ${shooterName} đã bắn ${targetName}.`);
    addSystemMessage(winnerMessage);

    io.emit('murderer-shot-result', {
      shooterId: socket.id,
      shooterName,
      targetId,
      targetName,
      didHitWitness,
      winner
    });
  });

  socket.on("remove-event-row", (rowId) => {
    io.emit("remove-event-row", rowId); // Gửi cho tất cả
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    delete roles[socket.id];
    if (socket.id === hostId) {
      hostId = Object.keys(players)[0] || null;
      if (hostId) io.to(hostId).emit('you-are-host');
    }
    broadcastPlayerList();
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
