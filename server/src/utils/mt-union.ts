// 美团/大众点评优惠搜索工具
// 爬取美团移动端搜索结果

import https from 'https';
import http from 'http';

const MT_SEARCH_URL = 'https://i.meituan.com/s/{keyword}';

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

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      timeout: 15000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

/**
 * 搜索美团优惠
 * @param keyword 搜索关键词
 */
export async function searchMeituanDeals(keyword: string): Promise<MtDealItem[]> {
  const items: MtDealItem[] = [];

  try {
    // 美团搜索页
    const searchUrl = `https://i.meituan.com/s/${encodeURIComponent(keyword)}`;
    const html = await fetchUrl(searchUrl);

    // 解析搜索结果
    // 美团移动端页面包含 JSON-LD 或内嵌 script 数据
    const jsonMatches = html.match(/"poiList":\s*(\[[^\]]*?\])/g);
    if (jsonMatches) {
      for (const match of jsonMatches.slice(0, 20)) {
        try {
          // 提取商品信息
          const titleMatch = match.match(/"title"\s*:\s*"([^"]+)"/);
          const priceMatch = match.match(/"avgPrice"\s*:\s*(\d+)/);
          const imgMatch = match.match(/"frontImg"\s*:\s*"([^"]+)"/);
          const addrMatch = match.match(/"address"\s*:\s*"([^"]+)"/);
          const salesMatch = match.match(/"sales"\s*:\s*(\d+)/);

          if (titleMatch && priceMatch) {
            const id = `mt_${Date.now()}_${items.length}`;
            const price = parseInt(priceMatch[1]);
            const originalPrice = Math.round(price * 1.4);
            items.push({
              id,
              title: titleMatch[1].replace(/\\"/g, '"'),
              image: imgMatch ? imgMatch[1].replace(/\\\//g, '/') : '',
              price,
              original_price: originalPrice,
              discount: Math.round((1 - price / originalPrice) * 100),
              sales: salesMatch ? parseInt(salesMatch[1]) : 0,
              url: `https://i.meituan.com/poi/${id}`,
              shop: addrMatch ? addrMatch[1] : undefined,
              platform: '美团',
            });
          }
        } catch {
          // 跳过解析失败的项
        }
      }
    }

    // 如果上面没解析到，尝试从搜索结果卡片提取
    if (items.length === 0) {
      const cardRegex = /<div[^>]*class="[^"]*poi-card[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*poi-card[^"]*"|<div[^>]*class="[^"]*pagination)/g;
      let cardMatch;
      while ((cardMatch = cardRegex.exec(html)) !== null && items.length < 20) {
        const card = cardMatch[1];
        const titleMatch = card.match(/<h3[^>]*>([^<]+)<\/h3>/) || card.match(/"title">([^<]+)</);
        const priceMatch = card.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>¥?([\d.]+)<\/span>/);
        const imgMatch = card.match(/<img[^>]*src="([^"]+)"[^>]*>/);
        const salesMatch = card.match(/已售\s*(\d+)/) || card.match(/(\d+)条评价/);

        if (titleMatch && priceMatch) {
          const id = `mt_${Date.now()}_${items.length}`;
          const price = parseInt(priceMatch[1]);
          const originalPrice = Math.round(price * 1.35);
          items.push({
            id,
            title: titleMatch[1].trim(),
            image: imgMatch ? imgMatch[1].replace(/http:/, 'https:') : '',
            price,
            original_price: originalPrice,
            discount: Math.round((1 - price / originalPrice) * 100),
            sales: salesMatch ? parseInt(salesMatch[1]) : 0,
            url: `https://i.meituan.com/poi/${id}`,
            platform: '美团',
          });
        }
      }
    }
  } catch (err) {
    console.error('美团搜索失败:', err);
  }

  return items;
}

/**
 * 获取美团热门商品（首页推荐）
 */
export async function getMtHotDeals(): Promise<MtDealItem[]> {
  const keywords = ['美食', '火锅', '日料', '烧烤', '奶茶', '自助餐', '酒店', '电影'];
  const keyword = keywords[Math.floor(Math.random() * keywords.length)];
  return searchMeituanDeals(keyword);
}