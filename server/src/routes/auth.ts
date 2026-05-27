import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../database';
import { generateToken, AuthRequest } from '../middleware/auth';
import { generateId } from '../utils/helpers';

const router = Router();

// 注册
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { phone, password, nickname } = req.body;
    if (!phone || !password || !nickname) {
      res.status(400).json({ error: '手机号、密码、昵称不能为空' });
      return;
    }
    if (!/^1\d{10}$/.test(phone)) {
      res.status(400).json({ error: '手机号格式不正确' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: '密码长度至少6位' });
      return;
    }

    const db = await getDb();
    const existing = db.exec(`SELECT id FROM users WHERE phone = '${phone}'`);
    if (existing.length > 0 && existing[0].values.length > 0) {
      res.status(409).json({ error: '该手机号已注册' });
      return;
    }

    const id = generateId();
    const hash = await bcrypt.hash(password, 10);
    const avatar = `https://api.dicebear.com/7.x/thumbs/svg?seed=${nickname}`;

    db.run(
      `INSERT INTO users (id, phone, nickname, password_hash, avatar) VALUES (?, ?, ?, ?, ?)`,
      [id, phone, nickname, hash, avatar]
    );
    saveDb();

    const token = generateToken(id);
    res.status(201).json({
      token,
      user: { id, phone, nickname, avatar, bio: '' },
    });
  } catch (err: any) {
    res.status(500).json({ error: '注册失败: ' + err.message });
  }
});

// 登录
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      res.status(400).json({ error: '手机号和密码不能为空' });
      return;
    }

    const db = await getDb();
    const result = db.exec(`SELECT * FROM users WHERE phone = '${phone}'`);
    if (result.length === 0 || result[0].values.length === 0) {
      res.status(401).json({ error: '手机号未注册' });
      return;
    }

    const row = result[0];
    const cols = row.columns.map((c: string) => c.toLowerCase());
    const vals = row.values[0];
    const user: Record<string, any> = {};
    cols.forEach((c: string, i: number) => { user[c] = vals[i]; });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: '密码错误' });
      return;
    }

    const token = generateToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: '登录失败: ' + err.message });
  }
});

// 获取用户信息
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const result = db.exec(`SELECT id, phone, nickname, avatar, bio, created_at FROM users WHERE id = '${req.userId}'`);
    if (result.length === 0 || result[0].values.length === 0) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const row = result[0];
    const cols = row.columns.map((c: string) => c.toLowerCase());
    const vals = row.values[0];
    const user: Record<string, any> = {};
    cols.forEach((c: string, i: number) => { user[c] = vals[i]; });

    // 统计
    const dealCount = db.exec(`SELECT COUNT(*) as c FROM deals WHERE user_id = '${req.userId}'`);
    const favCount = db.exec(`SELECT COUNT(*) as c FROM favorites WHERE user_id = '${req.userId}'`);

    res.json({
      ...user,
      deal_count: dealCount[0]?.values[0]?.[0] || 0,
      favorite_count: favCount[0]?.values[0]?.[0] || 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 更新个人资料
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const { nickname, bio, avatar } = req.body;
    const db = await getDb();
    const updates: string[] = [];
    const params: any[] = [];

    if (nickname) { updates.push("nickname = ?"); params.push(nickname); }
    if (bio !== undefined) { updates.push("bio = ?"); params.push(bio); }
    if (avatar) { updates.push("avatar = ?"); params.push(avatar); }

    if (updates.length === 0) {
      res.status(400).json({ error: '没有需要更新的字段' });
      return;
    }

    updates.push("updated_at = datetime('now','localtime')");
    params.push(req.userId);

    db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    saveDb();

    res.json({ message: '更新成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

import { saveDb } from '../database';

export default router;