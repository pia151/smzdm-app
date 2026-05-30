import { Router, Response } from 'express';
import { AuthRequest, optionalAuth } from '../middleware/auth';
import { getDb, saveDb } from '../database';
import { generateId } from '../utils/helpers';
import {
  queryJingfenGoods,
  searchGoods,
  queryGoodsInfo,
  getPromotionUrl,
  getCategoryList,
  ELITE_MAP,
} from '../utils/jd-union';

const router = Router();

// 精选商品列表（首页推荐）
router.get('/jingfen', async (req: AuthRequest, res: Response) => {
  try {
    const { eliteId = '1', page = '1', pageSize = '20' } = req.query;
    const data = await queryJingfenGoods(
      Number(eliteId),
      Number(page),
      Number(pageSize)
    );

    // 格式化返回数据
    const goods = (data?.data?.list || data?.list || []).map((item: any) => {
      const info = item.goodsInfo || item;
      return {
        skuId: info.skuId || info.skuIdStr,
        title: info.goodsName || info.title || '',
        image: info.imageUrl || info.pic || '',
        price: Number(info.price || info.wlPrice || 0),
        original_price: Number(info.originalPrice || info.jdPrice || 0),
        discount: info.discount || '',
        commission_rate: Number(info.commissionInfo?.commissionRate || 0),
        commission: Number(info.commissionInfo?.commission || 0),
        sales: Number(info.inOrderCount30Days || 0),
        score: Number(info.goodCommentsShare || 0),
        shop_name: info.shopName || '',
        coupon: info.couponInfo?.couponList?.[0] || null,
        category: info.categoryInfo || '',
        is_hot: Number(info.inOrderCount30Days) > 1000 ? 1 : 0,
      };
    });

    res.json({
      eliteId: Number(eliteId),
      eliteName: ELITE_MAP[Number(eliteId)] || '精选商品',
      data: goods,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 关键词搜索京东商品
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const { keyword, page = '1', pageSize = '20' } = req.query;
    if (!keyword) {
      res.status(400).json({ error: '搜索关键词不能为空' });
      return;
    }

    const data = await searchGoods(String(keyword), Number(page), Number(pageSize));
    const goods = (data?.data?.list || data?.list || []).map((item: any) => {
      const info = item.goodsInfo || item;
      return {
        skuId: info.skuId || info.skuIdStr,
        title: info.goodsName || info.title || '',
        image: info.imageUrl || info.pic || '',
        price: Number(info.price || info.wlPrice || 0),
        original_price: Number(info.originalPrice || info.jdPrice || 0),
        commission_rate: Number(info.commissionInfo?.commissionRate || 0),
        commission: Number(info.commissionInfo?.commission || 0),
        sales: Number(info.inOrderCount30Days || 0),
        shop_name: info.shopName || '',
        coupon: info.couponInfo?.couponList?.[0] || null,
      };
    });

    res.json({
      keyword: String(keyword),
      data: goods,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 商品详情（含推广链接）
router.get('/detail/:skuId', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { skuId } = req.params;

    // 查询商品详情
    const data = await queryGoodsInfo([skuId]);
    const info = data?.data?.list?.[0]?.goodsInfo || data?.[0] || {};

    // 生成推广链接
    let promotionUrl = '';
    try {
      const materialId = `https://item.m.jd.com/product/${skuId}.html`;
      const promoData = await getPromotionUrl(materialId);
      promotionUrl = promoData?.data?.shortUrl || promoData?.data?.clickUrl || '';
    } catch {
      // 推广链接生成失败不影响商品详情展示
    }

    res.json({
      skuId,
      title: info.goodsName || '',
      image: info.imageUrl || info.pic || '',
      images: info.imageUrlList || [],
      price: Number(info.price || info.wlPrice || 0),
      original_price: Number(info.originalPrice || info.jdPrice || 0),
      discount: info.discount || '',
      commission_rate: Number(info.commissionInfo?.commissionRate || 0),
      commission: Number(info.commissionInfo?.commission || 0),
      sales: Number(info.inOrderCount30Days || 0),
      score: Number(info.goodCommentsShare || 0),
      shop_name: info.shopName || '',
      description: info.goodsDesc || '',
      category: info.categoryInfo || '',
      coupon: info.couponInfo?.couponList?.[0] || null,
      promotion_url: promotionUrl,
      jd_url: `https://item.m.jd.com/product/${skuId}.html`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取推广链接（用于购买跳转）
router.post('/promotion', async (req: AuthRequest, res: Response) => {
  try {
    const { materialId, positionId, couponUrl, subPositionId } = req.body;
    if (!materialId) {
      res.status(400).json({ error: 'materialId 不能为空' });
      return;
    }

    const data = await getPromotionUrl(materialId, positionId, couponUrl, subPositionId);
    res.json({
      click_url: data?.data?.clickUrl || '',
      short_url: data?.data?.shortUrl || '',
      mobile_short_url: data?.data?.mobileShortUrl || '',
      mobile_click_url: data?.data?.mobileClickUrl || '',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取京东联盟分类
router.get('/categories', async (_req, res: Response) => {
  try {
    const data = await getCategoryList(0, 1);
    const categories = (data?.data?.list || data?.list || []).map((cat: any) => ({
      id: cat.id || cat.catId,
      name: cat.name || cat.catName,
      parent_id: cat.parentId || 0,
      level: cat.level || cat.grade || 1,
    }));
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 将京东精选商品同步到本地数据库（定时任务调用）
router.post('/sync', async (_req, res: Response) => {
  try {
    const db = await getDb();
    let synced = 0;

    // 同步各类精选商品
    for (const [eliteId, eliteName] of Object.entries(ELITE_MAP)) {
      try {
        const data = await queryJingfenGoods(Number(eliteId), 1, 20);
        const goods = data?.data?.list || data?.list || [];

        for (const item of goods) {
          const info = item.goodsInfo || item;
          const skuId = info.skuId || info.skuIdStr;

          // 检查是否已存在
          const existing = db.exec(
            `SELECT id FROM products WHERE id = 'jd_${skuId}'`
          );
          if (existing.length > 0 && existing[0].values.length > 0) continue;

          const price = Number(info.price || info.wlPrice || 0);
          const origPrice = Number(info.originalPrice || info.jdPrice || 0);

          // 确定分类
          let categoryId = null;
          const catInfo = info.categoryInfo;
          if (catInfo) {
            // 尝试匹配本地分类
            const catName = catInfo.catName || '';
            const catResult = db.exec(
              `SELECT id FROM categories WHERE name LIKE '%${catName}%' LIMIT 1`
            );
            if (catResult.length > 0 && catResult[0].values.length > 0) {
              categoryId = catResult[0].values[0][0];
            }
          }

          // 插入商品
          db.run(
            `INSERT OR IGNORE INTO products (id, category_id, title, subtitle, image, platform,
              current_price, original_price, discount, sales_count, rating, url)
             VALUES (?, ?, ?, ?, ?, '京东', ?, ?, ?, ?, ?, ?)`,
            [
              `jd_${skuId}`, categoryId,
              info.goodsName || info.title || '',
              eliteName + '精选', info.imageUrl || info.pic || '',
              price, origPrice,
              origPrice > 0 ? Math.round((1 - price / origPrice) * 100) : 0,
              Number(info.inOrderCount30Days || 0),
              Number(info.goodCommentsShare || 0) / 10,
              `https://item.m.jd.com/product/${skuId}.html`,
            ]
          );

          // 自动创建好价记录
          const coupon = info.couponInfo?.couponList?.[0];
          const dealTitle = origPrice > price
            ? `【${eliteName}】${info.goodsName || ''} 京东好价 ¥${price}`
            : `${info.goodsName || ''} 京东 ¥${price}`;
          const couponInfo = coupon
            ? `满${coupon.quota}减${coupon.discount} 优惠券`
            : '';

          db.run(
            `INSERT OR IGNORE INTO deals (id, product_id, user_id, title, content, price,
              original_price, platform, platform_icon, source_url, coupon_info, category_id,
              status, like_count, comment_count)
             VALUES (?, ?, 'system', ?, ?, ?, ?, '京东', 'jd', ?, ?, ?, 'approved', 0, 0)`,
            [
              `jd_d_${skuId}_${eliteId}`, `jd_${skuId}`,
              dealTitle, `${eliteName}推荐商品，${coupon ? '有优惠券：' + couponInfo : '价格实惠'}`,
              price, origPrice,
              `https://item.m.jd.com/product/${skuId}.html`,
              couponInfo, categoryId,
            ]
          );

          // 记录价格历史
          db.run(
            `INSERT INTO price_history (product_id, price, recorded_at) VALUES (?, ?, datetime('now','localtime'))`,
            [`jd_${skuId}`, price]
          );

          synced++;
        }
      } catch (e: any) {
        console.error(`同步 ${eliteName} 失败:`, e.message);
      }
    }

    saveDb();
    res.json({ synced, message: `成功同步 ${synced} 个京东精选商品` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;