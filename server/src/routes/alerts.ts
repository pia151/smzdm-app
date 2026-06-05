import { Router, Response } from 'express';
import { getDb, saveDb } from '../database';
import { AuthRequest } from '../middleware/auth';
import { generateId } from '../utils/helpers';

const router = Router();

// ============================================
// 价格提醒 API
// ============================================

/**
 * 创建价格提醒
 * POST /api/alerts
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const { title, url, platform, target_price, current_price, product_id, deal_id } = req.body;

    if (!title || !target_price) {
      res.status(400).json({ error: '标题和目标价格不能为空' });
      return;
    }

    const db = await getDb();
    const id = generateId();

    db.run(
      `INSERT INTO price_alerts 
       (id, user_id, title, url, platform, target_price, current_price, last_check_price, product_id, deal_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.userId, title, url || '', platform || '', 
       Number(target_price), Number(current_price || 0), Number(current_price || 0),
       product_id || null, deal_id || null]
    );
    saveDb();

    res.status(201).json({ id, message: '价格提醒创建成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 获取我的价格提醒列表
 * GET /api/alerts
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const db = await getDb();
    const { status } = req.query;

    let where = `WHERE user_id = '${req.userId}'`;
    if (status === 'active') where += " AND is_active = 1 AND is_triggered = 0";
    else if (status === 'triggered') where += ' AND is_triggered = 1';

    const result = db.exec(`
      SELECT * FROM price_alerts 
      ${where}
      ORDER BY created_at DESC
    `);

    let alerts: any[] = [];
    if (result.length > 0) {
      const cols = result[0].columns.map((c: string) => c.toLowerCase());
      alerts = result[0].values.map((row: any) => {
        const obj: Record<string, any> = {};
        cols.forEach((c: string, i: number) => { obj[c] = row[i]; });
        // 计算差距
        if (obj.current_price > 0) {
          obj.drop_amount = Math.round((obj.current_price - obj.target_price) * 100) / 100;
          obj.drop_percent = Math.round((1 - obj.target_price / obj.current_price) * 100);
        }
        return obj;
      });
    }

    // 统计
    const stats = db.exec(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_triggered = 1 THEN 1 ELSE 0 END) as triggered,
        SUM(CASE WHEN is_active = 1 AND is_triggered = 0 THEN 1 ELSE 0 END) as active
      FROM price_alerts WHERE user_id = '${req.userId}'
    `);

    const statsData = stats.length > 0 ? {
      total: stats[0].values[0][0] || 0,
      triggered: stats[0].values[0][1] || 0,
      active: stats[0].values[0][2] || 0,
    } : { total: 0, triggered: 0, active: 0 };

    res.json({ alerts, stats: statsData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 更新价格提醒状态
 * PATCH /api/alerts/:id
 */
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const { id } = req.params;
    const { target_price, is_active } = req.body;

    const db = await getDb();

    // 验证归属
    const check = db.exec(
      `SELECT id FROM price_alerts WHERE id = ? AND user_id = ?`,
      [id, req.userId]
    );
    if (check.length === 0 || check[0].values.length === 0) {
      res.status(404).json({ error: '提醒不存在' });
      return;
    }

    if (target_price !== undefined) {
      db.run(`UPDATE price_alerts SET target_price = ? WHERE id = ?`, [Number(target_price), id]);
    }
    if (is_active !== undefined) {
      db.run(`UPDATE price_alerts SET is_active = ? WHERE id = ?`, [is_active ? 1 : 0, id]);
    }

    saveDb();
    res.json({ message: '更新成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 删除价格提醒
 * DELETE /api/alerts/:id
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const { id } = req.params;
    const db = await getDb();

    db.run(`DELETE FROM price_alerts WHERE id = ? AND user_id = ?`, [id, req.userId]);
    saveDb();

    res.json({ message: '已删除' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 批量检查价格（定时任务调用）
 * POST /api/alerts/check-all
 */
router.post('/check-all', async (_req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();

    // 获取所有活跃提醒
    const activeAlerts = db.exec(`
      SELECT * FROM price_alerts 
      WHERE is_active = 1 AND is_triggered = 0
    `);

    if (activeAlerts.length === 0 || activeAlerts[0].values.length === 0) {
      res.json({ checked: 0, triggered: 0, message: '没有待检查的提醒' });
      return;
    }

    const cols = activeAlerts[0].columns.map((c: string) => c.toLowerCase());
    let triggered = 0;

    for (const row of activeAlerts[0].values) {
      const alert: Record<string, any> = {};
      cols.forEach((c: string, i: number) => { alert[c] = row[i]; });

      // 模拟价格检查（实际应该调用各平台API查询最新价格）
      // 这里简化处理：假设价格有小幅波动
      const currentPrice = alert.current_price;
      const newPrice = currentPrice; // 实际应从API获取

      // 更新最后检查价格
      db.run(
        `UPDATE price_alerts SET last_check_price = ? WHERE id = ?`,
        [newPrice, alert.id]
      );

      // 检查是否触发（当前价格低于目标价格）
      if (newPrice <= alert.target_price && newPrice > 0) {
        db.run(
          `UPDATE price_alerts SET is_triggered = 1, triggered_at = datetime('now','localtime') WHERE id = ?`,
          [alert.id]
        );
        triggered++;
        console.log(`价格提醒触发: ${alert.title} 当前价: ${newPrice} 目标价: ${alert.target_price}`);
      }
    }

    saveDb();
    res.json({
      checked: activeAlerts[0].values.length,
      triggered,
      message: `检查完成，${triggered} 个提醒已触发`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;