import { Router, Response } from 'express';
import { getDb, saveDb } from '../database';
import { AuthRequest } from '../middleware/auth';
import { generateId } from '../utils/helpers';

const router = Router();

// 获取评论
router.get('/:dealId', async (req, res: Response) => {
  try {
    const db = await getDb();
    const { dealId } = req.params;

    const result = db.exec(
      `SELECT dc.*, u.nickname, u.avatar
       FROM deal_comments dc
       LEFT JOIN users u ON dc.user_id = u.id
       WHERE dc.deal_id = ?
       ORDER BY dc.created_at DESC LIMIT 100`,
      [dealId]
    );

    const comments = result.length > 0
      ? result[0].values.map((row: any) => {
          const obj: Record<string, any> = {};
          result[0].columns.forEach((c: string, i: number) => { obj[c.toLowerCase()] = row[i]; });
          return obj;
        })
      : [];

    res.json(comments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 发表评论
router.post('/:dealId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const { dealId } = req.params;
    const { content, parent_id } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: '评论内容不能为空' });
      return;
    }

    const db = await getDb();
    const id = generateId();

    db.run(
      `INSERT INTO deal_comments (id, deal_id, user_id, content, parent_id) VALUES (?, ?, ?, ?, ?)`,
      [id, dealId, req.userId, content.trim(), parent_id || null]
    );

    // 更新好价的评论数
    db.run(`UPDATE deals SET comment_count = comment_count + 1 WHERE id = ?`, [dealId]);
    saveDb();

    res.status(201).json({ id, message: '评论成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;