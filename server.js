const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let players = {};   // socket.id => name
const evidences = [
    "Air Conditioning",
	"Ants",
	"Antique",
	"Apple",
	"Badge",
	"Bandage",
	"Banknote",
	"Bell",
	"Betting Chips",
	"Blood",
	"Bone",
	"Book",
	"Bracelet",
	"Bread",
	"Briefs",
	"Broom",
	"Bullet",
	"Button",
	"Cake",
	"Calender",
	"Candy",
	"Carton",
	"Cassette Tape",
	"Cat",
	"Certificate",
	"Chalk",
	"Cigar",
	"Cigarette Ash",
	"Cigarette Butt",
	"Cleaning Cloth",
	"Cockroach",
	"Coffee",
	"Coins",
	"Comics",
	"Computer",
	"Computer Disk",
	"Computer Mouse",
	"Confidential Letter",
	"Cosmetic Mask",
	"Cotton",
	"Cup",
	"Curtains",
	"Dentures",
	"Diamond",
	"Diary",
	"Dice",
	"Dictionary",
	"Dirt",
	"Documents",
	"Dog Fur",
	"Dust",
	"Earrings",
	"Eggs",
	"Electric Circuit",
	"Envelope",
	"Exam Paper",
	"Express Courier",
	"Fan",
	"Fax",
	"Fiber Optics",
	"Fingernails",
	"Flashlight",
	"Flip-Flop",
	"Flute ",
	"Flyer",
	"Food Ingredients",
	"Gear",
	"Gift",
	"Gloves",
	"Glue",
	"Graffiti",
	"Hair",
	"Hairpin",
	"Handcuffs",
	"Hanger",
	"Hat",
	"Headset",
	"Helmet",
	"Herbal Medicine",
	"High Heel",
	"Hourglass",
	"Ice",
	"ID Card",
	"Ink",
	"Insect",
	"Internet Cable",
	"Invitation Card",
	"IOU Note",
	"Iron",
	"IV Bag",
	"Jacket",
	"Jewelry",
	"Juice",
	"Key",
	"Leaf",
	"Leather Bag",
	"Leather Shoe",
	"Lens",
	"Light Bulb",
	"Lipstick",
	"Lock",
	"Lottery Ticket",
	"Love Letter",
	"Luggage",
	"Lunch Box",
	"Magazine",
	"Mahjong Tiles",
	"Map",
	"Mark",
	"Mask",
	"Maze",
	"Menu",
	"Mirror",
	"Mobile Phone",
	"Model",
	"Mosquito",
	"Mosquito Coil",
	"Nail",
	"Name Card",
	"Necklace",
	"Needle And Thread",
	"Newspaper",
	"Note",
	"Notebook",
	"Numbers",
	"Office Supplies",
	"Oil Painting",
	"Oil Stain",
	"Paint",
	"Panties",
	"Peanut",
	"Perfume",
	"Photograph",
	"Plant",
	"Plastic",
	"Playing Cards",
	"Pocket Watch",
	"Postal Stamp",
	"Powder",
	"Prescription",
	"Puppet",
	"Push Pin",
	"Puzzle",
	"Raincoat",
	"Rat",
	"Receipt",
	"Red Wine",
	"Riddle",
	"Ring",
	"Rose",
	"Rubber Stamp",
	"Sack",
	"Safety Pin",
	"Sand",
	"Sawdust",
	"Seasoning",
	"Signature",
	"Skull",
	"Snacks",
	"Soap",
	"Sock",
	"Soft Drink",
	"Speaker",
	"Specimen",
	"Spider",
	"Spinning Top",
	"Sponge",
	"Spring",
	"Steamed Buns",
	"Stockings",
	"Stuffed Toy",
	"Suit",
	"Sunglasses",
	"Surgical Mask",
	"Surveillance Camera",
	"Switch",
	"Syringe",
	"Table Lamp",
	"Take-Out",
	"Tattoo",
	"Tea Leaves",
	"Telephone",
	"Test Tube",
	"Tie",
	"Timber",
	"Tissue",
	"Tool Box",
	"Toothpicks",
	"Toy",
	"Toy Blocks",
	"Tweezers",
	"Umbrella",
	"Uniform",
	"USB Flash Drive",
	"Vegetables",
	"Video Camera",
	"Violin",
	"Wallet",
	"Watch",
	"Wig"
];
const weapons = [
    "Alcohol",
	"Amoeba",
	"Arsenic",
	"Arson",
	"Axe",
	"Bamboo Tip",
	"Bat",
	"Belt",
	"Bite And Tear",
	"Blender",
	"Blood Release",
	"Box Cutter",
	"Brick",
	"Bury",
	"Candlestick",
	"Chainsaw",
	"Chemicals",
	"Cleaver",
	"Crutch",
	"Dagger",
	"Dirty Water",
	"Dismember",
	"Drill",
	"Drown",
	"Dumbbell",
	"E-Bike",
	"Electric Baton",
	"Electric Current",
	"Explosives",
	"Folding Chair",
	"Gunpowder",
	"Hammer",
	"Hook",
	"Ice Skates",
	"Illegal Drug",
	"Injection",
	"Kerosene",
	"Kick",
	"Knife And Fork",
	"Lighter",
	"Liquid Drug",
	"Locked Room",
	"Machete",
	"Machine",
	"Mad Dog",
	"Match",
	"Mercury",
	"Metal Chain",
	"Metal Wire",
	"Overdose",
	"Packing Tape",
	"Pesticide",
	"Pill",
	"Pillow",
	"Pistol",
	"Plague",
	"Plastic Bag",
	"Poisonous Gas",
	"Poisonous Needle",
	"Potted Plant",
	"Powder Drug",
	"Punch",
	"Push",
	"Radiation",
	"Razor Blade",
	"Rope",
	"Scarf",
	"Scissors",
	"Sculpture",
	"Smoke",
	"Sniper",
	"Starvation",
	"Steel Tube",
	"Stone",
	"Sulfuric Acid",
	"Surgery",
	"Throat Slit",
	"Towel",
	"Trophy",
	"Trowel",
	"Unarmed",
	"Venomous Scorpion",
	"Venomous Snake",
	"Video Game Console",
	"Virus",
	"Whip",
	"Wine",
	"Wire",
	"Work",
	"Wrench"
];
let roles = {};     // socket.id => role
let playerItems = {}; // playerItems[socket.id] = { evidences: [], weapons: [] }
let murderSet = {};   // { evidence, weapon, murdererId }
let hostId = null;  // ai là host

function assignRoles() {
  const ids = Object.keys(players);
  if (ids.length < 3) {
    io.to(hostId).emit('message', 'Cần ít nhất 3 người chơi để bắt đầu!');
    return;
  }

   // Reset
  roles = {};
  playerItems = {};
  murderSet = {};

  // Tạo danh sách bằng chứng và hung khí ngẫu nhiên
  const shuffledEvidences = evidences.slice().sort(() => 0.5 - Math.random());
  const shuffledWeapons = weapons.slice().sort(() => 0.5 - Math.random());

  // Phân phát cho mỗi người chơi 4 bằng chứng + 4 hung khí
  ids.forEach((id, index) => {
    playerItems[id] = {
      evidences: shuffledEvidences.slice(index * 4, index * 4 + 4),
      weapons: shuffledWeapons.slice(index * 4, index * 4 + 4)
    };
  });

   // ✅ PHẢI khai báo murdererId TRƯỚC khi dùng nó
  const murdererId = ids[Math.floor(Math.random() * ids.length)];
  roles[murdererId] = 'Murderer';

  // Các người chơi còn lại là Investigator
  ids.forEach(id => {
    if (id !== murdererId) roles[id] = 'Investigator';
  });

  // Gửi dữ liệu riêng biệt cho từng người chơi
  ids.forEach(id => {
    io.to(id).emit('role', roles[id]);
    io.to(id).emit('your-items', playerItems[id]);
  });

  // Gửi cho tất cả người chơi thông tin vụ án (chỉ là hung khí + bằng chứng, không biết của ai)
  io.emit('murder-info', {
    evidence: murderSet.evidence,
    weapon: murderSet.weapon
  });

  // Gửi toàn bộ danh sách hung khí & bằng chứng của từng người cho tất cả
  io.emit('all-player-items', {
    allItems: playerItems,
    playerNames: players
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

    io.emit('player-list', Object.values(players));
  });

  socket.on('start-game', () => {
    if (socket.id !== hostId) return;
    console.log('🔔 Host bắt đầu ván chơi');
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

  socket.on('disconnect', () => {
    delete players[socket.id];
    delete roles[socket.id];
    if (socket.id === hostId) {
      hostId = Object.keys(players)[0] || null;
      if (hostId) io.to(hostId).emit('you-are-host');
    }
    io.emit('player-list', Object.values(players));
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
