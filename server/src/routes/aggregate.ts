import { Router, Response } from 'express';
import { getDb, saveDb } from '../database';
import { AuthRequest, optionalAuth } from '../middleware/auth';
import { generateId } from '../utils/helpers';
import { searchGoods as searchJdGoods } from '../utils/jd-union';
import { searchTaobaoDeals } from '../utils/tb-union';
import { searchPddDeals } from '../utils/pdd-union';

const router = Router();

// ============================================
// 多平台聚合搜索 - 一键搜索全网优惠
// ============================================

interface PlatformResult {
  platform: string;
  platform_icon: string;
  items: DealItem[];
  error?: string;
}

interface DealItem {
  id: string;
  title: string;
  image: string;
  price: number;
  original_price: number;
  discount: number;
  sales: number;
  url: string;
  shop?: string;
  commission?: number;
  coupon?: string;
}

/**
 * 多平台聚合搜索
 * GET /api/aggregate/search?q=关键词
 */
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const { q, page = '1', pageSize = '10' } = req.query;
    if (!q) {
      res.status(400).json({ error: '请提供搜索关键词' });
      return;
    }

    const keyword = String(q);
    const results: PlatformResult[] = [];
    let totalItems: DealItem[] = [];

    // 并行搜索各平台
    const jdPromise = searchJd(keyword, Number(page), Number(pageSize));
    const tbPromise = searchTb(keyword, Number(page), Number(pageSize));
    const pddPromise = searchPdd(keyword, Number(page), Number(pageSize));

    const [jdResult, tbResult, pddResult] = await Promise.allSettled([
      jdPromise, tbPromise, pddPromise
    ]);

    if (jdResult.status === 'fulfilled') {
      results.push(jdResult.value);
      totalItems = totalItems.concat(jdResult.value.items);
    }

    if (tbResult.status === 'fulfilled') {
      results.push(tbResult.value);
      totalItems = totalItems.concat(tbResult.value.items);
    }

    if (pddResult.status === 'fulfilled') {
      results.push(pddResult.value);
      totalItems = totalItems.concat(pddResult.value.items);
    }

    // 按销量和折扣综合排序
    totalItems.sort((a, b) => {
      const scoreA = (a.sales || 0) * 0.3 + (100 - (a.discount || 0)) * 2;
      const scoreB = (b.sales || 0) * 0.3 + (100 - (b.discount || 0)) * 2;
      return scoreB - scoreA;
    });

    res.json({
      keyword,
      platforms: results,
      items: totalItems.slice(0, 30),
      total: totalItems.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 京东搜索
async function searchJd(keyword: string, page: number, pageSize: number): Promise<PlatformResult> {
  try {
    const data = await searchJdGoods(keyword, page, pageSize);
    const goodsList = data?.result || data?.data || data?.list || [];
    const goodsArray = Array.isArray(goodsList) ? goodsList : (goodsList.result || []);
    const items: DealItem[] = goodsArray.map((item: any) => {
      const info = item.goodsInfo || item;
      const price = Number(info.price || info.wlPrice || 0);
      const origPrice = Number(info.originalPrice || info.jdPrice || 0);
      return {
        id: `jd_${info.skuId || info.skuIdStr}`,
        title: info.goodsName || info.title || '',
        image: info.imageUrl || info.pic || '',
        price,
        original_price: origPrice,
        discount: origPrice > 0 ? Math.round((1 - price / origPrice) * 100) : 0,
        sales: Number(info.inOrderCount30Days || 0),
        url: `https://item.m.jd.com/product/${info.skuId || info.skuIdStr}.html`,
        shop: info.shopName || '',
        commission: Number(info.commissionInfo?.commissionRate || 0),
        coupon: info.couponInfo?.couponList?.[0]
          ? `满${info.couponInfo.couponList[0].quota}减${info.couponInfo.couponList[0].discount}`
          : undefined,
      };
    });
    return { platform: '京东', platform_icon: 'jd', items };
  } catch (e: any) {
    return { platform: '京东', platform_icon: 'jd', items: [], error: e.message };
  }
}

// 淘宝/天猫搜索
async function searchTb(keyword: string, page: number, pageSize: number): Promise<PlatformResult> {
  try {
    const items = await searchTaobaoDeals(keyword, page);
    const dealItems: DealItem[] = items.map((item: any) => ({
      id: item.id,
      title: item.title,
      image: item.image,
      price: item.price,
      original_price: item.original_price,
      discount: item.discount,
      sales: item.sales || 0,
      url: item.url,
      shop: item.shop_name || '',
    }));
    return { platform: item.platform || '淘宝', platform_icon: 'tb', items: dealItems };
  } catch (e: any) {
    return { platform: '淘宝', platform_icon: 'tb', items: [], error: e.message };
  }
}

// 拼多多搜索
async function searchPdd(keyword: string, page: number, pageSize: number): Promise<PlatformResult> {
  try {
    const items = await searchPddDeals(keyword);
    const dealItems: DealItem[] = items.map((item: any) => ({
      id: item.id,
      title: item.title,
      image: item.image,
      price: item.price,
      original_price: item.original_price,
      discount: item.discount || 0,
      sales: item.sales || 0,
      url: item.url,
      shop: item.shop_name || '',
    }));
    return { platform: '拼多多', platform_icon: 'pdd', items: dealItems };
  } catch (e: any) {
    return { platform: '拼多多', platform_icon: 'pdd', items: [], error: e.message };
  }
}

// ============================================
// 逛丢精选 - 首页多平台聚合好价
// ============================================

router.get('/home', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const { platform, category, sort = 'hot' } = req.query;

    let where = "WHERE d.status = 'approved' AND d.price > 0";
    const params: any[] = [];

    if (platform && platform !== 'all') {
      where += ' AND d.platform = ?';
      params.push(String(platform));
    }

    if (category) {
      where += ' AND d.category_id = ?';
      params.push(Number(category));
    }

    let orderBy = 'ORDER BY d.is_hot DESC, d.like_count DESC';
    if (sort === 'newest') orderBy = 'ORDER BY d.created_at DESC';
    else if (sort === 'price_low') orderBy = 'ORDER BY d.price ASC';
    else if (sort === 'price_high') orderBy = 'ORDER BY d.price DESC';
    else if (sort === 'discount') orderBy = 'ORDER BY (d.original_price - d.price) DESC';

    const dataResult = db.exec(
      `SELECT d.*, u.nickname, u.avatar, c.name as category_name
       FROM deals d
       LEFT JOIN users u ON d.user_id = u.id
       LEFT JOIN categories c ON d.category_id = c.id
       ${where} ${orderBy} LIMIT 50`,
      params
    );

    let deals: any[] = [];
    if (dataResult.length > 0) {
      const cols = dataResult[0].columns.map((c: string) => c.toLowerCase());
      deals = dataResult[0].values.map((row: any) => {
        const obj: Record<string, any> = {};
        cols.forEach((c: string, i: number) => { obj[c] = row[i]; });
        if (obj.original_price && obj.original_price > 0) {
          obj.discount_percent = Math.round((1 - obj.price / obj.original_price) * 100);
        }
        return obj;
      });
    }

    // 平台统计
    const platformStats = db.exec(`
      SELECT platform, COUNT(*) as count 
      FROM deals WHERE status='approved' 
      GROUP BY platform
    `);
    const stats: Record<string, number> = {};
    if (platformStats.length > 0) {
      platformStats[0].values.forEach((row: any) => {
        stats[row[0] as string] = row[1] as number;
      });
    }

    res.json({
      deals,
      stats,
      platforms: [
        { id: 'all', name: '全部', icon: '🔥' },
        { id: '京东', name: '京东', icon: '🛒' },
        { id: '天猫', name: '天猫', icon: '👑' },
        { id: '淘宝', name: '淘宝', icon: '🛍️' },
        { id: '拼多多', name: '拼多多', icon: '💰' },
      ],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 比价历史 - 查询商品历史价格
// ============================================

router.get('/price-history/:productId', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const { productId } = req.params;

    const history = db.exec(`
      SELECT price, recorded_at 
      FROM price_history 
      WHERE product_id = ? 
      ORDER BY recorded_at DESC 
      LIMIT 90
    `, [productId]);

    const product = db.exec(`SELECT * FROM products WHERE id = ?`, [productId]);

    let priceData: any[] = [];
    let productInfo: any = null;

    if (history.length > 0) {
      const cols = history[0].columns.map((c: string) => c.toLowerCase());
      priceData = history[0].values.map((row: any) => {
        const obj: Record<string, any> = {};
        cols.forEach((c: string, i: number) => { obj[c] = row[i]; });
        return obj;
      });
    }

    if (product.length > 0 && product[0].values.length > 0) {
      const cols = product[0].columns.map((c: string) => c.toLowerCase());
      productInfo = {};
      cols.forEach((c: string, i: number) => { productInfo[c] = product[0].values[0][i]; });
    }

    res.json({ product: productInfo, history: priceData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;