/**
 * 淘宝/天猫联盟 API 接入 (淘宝客/阿里妈妈)
 *
 * 申请链接: https://tbk.taobao.com
 * 申请流程: 注册阿里妈妈账号 → 身份认证 → 淘宝客接入
 *          → API工具 → 创建应用 → 获取 AppKey/Secret
 *
 * 目前先用爬虫方案抓取公开页面数据，
 * API 方案需要你提供密钥后切换。
 */

const TB_APP_KEY = process.env.TB_APP_KEY || '';
const TB_APP_SECRET = process.env.TB_APP_SECRET || '';

export const IS_TB_API_READY = !!(TB_APP_KEY && TB_APP_SECRET);

// ========================================
// 爬虫方案 (无需 API)
// ========================================

/**
 * 搜索淘宝/天猫优惠商品
 * 使用淘宝搜索 + 天猫精选页面
 */
export async function searchTaobaoDeals(
  keyword: string,
  page: number = 1
): Promise<any[]> {
  const url = `https://s.taobao.com/search?q=${encodeURIComponent(keyword)}&s=${(page - 1) * 44}&sort=sale-desc`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Cookie': 'cna=; cookie2=; t=;',
      }
    });
    const html = await response.text();
    
    // 尝试提取页面中的商品数据
    const items: any[] = [];
    
    // 淘宝页面数据通常在 window.__INIT_DATA__ 或 g_page_config 中
    const dataMatch = html.match(/window\.__INIT_DATA__\s*=\s*({[^;]+})/);
    const configMatch = html.match(/g_page_config\s*=\s*({[^;]+})/);
    
    const jsonStr = dataMatch?.[1] || configMatch?.[1];
    if (jsonStr) {
      try {
        const data = JSON.parse(jsonStr);
        const itemsList = data?.mainInfo?.data?.itemsArray || 
                          data?.itemList || 
                          data?.items || [];
        
        for (const item of itemsList.slice(0, 20)) {
          const price = parseFloat(item.price || item.priceWap || 0);
          const originalPrice = parseFloat(item.originalPrice || item.reservePrice || price);
          
          items.push({
            id: `tb_${item.nid || item.item_id}`,
            platform: item.shopType === 'B' ? '天猫' : '淘宝',
            title: item.title || item.raw_title || '',
            image: item.pic_url || item.image || `https://img.alicdn.com/bao/uploaded/${item.pic_path}`,
            price,
            original_price: originalPrice,
            discount: originalPrice > 0 ? Math.round((1 - price / originalPrice) * 100) : 0,
            url: `https://item.taobao.com/item.htm?id=${item.nid || item.item_id}`,
            sales: parseInt(item.sold || '0') || parseInt(item.view_sales || '0'),
            shop_name: item.nick || item.shopName || '',
          });
        }
      } catch {}
    }

    // 如果解析失败，用正则从 HTML 抓取
    if (items.length === 0) {
      const regex = /"nid":"(\d+)","title":"([^"]+)","pic_url":"([^"]+)","price":"([\d.]+)"/g;
      let match;
      let count = 0;
      while ((match = regex.exec(html)) !== null && count < 30) {
        items.push({
          id: `tb_${match[1]}`,
          platform: '淘宝',
          title: match[2].replace(/<[^>]+>/g, ''),
          image: match[3],
          price: parseFloat(match[4]),
          original_price: 0,
          url: `https://item.taobao.com/item.htm?id=${match[1]}`,
        });
        count++;
      }
    }

    return items;
  } catch (error: any) {
    console.error('淘宝搜索失败:', error.message);
    return [];
  }
}

/**
 * 获取商品详情 (含推广信息)
 */
export async function getTaobaoDetail(itemId: string): Promise<any> {
  const url = `https://item.taobao.com/item.htm?id=${itemId}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });
    const html = await response.text();
    
    // 提取商品数据
    const dataMatch = html.match(/data: ({[^;]+})/);
    
    let title = '', price = 0, originalPrice = 0, images: string[] = [];
    
    // 从 meta 提取标题
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) title = titleMatch[1].replace(/-\s*淘宝网|-\s*天猫/, '').trim();
    
    // 从页面数据提取价格
    const priceMatch = html.match(/"price":"([\d.]+)"/);
    if (priceMatch) price = parseFloat(priceMatch[1]);
    
    const origPriceMatch = html.match(/"originalPrice":"([\d.]+)"/);
    if (origPriceMatch) originalPrice = parseFloat(origPriceMatch[1]);
    
    // 提取图片
    const imgRegex = /"imageUrl":"([^"]+)"/g;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const img = imgMatch[1].replace(/\\/g, '');
      if (!images.includes(img)) images.push(img);
    }

    return {
      id: `tb_${itemId}`,
      title,
      price,
      original_price: originalPrice || price,
      images,
      image: images[0] || '',
      platform: html.includes('tmall') ? '天猫' : '淘宝',
      url: `https://item.taobao.com/item.htm?id=${itemId}`,
      description: title,
    };
  } catch (error: any) {
    return { id: `tb_${itemId}`, error: error.message };
  }
}

// ========================================
// API 方案 (需要密钥)
// ========================================

/**
 * 淘宝客 API 通用调用
 * 此函数仅在你提供了 TB_APP_KEY 和 TB_APP_SECRET 后可用
 */
export async function tbkApi<T = any>(
  method: string,
  bizParams: Record<string, any> = {}
): Promise<T> {
  if (!IS_TB_API_READY) {
    throw new Error('淘宝客 API 密钥未配置，请设置 TB_APP_KEY 和 TB_APP_SECRET');
  }

  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  
  const params: Record<string, string> = {
    method,
    app_key: TB_APP_KEY,
    timestamp,
    format: 'json',
    v: '2.0',
    sign_method: 'md5',
    partner_id: 'top-apitools',
  };

  // 添加业务参数
  for (const [k, v] of Object.entries(bizParams)) {
    params[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
  }

  // 生成签名
  const sortedKeys = Object.keys(params).sort();
  const signStr = TB_APP_SECRET +
    sortedKeys.map(k => `${k}${params[k]}`).join('') +
    TB_APP_SECRET;
  
  const crypto = require('crypto');
  params.sign = crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toUpperCase();

  // 调用 API
  const formBody = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const response = await fetch('https://eco.taobao.com/router/rest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody,
  });

  const text = await response.text();
  const data = JSON.parse(text);
  
  if (data.error_response) {
    throw new Error(`淘宝 API 错误: ${data.error_response.msg} (${data.error_response.code})`);
  }

  return data;
}