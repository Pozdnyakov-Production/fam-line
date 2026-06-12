// server/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors({ origin: 'https://Pozdnyakov-Production.github.io' }));
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'family_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Маппинг userId -> socket.id
const userSockets = {};

// Безопасный парсинг JSON (может быть строка или уже объект)
const parseJSON = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val; // уже объект/массив
};

// Middleware аутентификации
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Нет токена' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: 'Неверный токен' });
  }
};

// ================= AUTH =================
app.post('/api/auth/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ error: 'Введите логин/телефон и пароль' });

  const [rows] = await pool.query(
    `SELECT id, username, first_name AS firstName, last_name AS lastName,
            phone, email, birth_date AS birthDate, avatar, must_change_password
     FROM users WHERE username = ? OR phone = ?`,
    [login, login]
  );
  if (rows.length === 0) return res.status(401).json({ error: 'Неверный логин/телефон или пароль' });
  const user = rows[0];

  const [pwdRow] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [user.id]);
  const valid = await bcrypt.compare(password, pwdRow[0].password_hash);
  if (!valid) return res.status(401).json({ error: 'Неверный логин/телефон или пароль' });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  res.json({ user, token });
});

app.post('/api/auth/register', async (req, res) => {
  const { firstName, lastName, password } = req.body;
  if (!firstName || !lastName || !password) {
    return res.status(400).json({ error: 'Имя, фамилия и пароль обязательны' });
  }

  const hashed = await bcrypt.hash(password, 10);

  const tempUsername = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const [userResult] = await pool.query(
    'INSERT INTO users (username, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)',
    [tempUsername, hashed, firstName, lastName]
  );
  const userId = userResult.insertId;

  const permanentUsername = `fam_user${userId}`;
  await pool.query('UPDATE users SET username = ? WHERE id = ?', [permanentUsername, userId]);

  const familyName = `Семья ${firstName}`;
  const [familyResult] = await pool.query(
    'INSERT INTO families (name, owner_id) VALUES (?, ?)',
    [familyName, userId]
  );
  const familyId = familyResult.insertId;

  await pool.query(
    'INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)',
    [familyId, userId, 'owner']
  );

  const [roomResult] = await pool.query(
    'INSERT INTO chat_rooms (name, type, family_id, created_by) VALUES (?, "family", ?, ?)',
    [`${familyName} (Семья)`, familyId, userId]
  );
  await pool.query('INSERT INTO chat_room_members (room_id, user_id) VALUES (?, ?)', [roomResult.insertId, userId]);

  const [newUser] = await pool.query(
    `SELECT id, username, first_name AS firstName, last_name AS lastName,
            phone, email, birth_date AS birthDate, avatar, created_at AS createdAt
     FROM users WHERE id = ?`,
    [userId]
  );

  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

  res.json({
    user: newUser[0],
    token,
    isNewUser: false,
    family: {
      id: familyId,
      name: familyName,
      ownerId: userId,
      members: [{ id: userId, firstName, lastName, username: permanentUsername, role: 'owner', status: 'approved' }],
    },
  });
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, username, first_name AS firstName, last_name AS lastName,
            phone, email, birth_date AS birthDate, avatar, created_at AS createdAt
     FROM users WHERE id = ?`,
    [req.userId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json({ user: rows[0] });
});

// ================= FAMILY =================
app.get('/api/family/current', authenticate, async (req, res) => {
  const [memberRow] = await pool.query(
    'SELECT f.* FROM families f JOIN family_members fm ON f.id = fm.family_id WHERE fm.user_id = ?',
    [req.userId]
  );
  if (!memberRow.length) return res.json(null);
  const family = memberRow[0];
  const [members] = await pool.query(
    `SELECT u.id, u.first_name AS firstName, u.last_name AS lastName, u.username, fm.role, fm.status
     FROM users u
     JOIN family_members fm ON u.id = fm.user_id
     WHERE fm.family_id = ?`,
    [family.id]
  );
  res.json({ ...family, members });
});

app.put('/api/family/name', authenticate, async (req, res) => {
  const { name } = req.body;
  const [member] = await pool.query(
    'SELECT family_id, role FROM family_members WHERE user_id = ? AND role = "owner"',
    [req.userId]
  );
  if (!member.length) return res.status(403).json({ error: 'Только владелец может менять название' });
  await pool.query('UPDATE families SET name = ? WHERE id = ?', [name, member[0].family_id]);
  res.json({ success: true });
});

app.put('/api/family/member/:userId', authenticate, async (req, res) => {
  const { role } = req.body;
  const [member] = await pool.query(
    'SELECT family_id, role FROM family_members WHERE user_id = ?',
    [req.userId]
  );
  if (!member.length || (member[0].role !== 'owner' && member[0].role !== 'parent')) {
    return res.status(403).json({ error: 'Нет прав на смену ролей' });
  }
  const familyId = member[0].family_id;
  await pool.query('UPDATE family_members SET role = ? WHERE family_id = ? AND user_id = ?', [role, familyId, req.params.userId]);
  res.json({ success: true });
});

app.delete('/api/family/member/:userId', authenticate, async (req, res) => {
  const [member] = await pool.query(
    'SELECT family_id, role FROM family_members WHERE user_id = ?',
    [req.userId]
  );
  if (!member.length || (member[0].role !== 'owner' && member[0].role !== 'parent')) {
    return res.status(403).json({ error: 'Нет прав на удаление' });
  }
  const familyId = member[0].family_id;
  await pool.query('DELETE FROM family_members WHERE family_id = ? AND user_id = ?', [familyId, req.params.userId]);
  res.json({ success: true });
});

app.get('/api/users/family', authenticate, async (req, res) => {
  const [memberRow] = await pool.query('SELECT family_id FROM family_members WHERE user_id = ?', [req.userId]);
  if (!memberRow.length) return res.json([]);
  const [members] = await pool.query(
    `SELECT u.id, u.first_name AS firstName, u.last_name AS lastName, u.username, u.phone, u.email, u.avatar, fm.role
     FROM users u
     JOIN family_members fm ON u.id = fm.user_id
     WHERE fm.family_id = ?`,
    [memberRow[0].family_id]
  );
  res.json(members);
});

app.post('/api/family/add-child', authenticate, async (req, res) => {
  const { firstName, lastName, phone } = req.body;
  if (!firstName || !lastName || !phone) {
    return res.status(400).json({ error: 'Имя, фамилия и телефон обязательны' });
  }

  const [memberRow] = await pool.query(
    'SELECT family_id FROM family_members WHERE user_id = ? AND role IN ("owner","parent","grandparent")',
    [req.userId]
  );
  if (!memberRow.length) return res.status(403).json({ error: 'Нет прав на добавление детей' });

  const familyId = memberRow[0].family_id;

  const tempUsername = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const tempPassword = Math.random().toString(36).slice(-8);
  const hashed = await bcrypt.hash(tempPassword, 10);

  const [existingPhone] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
  if (existingPhone.length > 0) return res.status(400).json({ error: 'Пользователь с таким телефоном уже существует' });

  const [userResult] = await pool.query(
    'INSERT INTO users (username, password_hash, first_name, last_name, phone, must_change_password) VALUES (?, ?, ?, ?, ?, TRUE)',
    [tempUsername, hashed, firstName, lastName, phone]
  );
  const userId = userResult.insertId;

  const permanentUsername = `fam_user${userId}`;
  await pool.query('UPDATE users SET username = ? WHERE id = ?', [permanentUsername, userId]);

  await pool.query(
    'INSERT INTO family_members (family_id, user_id, role, status) VALUES (?, ?, "child", "approved")',
    [familyId, userId]
  );

  const [roomRow] = await pool.query(
    'SELECT id FROM chat_rooms WHERE family_id = ? AND type = "family"',
    [familyId]
  );
  if (roomRow.length) {
    await pool.query('INSERT INTO chat_room_members (room_id, user_id) VALUES (?, ?)', [roomRow[0].id, userId]);
  }

  res.json({ userId, username: permanentUsername, tempPassword, firstName, lastName });
});

// ================= TASKS =================
app.get('/api/tasks', authenticate, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT t.id, t.family_id AS familyId, t.creator_id AS creatorId, t.assignee_id AS assigneeId,
            t.title, t.description, t.bonus, t.status, t.deadline, t.created_at AS createdAt,
            t.result, t.resultPhoto, t.review_comment AS reviewComment
     FROM tasks t
     JOIN family_members fm ON t.family_id = fm.family_id
     WHERE fm.user_id = ?`,
    [req.userId]
  );
  res.json(rows);
});

app.post('/api/tasks', authenticate, async (req, res) => {
  const { assigneeId, title, description, bonus, deadline } = req.body;
  const [memberRow] = await pool.query(
    'SELECT family_id, role FROM family_members WHERE user_id = ? AND role IN ("owner","parent","grandparent")',
    [req.userId]
  );
  if (!memberRow.length) return res.status(403).json({ error: 'Нет прав на создание задач' });

  const [assigneeInFamily] = await pool.query(
    'SELECT 1 FROM family_members WHERE family_id = ? AND user_id = ?',
    [memberRow[0].family_id, assigneeId]
  );
  if (!assigneeInFamily.length) return res.status(400).json({ error: 'Назначаемый пользователь не в вашей семье' });

  const [result] = await pool.query(
    'INSERT INTO tasks (family_id, creator_id, assignee_id, title, description, bonus, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [memberRow[0].family_id, req.userId, assigneeId, title, description, bonus, deadline || null]
  );

  const [newTask] = await pool.query(
    `SELECT id, family_id AS familyId, creator_id AS creatorId, assignee_id AS assigneeId,
            title, description, bonus, status, deadline, created_at AS createdAt,
            result, resultPhoto, review_comment AS reviewComment
     FROM tasks WHERE id = ?`, [result.insertId]
  );

  const familyRoom = `family:${memberRow[0].family_id}`;
  const creatorSocketId = userSockets[req.userId];
  if (creatorSocketId) {
    io.to(familyRoom).except(creatorSocketId).emit('task:created', newTask[0]);
  } else {
    io.to(familyRoom).emit('task:created', newTask[0]);
  }

  res.json(newTask[0]);
});

app.put('/api/tasks/:id/status', authenticate, async (req, res) => {
  const { status, reviewComment } = req.body;
  const updateFields = ['status = ?'];
  const params = [status];

  if (reviewComment !== undefined) {
    updateFields.push('review_comment = ?');
    params.push(reviewComment);
  }
  params.push(req.params.id);

  await pool.query(`UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`, params);

  const [task] = await pool.query(
    'SELECT family_id AS familyId, assignee_id AS assigneeId, bonus, creator_id AS creatorId FROM tasks WHERE id = ?',
    [req.params.id]
  );

  if (task.length) {
    const familyRoom = `family:${task[0].familyId}`;
    io.to(familyRoom).emit('task:statusChanged', {
      taskId: req.params.id,
      newStatus: status,
      reviewComment,
    });

    if (status === 'done') {
      await pool.query(
        'INSERT INTO bonus_transactions (user_id, family_id, type, amount, related_task_id) VALUES (?, ?, "earn", ?, ?)',
        [task[0].assigneeId, task[0].familyId, task[0].bonus, req.params.id]
      );
      io.to(familyRoom).emit('bonus:updated', {
        userId: task[0].assigneeId,
        amount: task[0].bonus,
      });
    }
  }

  res.json({ success: true });
});

app.put('/api/tasks/:id/result', authenticate, async (req, res) => {
  const { result } = req.body;
  await pool.query('UPDATE tasks SET result = ?, status = ? WHERE id = ?', [result, 'in_review', req.params.id]);
  const [task] = await pool.query('SELECT family_id AS familyId FROM tasks WHERE id = ?', [req.params.id]);
  if (task.length) {
    io.to(`family:${task[0].familyId}`).emit('task:resultSubmitted', { taskId: req.params.id, result, status: 'in_review' });
  }
  res.json({ success: true });
});

// ================= NOTES =================
app.get('/api/notes', authenticate, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM notes WHERE user_id = ?', [req.userId]);
  res.json(rows);
});

app.post('/api/notes', authenticate, async (req, res) => {
  const { date, text } = req.body;
  const [result] = await pool.query('INSERT INTO notes (user_id, date, text) VALUES (?, ?, ?)', [req.userId, date, text]);
  res.json({ id: result.insertId, ...req.body });
});

app.delete('/api/notes/:id', authenticate, async (req, res) => {
  await pool.query('DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ success: true });
});

// ================= BONUSES =================
app.get('/api/bonuses/transactions', authenticate, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM bonus_transactions WHERE user_id = ?', [req.userId]);
  res.json(rows);
});

app.post('/api/bonuses/transactions', authenticate, async (req, res) => {
  const { userId, familyId, type, amount, relatedTaskId } = req.body;
  const effectiveUserId = userId || req.userId;
  const [result] = await pool.query(
    'INSERT INTO bonus_transactions (user_id, family_id, type, amount, related_task_id) VALUES (?, ?, ?, ?, ?)',
    [effectiveUserId, familyId, type, amount, relatedTaskId || null]
  );
  const [newTx] = await pool.query('SELECT * FROM bonus_transactions WHERE id = ?', [result.insertId]);
  res.json(newTx[0]);
});

app.post('/api/bonuses/withdraw', authenticate, async (req, res) => {
  const { amount } = req.body;
  const [famRow] = await pool.query(
    'SELECT f.id, f.is_bank_open FROM families f JOIN family_members fm ON f.id = fm.family_id WHERE fm.user_id = ?',
    [req.userId]
  );
  if (!famRow.length || !famRow[0].is_bank_open) return res.status(403).json({ error: 'Банк закрыт' });
  await pool.query('INSERT INTO bonus_transactions (user_id, family_id, type, amount) VALUES (?, ?, "withdraw", ?)',
    [req.userId, famRow[0].id, amount]
  );
  res.json({ success: true });
});

app.post('/api/bonuses/appeal/:id', authenticate, async (req, res) => {
  await pool.query('UPDATE bonus_transactions SET status = "appealed" WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ success: true });
});

// ================= POSTS =================
app.get('/api/posts', authenticate, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*,
      (SELECT JSON_ARRAYAGG(user_id) FROM likes WHERE post_id = p.id) AS likes,
      (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', c.id, 'userId', c.user_id, 'text', c.text, 'date', c.created_at)) FROM comments c WHERE c.post_id = p.id) AS comments,
      (SELECT JSON_OBJECTAGG(user_id, reaction) FROM reactions WHERE post_id = p.id) AS reactions
     FROM posts p
     WHERE p.family_id IN (SELECT family_id FROM family_members WHERE user_id = ?) OR p.author_id = ?`,
    [req.userId, req.userId]
  );

  const safePosts = rows.map(p => ({
    ...p,
    likes: parseJSON(p.likes) || [],
    comments: parseJSON(p.comments) || [],
    reactions: parseJSON(p.reactions) || {},
  }));

  res.json(safePosts);
});

app.post('/api/posts', authenticate, async (req, res) => {
  const { text, familyId } = req.body;
  const [result] = await pool.query('INSERT INTO posts (author_id, family_id, text) VALUES (?, ?, ?)', [req.userId, familyId, text]);
  res.json({ id: result.insertId, authorId: req.userId, text, likes: [], comments: [], reactions: {} });
});

app.delete('/api/posts/:id', authenticate, async (req, res) => {
  await pool.query('DELETE FROM posts WHERE id = ? AND author_id = ?', [req.params.id, req.userId]);
  res.json({ success: true });
});

app.post('/api/posts/:id/like', authenticate, async (req, res) => {
  const { id } = req.params;
  const [existing] = await pool.query('SELECT id FROM likes WHERE post_id = ? AND user_id = ?', [id, req.userId]);
  if (existing.length) {
    await pool.query('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [id, req.userId]);
  } else {
    await pool.query('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [id, req.userId]);
  }
  res.json({ success: true });
});

app.post('/api/posts/:id/comment', authenticate, async (req, res) => {
  const { text } = req.body;
  const [result] = await pool.query('INSERT INTO comments (post_id, user_id, text) VALUES (?, ?, ?)', [req.params.id, req.userId, text]);
  res.json({ id: result.insertId, userId: req.userId, text, date: new Date().toISOString() });
});

app.post('/api/posts/:id/reaction', authenticate, async (req, res) => {
  const { reaction } = req.body;
  await pool.query('INSERT INTO reactions (post_id, user_id, reaction) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE reaction = ?',
    [req.params.id, req.userId, reaction, reaction]);
  res.json({ success: true });
});

// ================= CHAT =================
app.get('/api/chat/rooms', authenticate, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT cr.* FROM chat_rooms cr
     JOIN chat_room_members crm ON cr.id = crm.room_id
     WHERE crm.user_id = ?`,
    [req.userId]
  );
  res.json(rows);
});

app.post('/api/chat/rooms', authenticate, async (req, res) => {
  const { name, memberIds } = req.body;
  if (!name || !memberIds || !Array.isArray(memberIds)) {
    return res.status(400).json({ error: 'Название и список участников обязательны' });
  }

  const [result] = await pool.query('INSERT INTO chat_rooms (name, type, created_by) VALUES (?, "custom", ?)', [name, req.userId]);
  const roomId = result.insertId;

  await pool.query('INSERT INTO chat_room_members (room_id, user_id) VALUES (?, ?)', [roomId, req.userId]);
  for (const userId of memberIds) {
    if (userId !== req.userId) {
      await pool.query('INSERT INTO chat_room_members (room_id, user_id) VALUES (?, ?)', [roomId, userId]);
    }
  }

  res.json({ id: roomId, name, type: 'custom', members: [req.userId, ...memberIds] });
});

app.post('/api/chat/direct', authenticate, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId обязателен' });

  const [existing] = await pool.query(
    `SELECT cr.id FROM chat_rooms cr
     JOIN chat_room_members crm1 ON cr.id = crm1.room_id AND crm1.user_id = ?
     JOIN chat_room_members crm2 ON cr.id = crm2.room_id AND crm2.user_id = ?
     WHERE cr.type = 'direct'`,
    [req.userId, userId]
  );

  if (existing.length) {
    return res.json({ id: existing[0].id });
  }

  const [result] = await pool.query(
    'INSERT INTO chat_rooms (type, created_by) VALUES ("direct", ?)',
    [req.userId]
  );
  const roomId = result.insertId;
  await pool.query('INSERT INTO chat_room_members (room_id, user_id) VALUES (?, ?), (?, ?)', [roomId, req.userId, roomId, userId]);
  res.json({ id: roomId });
});

app.get('/api/chat/direct/:userId', authenticate, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT cr.id FROM chat_rooms cr
     JOIN chat_room_members crm1 ON cr.id = crm1.room_id AND crm1.user_id = ?
     JOIN chat_room_members crm2 ON cr.id = crm2.room_id AND crm2.user_id = ?
     WHERE cr.type = 'direct'`,
    [req.userId, req.params.userId]
  );
  if (rows.length === 0) return res.json(null);
  res.json({ id: rows[0].id });
});

app.get('/api/chat/messages/:roomId', authenticate, async (req, res) => {
  const roomId = req.params.roomId;
  const [member] = await pool.query(
    'SELECT 1 FROM chat_room_members WHERE room_id = ? AND user_id = ?',
    [roomId, req.userId]
  );
  if (!member.length) return res.status(403).json({ error: 'Нет доступа к комнате' });

  const [rows] = await pool.query(
    `SELECT id, room_id AS roomId, user_id AS userId, text, created_at AS date
     FROM chat_messages WHERE room_id = ? ORDER BY created_at ASC`,
    [roomId]
  );
  res.json(rows);
});

app.post('/api/chat/messages', authenticate, async (req, res) => {
  const { roomId, text } = req.body;
  const [member] = await pool.query(
    'SELECT 1 FROM chat_room_members WHERE room_id = ? AND user_id = ?',
    [roomId, req.userId]
  );
  if (!member.length) return res.status(403).json({ error: 'Нет доступа к комнате' });

  const [result] = await pool.query(
    'INSERT INTO chat_messages (room_id, user_id, text) VALUES (?, ?, ?)',
    [roomId, req.userId, text]
  );

  const [newMessage] = await pool.query(
    `SELECT id, room_id AS roomId, user_id AS userId, text, created_at AS date
     FROM chat_messages WHERE id = ?`, [result.insertId]
  );

  // Рассылаем сообщение всем участникам, КРОМЕ отправителя
  const [members] = await pool.query('SELECT user_id FROM chat_room_members WHERE room_id = ?', [roomId]);
  for (const { user_id } of members) {
    if (user_id !== req.userId) {
      const targetSocketId = userSockets[user_id];
      if (targetSocketId) {
        io.to(targetSocketId).emit('chat:message', newMessage[0]);
      }
    }
  }

  res.json(newMessage[0]);
});

// ================= NOTIFICATIONS =================
app.get('/api/notifications', authenticate, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
  res.json(rows);
});

app.put('/api/notifications/read-all', authenticate, async (req, res) => {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.userId]);
  res.json({ success: true });
});

app.post('/api/notifications', authenticate, async (req, res) => {
  const { userId, message } = req.body;
  if (!userId || !message) return res.status(400).json({ error: 'userId и message обязательны' });

  const [result] = await pool.query(
    'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
    [userId, message]
  );
  const [newNotif] = await pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);

  const targetSocketId = userSockets[userId];
  if (targetSocketId) {
    io.to(targetSocketId).emit('notification:new', newNotif[0]);
  }

  res.json(newNotif[0]);
});

// ================= SEARCH =================
app.get('/api/users/search', authenticate, async (req, res) => {
  const { firstName, lastName, phone, email } = req.query;
  let query = `SELECT id, first_name AS firstName, last_name AS lastName, username, phone, email FROM users WHERE id != ?`;
  const params = [req.userId];
  if (firstName) { query += ' AND first_name LIKE ?'; params.push(`%${firstName}%`); }
  if (lastName) { query += ' AND last_name LIKE ?'; params.push(`%${lastName}%`); }
  if (phone) { query += ' AND phone LIKE ?'; params.push(`%${phone}%`); }
  if (email) { query += ' AND email LIKE ?'; params.push(`%${email}%`); }
  const [rows] = await pool.query(query, params);
  res.json(rows);
});

// ================= SOCKET.IO =================
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Нет токена'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Неверный токен'));
  }
});

io.on('connection', async (socket) => {
  console.log(`Пользователь ${socket.userId} подключился`);
  userSockets[socket.userId] = socket.id;

  const [member] = await pool.query('SELECT family_id FROM family_members WHERE user_id = ?', [socket.userId]);
  if (member.length) {
    socket.join(`family:${member[0].family_id}`);
  }
  socket.join(`user:${socket.userId}`);

  socket.on('join:family', async () => {
    const [m] = await pool.query('SELECT family_id FROM family_members WHERE user_id = ?', [socket.userId]);
    if (m.length) {
      socket.join(`family:${m[0].family_id}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Пользователь ${socket.userId} отключился`);
    delete userSockets[socket.userId];
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`API running on port ${PORT}`));