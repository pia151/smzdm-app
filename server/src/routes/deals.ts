import { Router, Response } from 'express';
import { getDb, saveDb } from '../database';
import { AuthRequest, optionalAuth } from '../middleware/auth';
import { generateId, paginate, formatPaginated } from '../utils/helpers';

const router = Router();

// 获取好价列表（首页信息流）
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const { page = '1', pageSize = '20', category, sort, platform, search } = req.query;
    const { limit, offset } = paginate(Number(page), Number(pageSize));

    let where = "WHERE d.status = 'approved'";
    const params: any[] = [];

    if (category) {
      where += ' AND d.category_id = ?';
      params.push(Number(category));
    }
    if (platform) {
      where += ' AND d.platform = ?';
      params.push(String(platform));
    }
    if (search) {
      where += ' AND d.title LIKE ?';
      params.push(`%${search}%`);
    }

    let orderBy = 'ORDER BY d.created_at DESC';
    if (sort === 'hot') orderBy = 'ORDER BY d.like_count DESC, d.comment_count DESC';
    else if (sort === 'price_asc') orderBy = 'ORDER BY d.price ASC';
    else if (sort === 'price_desc') orderBy = 'ORDER BY d.price DESC';

    const countResult = db.exec(
      `SELECT COUNT(*) as total FROM deals d ${where}`,
      params
    );
    const total = countResult[0]?.values[0]?.[0] || 0;

    const dataResult = db.exec(
      `SELECT d.*, u.nickname, u.avatar,
              c.name as category_name
       FROM deals d
       LEFT JOIN users u ON d.user_id = u.id
       LEFT JOIN categories c ON d.category_id = c.id
       ${where} ${orderBy} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    let deals: any[] = [];
    if (dataResult.length > 0) {
      const cols = dataResult[0].columns.map((c: string) => c.toLowerCase());
      deals = dataResult[0].values.map((row: any) => {
        const obj: Record<string, any> = {};
        cols.forEach((c: string, i: number) => { obj[c] = row[i]; });

        // 计算折扣百分比
        if (obj.original_price && obj.original_price > 0) {
          obj.discount_percent = Math.round((1 - obj.price / obj.original_price) * 100);
        }

        // 检查是否收藏
        obj.is_favorited = false;

        return obj;
      });
    }

    // 批量查询收藏状态
    if (req.userId && deals.length > 0) {
      const dealIds = deals.map((d: any) => `'${d.id}'`).join(',');
      const favResult = db.exec(
        `SELECT deal_id FROM favorites WHERE user_id = '${req.userId}' AND deal_id IN (${dealIds})`
      );
      if (favResult.length > 0) {
        const favIds = new Set(favResult[0].values.map((r: any) => r[0]));
        deals.forEach((d: any) => {
          if (favIds.has(d.id)) d.is_favorited = true;
        });
      }
    }

    res.json(formatPaginated(deals, Number(total), Number(page), limit));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单个好价详情
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT d.*, u.nickname, u.avatar, u.id as user_id,
              c.name as category_name
       FROM deals d
       LEFT JOIN users u ON d.user_id = u.id
       LEFT JOIN categories c ON d.category_id = c.id
       WHERE d.id = ?`,
      [req.params.id]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      res.status(404).json({ error: '好价不存在' });
      return;
    }

    const row = result[0];
    const cols = row.columns.map((c: string) => c.toLowerCase());
    const vals = row.values[0];
    const deal: Record<string, any> = {};
    cols.forEach((c: string, i: number) => { deal[c] = vals[i]; });

    if (deal.original_price && deal.original_price > 0) {
      deal.discount_percent = Math.round((1 - deal.price / deal.original_price) * 100);
    }

    // 收藏状态
    deal.is_favorited = false;
    if (req.userId) {
      const favCheck = db.exec(
        `SELECT id FROM favorites WHERE user_id = '${req.userId}' AND deal_id = '${deal.id}'`
      );
      if (favCheck.length > 0 && favCheck[0].values.length > 0) {
        deal.is_favorited = true;
      }
    }

    // 评论列表
    const comments = db.exec(
      `SELECT dc.*, u.nickname, u.avatar
       FROM deal_comments dc
       LEFT JOIN users u ON dc.user_id = u.id
       WHERE dc.deal_id = ?
       ORDER BY dc.created_at DESC LIMIT 50`,
      [req.params.id]
    );
    deal.comments = comments.length > 0
      ? comments[0].values.map((r: any) => {
          const obj: Record<string, any> = {};
          comments[0].columns.forEach((c: string, i: number) => { obj[c.toLowerCase()] = r[i]; });
          return obj;
        })
      : [];

    res.json(deal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 提交好价（用户爆料）
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const { title, content, price, original_price, platform, platform_icon, source_url, coupon_info, image, category_id } = req.body;

    if (!title || !price) {
      res.status(400).json({ error: '标题和价格不能为空' });
      return;
    }

    const db = await getDb();
    const id = generateId();

    db.run(
      `INSERT INTO deals (id, user_id, title, content, price, original_price, platform, platform_icon,
        source_url, coupon_info, image, category_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
      [id, req.userId, title, content || '', Number(price),
       Number(original_price || 0), platform || '', platform_icon || '',
       source_url || '', coupon_info || '', image || '',
       category_id || null]
    );
    saveDb();

    res.status(201).json({ id, message: '爆料成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 点赞/取消点赞好价
router.post('/:id/like', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const db = await getDb();
    // 简单增减（生产环境需要去重）
    db.run(
      `UPDATE deals SET like_count = like_count + 1 WHERE id = ?`,
      [req.params.id]
    );
    saveDb();

    res.json({ message: '点赞成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;