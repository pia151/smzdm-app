/**
 * 拼多多开放平台 API 接入
 *
 * 申请链接: https://open.pinduoduo.com
 * 申请流程: 注册账号 → 企业认证 → 创建应用
 *          → 获取 ClientId / ClientSecret
 *
 * 目前先用爬虫方案抓取公开页面数据，
 * API 方案需要你提供密钥后切换。
 */

const PDD_CLIENT_ID = process.env.PDD_CLIENT_ID || '';
const PDD_CLIENT_SECRET = process.env.PDD_CLIENT_SECRET || '';

export const IS_PDD_API_READY = !!(PDD_CLIENT_ID && PDD_CLIENT_SECRET);

// ========================================
// 爬虫方案 (无需 API)
// ========================================

/**
 * 搜索拼多多优惠商品
 * 使用拼多多搜索页面 (移动端)
 */
export async function searchPddDeals(
  keyword: string,
  page: number = 1
): Promise<any[]> {
  // 拼多多页面动态渲染，搜索结果在 SSR 中
  const urls = [
    `https://mobile.yangkeduo.com/search_result.html?search_key=${encodeURIComponent(keyword)}`,
    `https://mobile.yangkeduo.com/search_result.html?search_type=goods&search_key=${encodeURIComponent(keyword)}`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        }
      });
      const html = await response.text();
      
      const items: any[] = [];
      
      // 尝试提取 JSON 数据
      const dataMatch = html.match(/window\.__rawData\s*=\s*({[^;]+})/);
      const initMatch = html.match(/window\.__INIT_DATA\s*=\s*({[^;]+})/);
      
      const jsonStr = dataMatch?.[1] || initMatch?.[1];
      if (jsonStr) {
        try {
          const data = JSON.parse(jsonStr);
          const goodsList = data?.searchResult?.goodsList || 
                           data?.goods_list || 
                           data?.list || [];
          
          for (const item of goodsList.slice(0, 20)) {
            const price = parseFloat(item.price || item.minPrice || 0) / 100;
            const originalPrice = parseFloat(item.originalPrice || item.maxPrice || 0) / 100;
            
            items.push({
              id: `pdd_${item.goods_id || item.goodsId}`,
              platform: '拼多多',
              title: item.goods_name || item.goodsName || item.title || '',
              image: item.goods_image_url || item.image || item.thumb_url || '',
              price,
              original_price: originalPrice || price,
              discount: originalPrice > 0 ? Math.round((1 - price / originalPrice) * 100) : 0,
              url: `https://mobile.yangkeduo.com/goods2.html?goods_id=${item.goods_id || item.goodsId}`,
              sales: parseInt(item.sold_quantity || item.sales || 0),
            });
          }
        } catch {}
      }
      
      if (items.length > 0) return items;
    } catch {}
  }

  return [];
}

/**
 * 获取拼多多商品详情
 */
export async function getPddDetail(goodsId: string): Promise<any> {
  const url = `https://mobile.yangkeduo.com/goods2.html?goods_id=${goodsId}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36',
      }
    });
    const html = await response.text();
    
    const dataMatch = html.match(/window\.__rawData\s*=\s*({[^;]+})/);
    if (dataMatch) {
      try {
        const data = JSON.parse(dataMatch[1]);
        const goods = data?.store?.initData?.goods || 
                      data?.goods || 
                      data?.detail || {};
        
        const price = parseFloat(goods.price || goods.minPrice || 0) / 100;
        const originalPrice = parseFloat(goods.originalPrice || goods.marketPrice || 0) / 100;
        
        return {
          id: `pdd_${goodsId}`,
          title: goods.goods_name || goods.goodsName || '',
          image: goods.goods_image_url || goods.gallery?.[0] || '',
          images: goods.gallery || [],
          price,
          original_price: originalPrice || price,
          platform: '拼多多',
          url: `https://mobile.yangkeduo.com/goods2.html?goods_id=${goodsId}`,
          sales: goods.sold_quantity || 0,
          description: goods.goods_desc || '',
        };
      } catch {}
    }

    // fallback: 从 title 提取
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    return {
      id: `pdd_${goodsId}`,
      title: titleMatch?.[1]?.replace(/-拼多多/, '').trim() || '',
      platform: '拼多多',
      url: `https://mobile.yangkeduo.com/goods2.html?goods_id=${goodsId}`,
    };
  } catch {
    return { id: `pdd_${goodsId}`, error: '获取失败' };
  }
}

// ========================================
// API 方案 (需要密钥)
// ========================================

/**
 * 拼多多开放平台 API 通用调用
 * 签名规则: MD5(client_secret + 按字典序排序的参数 + client_secret)
 */
export async function pddApi<T = any>(
  type: string,
  bizParams: Record<string, any> = {}
): Promise<T> {
  if (!IS_PDD_API_READY) {
    throw new Error('拼多多 API 密钥未配置，请设置 PDD_CLIENT_ID 和 PDD_CLIENT_SECRET');
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const crypto = require('crypto');

  const params: Record<string, string> = {
    type,
    client_id: PDD_CLIENT_ID,
    timestamp,
    data_type: 'JSON',
    version: 'V1',
  };

  // 添加业务参数 (JSON 字符串化)
  for (const [k, v] of Object.entries(bizParams)) {
    params[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
  }

  // 生成签名
  const sortedKeys = Object.keys(params).sort();
  const signStr = PDD_CLIENT_SECRET +
    sortedKeys.map(k => `${k}${params[k]}`).join('') +
    PDD_CLIENT_SECRET;
  
  params.sign = crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toUpperCase();

  const formBody = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const response = await fetch('https://gw-api.pinduoduo.com/api/router', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody,
  });

  const text = await response.text();
  const data = JSON.parse(text);
  
  if (data.error_response) {
    throw new Error(`拼多多 API 错误: ${data.error_response.error_msg} (${data.error_response.error_code})`);
  }

  return data;
}