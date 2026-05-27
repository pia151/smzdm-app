import { Router, Response } from 'express';
import { getDb, saveDb } from '../database';
import { AuthRequest } from '../middleware/auth';
import { generateId } from '../utils/helpers';

const router = Router();

// 获取用户收藏列表
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const db = await getDb();
    const { page = '1', pageSize = '20' } = req.query;
    const limit = Math.min(Math.max(Number(pageSize), 1), 100);
    const offset = (Math.max(Number(page), 1) - 1) * limit;

    const countResult = db.exec(
      `SELECT COUNT(*) as total FROM favorites WHERE user_id = '${req.userId}'`
    );
    const total = countResult[0]?.values[0]?.[0] || 0;

    const dataResult = db.exec(
      `SELECT f.id as fav_id, f.created_at as fav_time,
              d.id, d.title, d.price, d.original_price, d.platform, d.platform_icon,
              d.image, d.like_count, d.comment_count, d.created_at
       FROM favorites f
       LEFT JOIN deals d ON f.deal_id = d.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.userId, limit, offset]
    );

    const data = dataResult.length > 0
      ? dataResult[0].values.map((row: any) => {
          const obj: Record<string, any> = {};
          dataResult[0].columns.forEach((c: string, i: number) => {
            const key = c.toLowerCase();
            obj[key] = row[i];
            // 计算折扣
            if (key === 'original_price' && obj.original_price > 0 && obj.price) {
              obj.discount_percent = Math.round((1 - obj.price / obj.original_price) * 100);
            }
          });
          return obj;
        })
      : [];

    res.json({
      data,
      total: Number(total),
      page: Number(page),
      pageSize: limit,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 添加收藏
router.post('/:type/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const { type, id } = req.params;
    if (!['deal', 'product'].includes(type)) {
      res.status(400).json({ error: '类型不正确' });
      return;
    }

    const db = await getDb();

    // 检查是否已收藏
    const checkField = type === 'deal' ? 'deal_id' : 'product_id';
    const existing = db.exec(
      `SELECT id FROM favorites WHERE user_id = ? AND ${checkField} = ?`,
      [req.userId, id]
    );
    if (existing.length > 0 && existing[0].values.length > 0) {
      // 取消收藏
      db.run(`DELETE FROM favorites WHERE ${checkField} = ? AND user_id = ?`, [id, req.userId]);
      saveDb();
      res.json({ favorited: false, message: '已取消收藏' });
      return;
    }

    // 添加收藏
    const favId = generateId();
    if (type === 'deal') {
      db.run('INSERT INTO favorites (id, user_id, deal_id) VALUES (?, ?, ?)', [favId, req.userId, id]);
    } else {
      db.run('INSERT INTO favorites (id, user_id, product_id) VALUES (?, ?, ?)', [favId, req.userId, id]);
    }
    saveDb();

    res.json({ favorited: true, message: '收藏成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;