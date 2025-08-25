const socket = io();
let myId = null;
let gmId = null;
let chatHistory = [];
let gmChatHistory = [];
function joinGame() {
  const name = document.getElementById('name').value;
  socket.emit('join', name);
}