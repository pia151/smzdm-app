import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDb, saveDb } from '../database';
import { scrapeAll, scrapeGuangdiuDetail } from '../utils/scraper';
import { extractSkuId, isJdUrl, generateJdSearchUrl } from '../utils/link-converter';
import { generateId } from '../utils/helpers';

const router = Router();

/**
 * POST /api/scraper/scrape
 * 爬取逛丢和SMZDM商品并同步到本地数据库
 */
router.post('/scrape', async (_req: AuthRequest, res: Response) => {
  try {
    const deals = await scrapeAll();
    const db = await getDb();

    let synced = 0;
    let skipped = 0;

    for (const deal of deals) {
      // 检查是否已存在(根据标题+平台)
      const existing = db.exec(
        `SELECT id FROM products WHERE title = ? LIMIT 1`,
        [deal.title]
      );
      if (existing.length > 0 && existing[0]?.values?.length > 0) {
        skipped++;
        continue;
      }

      const productId = `crawl_${generateId()}`;
      const dealId = `crawl_d_${generateId()}`;

      // 插入商品
      db.run(
        `INSERT INTO products (id, category_id, title, subtitle, image, platform,
          current_price, original_price, discount, url, sales_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productId,
          null,
          deal.title,
          `${deal.source}精选`,
          deal.image,
          deal.platform,
          deal.price || 0,
          deal.original_price || 0,
          deal.discount || 0,
          deal.url,
          0,
        ]
      );

      // 插入好价记录
      db.run(
        `INSERT INTO deals (id, product_id, user_id, title, content, price,
          original_price, platform, platform_icon, source_url, coupon_info,
          status, like_count, comment_count, image)
         VALUES (?, ?, 'system', ?, ?, ?, ?, ?, ?, ?, '', 'approved', 0, 0, ?)`,
        [
          dealId,
          productId,
          deal.title,
          `来自${deal.source}的好价推荐`,
          deal.price || 0,
          deal.original_price || 0,
          deal.platform,
          'jd',
          deal.url,
          deal.image,
        ]
      );

      synced++;
    }

    saveDb();
    res.json({
      success: true,
      total: deals.length,
      synced,
      skipped,
      message: `完成：新增${synced}条，重复${skipped}条`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/scraper/jump/:dealId
 * 获取商品的跳转链接
 * 逛丢商品直接使用逛丢的中转链接(包含推广佣金)
 * 其他商品尝试转链或使用搜索页
 */
router.get('/jump/:dealId', async (req: AuthRequest, res: Response) => {
  try {
    const { dealId } = req.params;
    const db = await getDb();

    const result = db.exec(`
      SELECT d.id, d.title, d.source_url, d.platform, d.image, d.price, d.original_price
      FROM deals d WHERE d.id = ?
    `, [dealId]);

    if (!result.length || !result[0]?.values?.length) {
      res.status(404).json({ error: '商品不存在' });
      return;
    }

    const row = result[0].values[0];
    const cols = result[0].columns.map((c: string) => c.toLowerCase());
    const deal: Record<string, any> = {};
    cols.forEach((c: string, i: number) => { deal[c] = row[i]; });

    // 更新点击
    db.run(`UPDATE deals SET like_count = like_count + 1 WHERE id = ?`, [dealId]);
    saveDb();

    // 京东商品，尝试从URL中提取SKU进行转链
    let redirectUrl = deal.source_url || '';

    if (isJdUrl(redirectUrl)) {
      // 如果是逛丢的中转链接，直接使用(逛丢已经带了推广佣金)
      if (redirectUrl.includes('guangdiu.com/go') || redirectUrl.includes('guangdiu.com/to')) {
        // 直接重定向到逛丢的跳转链接
        res.redirect(302, redirectUrl);
        return;
      }

      // 否则尝试提取SKU并使用京东短链接
      const skuId = extractSkuId(redirectUrl);
      if (skuId) {
        // 使用京东联盟的短链接格式
        // 这种方式会在京东后台显示来源
        redirectUrl = `https://u.jd.com/${skuId}`;
      } else {
        // 无法识别SKU，使用搜索页
        redirectUrl = generateJdSearchUrl(deal.title);
      }
    }

    // 非京东商品，返回原始链接或搜索页
    if (!redirectUrl) {
      redirectUrl = deal.source_url || generateJdSearchUrl(deal.title);
    }

    res.redirect(302, redirectUrl);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/scraper/convert
 * 批量转链
 */
router.post('/convert', async (req: AuthRequest, res: Response) => {
  try {
    const { urls } = req.body;
    if (!Array.isArray(urls)) {
      res.status(400).json({ error: 'urls 必须是数组' });
      return;
    }

    const results = urls.map((url: string) => {
      let promotion = url;

      if (isJdUrl(url)) {
        const skuId = extractSkuId(url);
        if (skuId) {
          promotion = `https://u.jd.com/${skuId}`;
        } else {
          promotion = generateJdSearchUrl(url);
        }
      }

      return { original: url, promotion };
    });

    res.json({ success: true, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;