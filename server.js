const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const port = process.env.PORT || 3000;

// Middleware phân tích body JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Đường dẫn file lưu trữ lời tâm sự
const DATA_DIR = path.join(__dirname, 'data');
const CONFESSIONS_FILE = path.join(DATA_DIR, 'confessions.json');

// Khởi tạo thư mục và dữ liệu mẫu nếu chưa có
function initConfessionsData() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONFESSIONS_FILE)) {
    const seedConfessions = [
      {
        id: 'conf_1',
        author: 'Ngôi Sao Lạc Lối',
        avatar: '🪐',
        mood: 'Áp lực thi cử 🌪️',
        content: 'Tuần này mình có 3 bài kiểm tra liền, cảm thấy hơi kiệt sức. Nhưng nhìn danh sách task trên Eduvia hoàn thành dần dần, mình lại có động lực bước tiếp. Mọi người cùng cố lên nhé!',
        timestamp: Date.now() - 3600000 * 2, // 2 giờ trước
        reactions: { heart: 12, hug: 18, star: 9, rocket: 7 }
      },
      {
        id: 'conf_2',
        author: 'Nhà Thám Hiểm Vũ Trụ',
        avatar: '🚀',
        mood: 'Vừa hoàn thành mục tiêu 🎉',
        content: 'Hôm nay vừa hoàn thành chuỗi 5 phiên Pomodoro không chạm vào điện thoại! Cảm giác đỗ được một thử thách thật tuyệt vời. Chúc mọi người một ngày học tập siêu năng suất!',
        timestamp: Date.now() - 3600000 * 6, // 6 giờ trước
        reactions: { heart: 24, hug: 5, star: 31, rocket: 20 }
      },
      {
        id: 'conf_3',
        author: 'Mèo Học Đêm',
        avatar: '✨',
        mood: 'Cần động lực ✨',
        content: 'Có ai đang thức ôn bài cùng mình không? Thấy thanh cấp bậc "Bản lĩnh" đang gần đạt được rồi, ráng nốt hôm nay mai nghỉ ngơi sau!',
        timestamp: Date.now() - 3600000 * 14, // 14 giờ trước
        reactions: { heart: 15, hug: 22, star: 14, rocket: 10 }
      }
    ];
    fs.writeFileSync(CONFESSIONS_FILE, JSON.stringify(seedConfessions, null, 2), 'utf8');
  }
}

initConfessionsData();

function readConfessions() {
  try {
    initConfessionsData();
    const data = fs.readFileSync(CONFESSIONS_FILE, 'utf8');
    return JSON.parse(data) || [];
  } catch (err) {
    console.error('Error reading confessions:', err);
    return [];
  }
}

function writeConfessions(confessions) {
  try {
    initConfessionsData();
    fs.writeFileSync(CONFESSIONS_FILE, JSON.stringify(confessions, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing confessions:', err);
    return false;
  }
}

// API: Lấy danh sách tâm sự (sắp xếp mới nhất lên đầu)
app.get('/api/confessions', (req, res) => {
  const confessions = readConfessions();
  // Sắp xếp thời gian giảm dần
  confessions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  res.json({ success: true, data: confessions });
});

// API: Đăng lời tâm sự mới
app.post('/api/confessions', (req, res) => {
  const { author, avatar, mood, content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: 'Nội dung tâm sự không được để trống.' });
  }

  const confessions = readConfessions();
  const newConfession = {
    id: 'conf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    author: (author && author.trim()) ? author.trim() : 'Người Bạn Vũ Trụ',
    avatar: avatar || '🌌',
    mood: mood || 'Tâm sự 💭',
    content: content.trim(),
    timestamp: Date.now(),
    reactions: { heart: 0, hug: 0, star: 0, rocket: 0 }
  };

  confessions.unshift(newConfession);
  writeConfessions(confessions);

  res.status(201).json({ success: true, data: newConfession });
});

// API: Thả cảm xúc cho tâm sự
app.post('/api/confessions/:id/react', (req, res) => {
  const { id } = req.params;
  const { type } = req.body; // 'heart' | 'hug' | 'star' | 'rocket'

  const validTypes = ['heart', 'hug', 'star', 'rocket'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ success: false, message: 'Loại cảm xúc không hợp lệ.' });
  }

  const confessions = readConfessions();
  const item = confessions.find(c => c.id === id);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lời tâm sự.' });
  }

  if (!item.reactions) {
    item.reactions = { heart: 0, hug: 0, star: 0, rocket: 0 };
  }

  item.reactions[type] = (item.reactions[type] || 0) + 1;
  writeConfessions(confessions);

  res.json({ success: true, data: item });
});

// Phục vụ tất cả các file tĩnh (HTML, CSS, JS) trong thư mục hiện tại
app.use(express.static(path.join(__dirname)));

// Gửi index.html làm giao diện chính cho các request không phải là file
app.get(/^[^\.]*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Chạy server lắng nghe tại tất cả các IP (0.0.0.0)
app.listen(port, '0.0.0.0', () => {
  console.log(`Eduvia server is running on port ${port}`);
});

