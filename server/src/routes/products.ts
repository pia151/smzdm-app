import { Router, Response } from 'express';
import { getDb } from '../database';
import { paginate, formatPaginated } from '../utils/helpers';

const router = Router();

// 获取商品列表（支持分类筛选和搜索）
router.get('/', async (req, res: Response) => {
  try {
    const db = await getDb();
    const { page = '1', pageSize = '20', category, search, sort } = req.query;
    const { limit, offset } = paginate(Number(page), Number(pageSize));

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (category) {
      where += ' AND p.category_id = ?';
      params.push(Number(category));
    }
    if (search) {
      where += ' AND (p.title LIKE ? OR p.subtitle LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    let orderBy = 'ORDER BY p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'ORDER BY p.current_price ASC';
    else if (sort === 'price_desc') orderBy = 'ORDER BY p.current_price DESC';
    else if (sort === 'sales') orderBy = 'ORDER BY p.sales_count DESC';
    else if (sort === 'rating') orderBy = 'ORDER BY p.rating DESC';

    const countResult = db.exec(
      `SELECT COUNT(*) as total FROM products p ${where}`,
      params
    );
    const total = countResult[0]?.values[0]?.[0] || 0;

    const dataResult = db.exec(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${where} ${orderBy} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const data = dataResult.length > 0
      ? dataResult[0].values.map((row: any) => {
          const obj: Record<string, any> = {};
          dataResult[0].columns.forEach((c: string, i: number) => { obj[c.toLowerCase()] = row[i]; });
          return obj;
        })
      : [];

    res.json(formatPaginated(data, Number(total), Number(page), limit));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单个商品详情
router.get('/:id', async (req, res: Response) => {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      res.status(404).json({ error: '商品不存在' });
      return;
    }

    const row = result[0];
    const cols = row.columns.map((c: string) => c.toLowerCase());
    const vals = row.values[0];
    const product: Record<string, any> = {};
    cols.forEach((c: string, i: number) => { product[c] = vals[i]; });

    // 价格历史
    const priceHistory = db.exec(
      `SELECT price, recorded_at FROM price_history WHERE product_id = ? ORDER BY recorded_at ASC`,
      [req.params.id]
    );
    product.price_history = priceHistory.length > 0
      ? priceHistory[0].values.map((r: any) => ({
          price: r[0],
          date: r[1],
        }))
      : [];

    // 关联的好价
    const deals = db.exec(
      `SELECT d.id, d.title, d.price, d.original_price, d.platform, d.created_at,
              u.nickname, u.avatar
       FROM deals d
       LEFT JOIN users u ON d.user_id = u.id
       WHERE d.product_id = ? AND d.status = 'approved'
       ORDER BY d.created_at DESC LIMIT 10`,
      [req.params.id]
    );
    product.related_deals = deals.length > 0
      ? deals[0].values.map((r: any) => {
          const obj: Record<string, any> = {};
          deals[0].columns.forEach((c: string, i: number) => { obj[c.toLowerCase()] = r[i]; });
          return obj;
        })
      : [];

    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;