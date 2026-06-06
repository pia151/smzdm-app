import { Router, Response } from 'express';
import { getDb, saveDb } from '../database';
import { AuthRequest, optionalAuth } from '../middleware/auth';
import { generateId } from '../utils/helpers';
import { searchMeituanDeals, getMtHotDeals } from '../utils/mt-union';

const router = Router();

interface MtDealItem {
  id: string;
  title: string;
  image: string;
  price: number;
  original_price: number;
  discount: number;
  sales: number;
  url: string;
  shop?: string;
  platform: string;
}

/**
 * 搜索美团
 * GET /api/meituan/search?q=关键词
 */
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const { q, page = '1', pageSize = '10' } = req.query;
    if (!q) {
      res.status(400).json({ error: '请提供搜索关键词' });
      return;
    }

    const keyword = String(q);
    const items = await searchMeituanDeals(keyword);

    const pageNum = Number(page);
    const size = Number(pageSize);
    const start = (pageNum - 1) * size;
    const paged = items.slice(start, start + size);

    res.json({
      data: paged,
      total: items.length,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(items.length / size),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '搜索失败' });
  }
});

/**
 * 获取美团热门
 * GET /api/meituan/hot
 */
router.get('/hot', async (_req, res: Response) => {
  try {
    const items = await getMtHotDeals();
    res.json({ data: items, total: items.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '获取失败' });
  }
});

/**
 * 获取美团分类列表
 * GET /api/meituan/categories
 */
router.get('/categories', async (_req, res: Response) => {
  const categories = [
    { id: 'food', name: '美食', icon: '🍜' },
    { id: 'hotel', name: '酒店', icon: '🏨' },
    { id: 'movie', name: '电影', icon: '🎬' },
    { id: 'spa', name: '休闲', icon: '💆' },
    { id: 'travel', name: '旅游', icon: '✈️' },
    { id: 'beauty', name: '丽人', icon: '💅' },
    { id: 'education', name: '教育', icon: '📚' },
    { id: 'medical', name: '医疗', icon: '🏥' },
  ];
  res.json({ data: categories });
});

/**
 * 将美团商品同步到值否数据库
 * POST /api/meituan/sync
 */
router.post('/sync', async (_req, res: Response) => {
  try {
    const db = await getDb();
    const allItems: MtDealItem[] = [];

    const categories = ['美食', '火锅', '奶茶', '酒店', '自助餐', '日料', '烧烤', '电影'];
    for (const cat of categories) {
      const items = await searchMeituanDeals(cat);
      allItems.push(...items);
      // 避免请求过于频繁
      await new Promise(r => setTimeout(r, 500));
    }

    let synced = 0;
    for (const item of allItems) {
      const existing = db.exec(
        "SELECT id FROM deals WHERE source_id = ?",
        [item.id]
      );
      if (existing.length > 0) continue;

      const now = new Date().toISOString();
      const dealId = generateId();
      db.run(
        `INSERT INTO deals (id, title, price, original_price, image, platform, category_id,
         source_id, source_url, status, like_count, comment_count, created_at, updated_at,
         user_id, description, discount_percent, is_hot)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 0, 0, ?, ?, 'system', ?, ?, 0)`,
        [
          dealId,
          item.title,
          item.price,
          item.original_price,
          item.image || '',
          '美团',
          null,
          item.id,
          item.url,
          now,
          now,
          item.shop || item.title,
          item.discount,
        ]
      );

      // 添加价格历史
      const priceId = generateId();
      db.run(
        "INSERT INTO price_history (id, product_id, price, recorded_at) VALUES (?, ?, ?, ?)",
        [priceId, dealId, item.price, now]
      );

      synced++;
    }

    await saveDb();
    res.json({ synced, total: allItems.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '同步失败' });
  }
});

export default router;