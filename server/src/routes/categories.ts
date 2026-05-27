import { Router, Response } from 'express';
import { getDb, saveDb } from '../database';
import { generateId, paginate, formatPaginated } from '../utils/helpers';

const router = Router();

// 获取分类列表
router.get('/', async (_req, res: Response) => {
  try {
    const db = await getDb();
    const result = db.exec(
      'SELECT * FROM categories ORDER BY sort_order ASC, id ASC'
    );
    const categories = result.length > 0
      ? result[0].values.map((row: any) => {
          const obj: Record<string, any> = {};
          result[0].columns.forEach((c: string, i: number) => { obj[c.toLowerCase()] = row[i]; });
          return obj;
        })
      : [];
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;