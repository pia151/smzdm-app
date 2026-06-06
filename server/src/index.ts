import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

import { getDb, saveDb } from './database';
import authRoutes from './routes/auth';
import dealsRoutes from './routes/deals';
import categoriesRoutes from './routes/categories';
import productsRoutes from './routes/products';
import favoritesRoutes from './routes/favorites';
import commentsRoutes from './routes/comments';
import jdRoutes from './routes/jd';
import syncRoutes from './routes/sync';
import aggregateRoutes from './routes/aggregate';
import alertsRoutes from './routes/alerts';
import scraperRoutes from './routes/scraper';
import meituanRoutes from './routes/meituan';
import { AuthRequest, authMiddleware } from './middleware/auth';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/favorites', authMiddleware, favoritesRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/jd', jdRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/aggregate', aggregateRoutes);
app.use('/api/alerts', authMiddleware, alertsRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/meituan', meituanRoutes);

// 仪表盘统计
app.get('/api/stats', async (_req, res) => {
  try {
    const db = await getDb();
    const dealCount = db.exec("SELECT COUNT(*) as c FROM deals WHERE status = 'approved'");
    const userCount = db.exec('SELECT COUNT(*) as c FROM users');
    const todayDeals = db.exec("SELECT COUNT(*) as c FROM deals WHERE date(created_at) = date('now','localtime')");

    res.json({
      total_deals: dealCount[0]?.values[0]?.[0] || 0,
      total_users: userCount[0]?.values[0]?.[0] || 0,
      today_deals: todayDeals[0]?.values[0]?.[0] || 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 启动服务
async function start() {
  await getDb();
  console.log(`✅ 数据库已初始化`);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 服务器运行在 http://0.0.0.0:${PORT}`);
    console.log(`📡 API 地址: http://localhost:${PORT}/api`);
  });
}

start().catch(console.error);