/**
 * 爬虫工具 - 抓取逛丢和SMZDM的商品信息
 */

const GUANGDIU_BASE = 'http://www.guangdiu.com';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface ScrapedDeal {
  title: string;
  price: number | null;
  original_price: number | null;
  image: string;
  url: string;
  platform: string;
  source: string;
  discount: number | null;
  mall: string;
}

// 提取数字价格
function parsePrice(text: string | null): number | null {
  if (!text) return null;
  const match = text.match(/[¥￥$]?\s*([\d,.]+)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  return null;
}

// ==========================================
// 逛丢 (guangdiu.com) 爬虫
// ==========================================
export async function scrapeGuangdiu(): Promise<ScrapedDeal[]> {
  const deals: ScrapedDeal[] = [];

  try {
    const response = await fetch(`${GUANGDIU_BASE}/`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    });

    if (!response.ok) {
      console.error('逛丢请求失败:', response.status);
      return deals;
    }

    const html = await response.text();

    // 解析每个商品条目
    // 格式: <div class="gooditem withborder ">...<img src="..." alt="标题">...</div>
    const itemRegex = /<div class="gooditem withborder ">([\s\S]*?)<\/div>\s*<!-- div.gooditem -->/g;
    let match;

    while ((match = itemRegex.exec(html)) !== null) {
      const itemHtml = match[1];

      // 提取标题 (alt属性)
      const imgMatch = itemHtml.match(/<img[^>]*class="imgself"[^>]*alt="([^"]+)"[^>]*>/);
      const title = imgMatch ? imgMatch[1].trim() : '';
      if (!title) continue;

      // 提取图片URL
      const srcMatch = itemHtml.match(/src="(https?:\/\/[^"]+g[^"]+\.(?:jpg|png|webp)[^"]*)"/);
      let image = srcMatch ? srcMatch[1] : '';
      // 去掉CDN参数获取原图
      image = image.split('?')[0];

      // 提取详情页ID
      const linkMatch = itemHtml.match(/href="detail\.php\?id=(\d+)"/);
      const detailId = linkMatch ? linkMatch[1] : '';

      // 提取价格 - 在标题中可能包含
      const priceMatch = title.match(/[\d,.]+\s*(?:元|块)/);
      let price: number | null = null;
      if (priceMatch) {
        price = parsePrice(priceMatch[0]);
      }

      // 判断平台(从页面分类或链接判断)
      let platform = '京东';
      if (title.includes('天猫') || title.includes('Tmall')) platform = '天猫';
      else if (title.includes('淘宝')) platform = '淘宝';
      else if (title.includes('拼多多')) platform = '拼多多';
      else if (title.includes('苏宁')) platform = '苏宁';

      // 逛丢详情页链接
      const url = detailId ? `${GUANGDIU_BASE}/detail.php?id=${detailId}` : '';

      deals.push({
        title,
        price,
        original_price: null,
        image,
        url,
        platform,
        source: '逛丢',
        discount: null,
        mall: platform,
      });
    }

    console.log(`逛丢爬取完成: ${deals.length} 个商品`);
  } catch (error) {
    console.error('逛丢爬取失败:', error);
  }

  return deals;
}

// ==========================================
// 逛丢详情页 - 获取更多信息和转链URL
// ==========================================
export async function scrapeGuangdiuDetail(id: string): Promise<{
  title: string;
  price: number | null;
  originalPrice: number | null;
  image: string;
  jumpUrl: string;
  mall: string;
} | null> {
  try {
    const response = await fetch(`${GUANGDIU_BASE}/detail.php?id=${id}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html',
        'Referer': GUANGDIU_BASE,
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // 提取商品标题
    const titleMatch = html.match(/class="dtitle"[^>]*>([\s\S]*?)<\/div>/);
    let title = '';
    if (titleMatch) {
      const h2Match = titleMatch[1].match(/<h2[^>]*>([^<]+)<\/h2>/);
      title = h2Match ? h2Match[1].trim() : '';
    }
    if (!title) {
      const altMatch = html.match(/class="simgaheadleftimg"[^>]*alt="([^"]+)"/);
      title = altMatch ? altMatch[1] : '';
    }

    // 提取价格
    const priceMatch = html.match(/class="buyprice"[^>]*>([^<]+)/);
    const price = parsePrice(priceMatch ? priceMatch[1] : null);

    // 提取图片
    const imgMatch = html.match(/class="simgaheadleftimg"[^>]*src="([^"]+)"/);
    let image = imgMatch ? imgMatch[1] : '';
    image = image.split('?')[0];

    // 提取跳转URL (逛丢的中转链接)
    const jumpMatch = html.match(/href="(go\.php\?id=\d+)"[^>]*>/);
    const jumpUrl = jumpMatch ? `${GUANGDIU_BASE}/${jumpMatch[1]}` : '';

    // 提取商城
    const mallMatch = html.match(/class="rightmallname"[^>]*>([^<]+)/);
    const mall = mallMatch ? mallMatch[1].trim() : '京东';

    return { title, price, originalPrice: null, image, jumpUrl, mall };
  } catch {
    return null;
  }
}

// ==========================================
// SMZDM (smzdm.com) 爬虫 - 需要API或特殊处理
// SMZDM有反爬，这里只做占位，实际可通过手动导入或京东API获取数据
// ==========================================
export async function scrapeSmzdm(): Promise<ScrapedDeal[]> {
  // SMZDM有较强的反爬机制，实际使用建议：
  // 1. 使用京东联盟API获取商品数据
  // 2. 手动导入CSV数据
  // 3. 使用其他无反爬的平台数据
  console.log('SMZDM爬虫暂跳过（反爬限制），建议使用京东API');
  return [];
}

// ==========================================
// 全量爬取
// ==========================================
export async function scrapeAll(): Promise<ScrapedDeal[]> {
  const [guangdiuDeals, smzdmDeals] = await Promise.all([
    scrapeGuangdiu(),
    scrapeSmzdm(),
  ]);

  const allDeals = [...guangdiuDeals, ...smzdmDeals];
  console.log(`总计爬取: ${allDeals.length} 个商品`);

  return allDeals;
}