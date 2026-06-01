import { Router, Response } from 'express';
import { getDb, saveDb } from '../database';
import { AuthRequest } from '../middleware/auth';
import {
  queryJingfenGoods,
  searchGoods,
  getPromotionUrl,
  ELITE_MAP,
  parseJdGoods,
} from '../utils/jd-union';
import { searchTaobaoDeals, IS_TB_API_READY } from '../utils/tb-union';
import { searchPddDeals, IS_PDD_API_READY } from '../utils/pdd-union';

const router = Router();

// ==========================================
// 平台商品自动同步引擎
// ==========================================

function parseJdGoods(item: any, eliteName: string) {
  const info = item.goodsInfo || item;
  const skuId = info.skuId || info.skuIdStr;
  const price = Number(info.price || info.wlPrice || 0);
  const origPrice = Number(info.originalPrice || info.jdPrice || 0);
  const coupon = info.couponInfo?.couponList?.[0];

  return {
    id: `jd_${skuId}`,
    dealId: `jd_d_${skuId}_auto`,
    title: info.goodsName || info.title || '',
    subtitle: eliteName + '精选',
    image: info.imageUrl || info.pic || '',
    images: info.imageUrlList || [],
    price,
    original_price: origPrice,
    discount: origPrice > 0 ? Math.round((1 - price / origPrice) * 100) : 0,
    platform: '京东',
    platform_icon: 'jd',
    url: `https://item.m.jd.com/product/${skuId}.html`,
    coupon: coupon ? `满${coupon.quota}减${coupon.discount}` : '',
    sales_count: Number(info.inOrderCount30Days || 0),
    rating: Number(info.goodCommentsShare || 0) / 10,
    skuId,
  };
}

// 同步单一平台精选商品到本地库
async function syncPlatformToDb(db: any, platform: string, goods: any[]) {
  let synced = 0;
  for (const item of goods) {
    // 检查是否已存在
    const existing = db.exec(`SELECT id FROM products WHERE id = ?`, [item.id]);
    const exists = existing.length > 0 && existing[0]?.values?.length > 0;

    // 更新或插入商品
    if (!exists) {
      db.run(
        `INSERT INTO products (id, category_id, title, subtitle, image, platform,
          current_price, original_price, discount, sales_count, rating, url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.id, null, item.title, item.subtitle, item.image, item.platform,
         item.price, item.original_price, item.discount,
         item.sales_count, item.rating, item.url]
      );
    } else {
      db.run(
        `UPDATE products SET current_price=?, original_price=?, discount=?,
          sales_count=?, rating=?, updated_at=datetime('now','localtime')
         WHERE id=?`,
        [item.price, item.original_price, item.discount,
         item.sales_count, item.rating, item.id]
      );
    }

    // 检查 deal 是否已存在
    const dealExist = db.exec(`SELECT id FROM deals WHERE id = ?`, [item.dealId]);
    const dealExists = dealExist.length > 0 && dealExist[0]?.values?.length > 0;

    if (!dealExists) {
      const dealTitle = item.original_price > item.price
        ? `【${item.platform}好价】${item.title} ¥${item.price}`
        : `${item.title} ¥${item.price}`;
      const dealContent = item.coupon
        ? `优惠券: ${item.coupon}`
        : `${item.platform}精选好价，价格实惠`;

      db.run(
        `INSERT INTO deals (id, product_id, user_id, title, content, price,
          original_price, platform, platform_icon, source_url, coupon_info,
          status, like_count, comment_count, image, is_hot)
         VALUES (?, ?, 'system', ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 0, 0, ?, ?)`,
        [item.dealId, item.id, dealTitle, dealContent,
         item.price, item.original_price,
         item.platform, item.platform_icon, item.url, item.coupon,
         item.image, item.sales_count > 1000 ? 1 : 0]
      );
    } else {
      // 更新价格和优惠信息
      db.run(
        `UPDATE deals SET price=?, original_price=?, coupon_info=?,
          updated_at=datetime('now','localtime')
         WHERE id=?`,
        [item.price, item.original_price, item.coupon, item.dealId]
      );
    }

    // 记录价格历史（每天只记一次）
    const today = new Date().toISOString().slice(0, 10);
    const historyExist = db.exec(
      `SELECT id FROM price_history WHERE product_id = ? AND date(recorded_at) = ?`,
      [item.id, today]
    );
    const historyExists = historyExist.length > 0 && historyExist[0]?.values?.length > 0;

    if (!historyExists) {
      db.run(
        `INSERT INTO price_history (product_id, price, recorded_at)
         VALUES (?, ?, datetime('now','localtime'))`,
        [item.id, item.price]
      );
    }

    synced++;
  }
  return synced;
}

// ==========================================
// API 路由
// ==========================================

// 1. 全平台一键同步
router.post('/sync-all', async (_req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const results: Record<string, number> = {};
    const errors: string[] = [];
    let total = 0;

    // 京东：同步所有精选分类
    for (const [eliteId, eliteName] of Object.entries(ELITE_MAP)) {
      try {
        const data = await queryJingfenGoods(Number(eliteId), 1, 20);
        const goodsList = data?.result || data?.data || data?.list || [];
        const goodsArray = Array.isArray(goodsList) ? goodsList : (goodsList.result || []);
        const goods = goodsArray.map((item: any) => parseJdGoods(item, eliteName));
        const count = await syncPlatformToDb(db, '京东', goods);
        results[eliteName] = count;
        total += count;
      } catch (e: any) {
        errors.push(`京东-${eliteName}: ${e.message}`);
        console.error(`同步京东 ${eliteName} 失败:`, e.message);
      }
    }

    saveDb();
    res.json({
      success: true,
      total_synced: total,
      details: results,
      errors: errors.length > 0 ? errors : undefined,
      message: `同步完成，共更新 ${total} 条好价`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. 同步指定平台
router.post('/sync/:platform', async (req: AuthRequest, res: Response) => {
  try {
    const { platform } = req.params;
    const db = await getDb();
    let count = 0;

    if (platform === 'jd' || platform === '京东') {
      const { eliteId = '1' } = req.query;
      const data = await queryJingfenGoods(Number(eliteId), 1, 20);
      const goodsList = data?.result || data?.data || data?.list || [];
      const goodsArray = Array.isArray(goodsList) ? goodsList : (goodsList.result || []);
      const eliteName = ELITE_MAP[Number(eliteId)] || '精选商品';
      const goods = goodsArray.map((item: any) => parseJdGoods(item, eliteName));
      count = await syncPlatformToDb(db, '京东', goods);
    } else if (platform === 'tb' || platform === '淘宝' || platform === '天猫') {
      const { keyword = '优惠' } = req.query;
      const items = await searchTaobaoDeals(String(keyword));
      if (items.length > 0) {
        const goods = items.map((item: any) => ({
          id: item.id,
          dealId: `${item.id}_auto`,
          title: item.title,
          image: item.image,
          price: item.price,
          original_price: item.original_price,
          discount: item.discount,
          platform: item.platform,
          platform_icon: item.platform === '天猫' ? 'tmall' : 'tb',
          url: item.url,
          sales_count: item.sales || 0,
        }));
        count = await syncPlatformToDb(db, goods[0].platform, goods);
      }
    } else if (platform === 'pdd' || platform === '拼多多') {
      const { keyword = '优惠' } = req.query;
      const items = await searchPddDeals(String(keyword));
      if (items.length > 0) {
        const goods = items.map((item: any) => ({
          id: item.id,
          dealId: `${item.id}_auto`,
          title: item.title,
          image: item.image,
          price: item.price,
          original_price: item.original_price,
          discount: item.discount,
          platform: '拼多多',
          platform_icon: 'pdd',
          url: item.url,
          sales_count: item.sales || 0,
        }));
        count = await syncPlatformToDb(db, '拼多多', goods);
      }
    } else {
      res.status(400).json({ error: `不支持的平台: ${platform}` });
      return;
    }

    saveDb();
    res.json({ success: true, platform, synced: count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. 关键词搜索 + 自动保存到本地
router.post('/search-and-save', async (req: AuthRequest, res: Response) => {
  try {
    const { keyword, platform = '京东' } = req.body;
    if (!keyword) {
      res.status(400).json({ error: '搜索关键词不能为空' });
      return;
    }

    const db = await getDb();

    if (platform === '京东' || platform === 'jd') {
      const data = await searchGoods(keyword, 1, 20);
      const goodsList = data?.result || data?.data || data?.list || [];
      const goodsArray = Array.isArray(goodsList) ? goodsList : (goodsList.result || []);
      const goods = goodsArray.map((item: any) => parseJdGoods(item, keyword));
      const count = await syncPlatformToDb(db, '京东', goods);
      saveDb();
      res.json({ success: true, keyword, platform, synced: count });
    } else {
      res.status(400).json({ error: `不支持的平台: ${platform}` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. 获取同步状态统计
router.get('/status', async (_req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();

    // 各平台商品数量
    const productCounts = db.exec(`
      SELECT platform, COUNT(*) as count FROM products GROUP BY platform
    `);
    const products: Record<string, number> = {};
    if (productCounts.length > 0) {
      const cols = productCounts[0].columns.map((c: string) => c.toLowerCase());
      productCounts[0].values.forEach((row: any) => {
        const obj: Record<string, any> = {};
        cols.forEach((c: string, i: number) => { obj[c] = row[i]; });
        products[obj.platform || '其他'] = obj.count;
      });
    }

    // 各平台好价数量
    const dealCounts = db.exec(`
      SELECT platform, COUNT(*) as count FROM deals WHERE status='approved' GROUP BY platform
    `);
    const deals: Record<string, number> = {};
    if (dealCounts.length > 0) {
      const cols = dealCounts[0].columns.map((c: string) => c.toLowerCase());
      dealCounts[0].values.forEach((row: any) => {
        const obj: Record<string, any> = {};
        cols.forEach((c: string, i: number) => { obj[c] = row[i]; });
        deals[obj.platform || '其他'] = obj.count;
      });
    }

    // 最近同步时间（取最新 price_history）
    const lastSync = db.exec(`SELECT MAX(recorded_at) as last FROM price_history`);

    res.json({
      products,
      deals,
      last_sync: lastSync.length > 0 ? lastSync[0].values[0]?.[0] : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. 价格自动更新（只更新价格，不新增数据）
router.post('/update-prices', async (_req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    let updated = 0;

    // 获取所有京东商品
    const products = db.exec(
      `SELECT id, url FROM products WHERE platform = '京东'`
    );
    if (products.length === 0 || products[0].values.length === 0) {
      res.json({ updated: 0, message: '没有需要更新的商品' });
      return;
    }

    const cols = products[0].columns.map((c: string) => c.toLowerCase());
    // 提取 skuId
    for (const row of products[0].values) {
      const obj: Record<string, any> = {};
      cols.forEach((c: string, i: number) => { obj[c] = row[i]; });
      const skuId = obj.id?.replace('jd_', '');
      if (!skuId) continue;

      try {
        const data = await searchGoods(skuId, 1, 1);
        const goodsList = data?.result || data?.data || data?.list || [];
        const goodsArray = Array.isArray(goodsList) ? goodsList : (goodsList.result || []);
        if (goodsArray.length === 0) continue;

        const info = goodsArray[0].goodsInfo || goodsArray[0];
        const price = Number(info.price || info.wlPrice || 0);
        const origPrice = Number(info.originalPrice || info.jdPrice || 0);

        if (price > 0) {
          db.run(
            `UPDATE products SET current_price=?, original_price=?,
              discount=?, updated_at=datetime('now','localtime')
             WHERE id=?`,
            [price, origPrice,
             origPrice > 0 ? Math.round((1 - price / origPrice) * 100) : 0,
             obj.id]
          );
          db.run(
            `UPDATE deals SET price=?, original_price=?, updated_at=datetime('now','localtime')
             WHERE product_id=?`,
            [price, origPrice, obj.id]
          );

          // 记录价格历史
          const today = new Date().toISOString().slice(0, 10);
          const historyExist = db.exec(
            `SELECT id FROM price_history WHERE product_id = ? AND date(recorded_at) = ?`,
            [obj.id, today]
          );
          if (!(historyExist.length > 0 && historyExist[0]?.values?.length > 0)) {
            db.run(
              `INSERT INTO price_history (product_id, price, recorded_at)
               VALUES (?, ?, datetime('now','localtime'))`,
              [obj.id, price]
            );
          }
          updated++;
        }
      } catch (e) {
        // 单个商品更新失败跳过
        continue;
      }
    }

    saveDb();
    res.json({ success: true, updated, message: `已更新 ${updated} 个商品价格` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;