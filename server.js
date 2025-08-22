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


function assignRoles() {
  const ids = Object.keys(players);
  if (ids.length < 3) {
    io.to(hostId).emit('message', 'Cần ít nhất 3 người chơi để bắt đầu!');
    return;
  }

   // Reset
  roles = {};
  playerItems = {};
  murderSet = { murdererId: null, evidence: null, weapon: null };
  murdererConfirmed = false

  // Loại GM khỏi danh sách phân vai
  const assignableIds = ids.filter(id => id !== gmId);

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
  const murdererId = assignableIds[Math.floor(Math.random() * assignableIds.length)];
  roles[murdererId] = 'Murderer';
  murderSet.murdererId = murdererId;

  // Các người chơi còn lại là Investigator
  assignableIds.forEach(id => {
    if (id !== murdererId) roles[id] = 'Investigator';
  });

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

  // Gửi toàn bộ danh sách hung khí & bằng chứng của từng người cho tất cả
  ids.forEach(id => {
	io.to(id).emit('all-player-items', {
      allItems: playerItems,
      playerNames: players,
      murdererId: murdererId,
      myId: id
  	});
  });

}

io.on('connection', (socket) => {
  console.log('🟢 Kết nối:', socket.id);

  socket.on('join', (name) => {
    players[socket.id] = name;

    // Gán host nếu là người đầu tiên
    if (!hostId) {
      hostId = socket.id;
      io.to(hostId).emit('you-are-host');
    }

    for (const id in players) {
  		io.to(id).emit('player-list', {
    		players,
    		hostId,
    		gmId,
    		myId: id
  		});
	}
  });

  socket.on('set-gamemaster', (selectedId) => {
  	if (socket.id !== hostId) return; // chỉ host được set
  	if (!players[selectedId]) return; // kiểm tra người hợp lệ

  	gmId = selectedId;
    io.to(gmId).emit("you-are-gamemaster");

  // Gửi cập nhật danh sách người chơi cho tất cả
  	for (const id in players) {
    	io.to(id).emit('player-list', {
      	players,
      	hostId,
      	gmId,
      	myId: id
    	});
  	}
  });

  socket.on('start-game', () => {
    if (socket.id !== hostId) return;
    console.log('🔔 Host bắt đầu ván chơi');
    io.emit("new-round");

    socket.on('start-new-game', () => {
      io.emit('reset-game');
    });

    // Lấy ngẫu nhiên 4 bằng chứng và 4 hung khí
    const selectedEvidences = evidences.sort(() => 0.5 - Math.random()).slice(0, 4);
    const selectedWeapons = weapons.sort(() => 0.5 - Math.random()).slice(0, 4);

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
    console.log(`Người chơi ${socket.id} đã tố cáo với:`);
    console.log(`- Hung khí: ${data.weapon}`);
    console.log(`- Bằng chứng: ${data.evidence}`);

    // Gửi thông báo tố cáo đến tất cả người chơi
    console.log(`Người chơi ${players[socket.id]}`);
    reportMessage = `Người chơi ${players[socket.id]} tố cáo: hung khí ${data.weapon}, bằng chứng ${data.evidence}`;
    console.log(reportMessage);
    addSystemMessage(reportMessage);
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
    for (const id in players) {
      io.to(id).emit('player-list', {
        players,
        hostId,
        gmId,
        myId: id
      });
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
