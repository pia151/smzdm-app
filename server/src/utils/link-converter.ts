/**
 * 京东转链工具 - 将商品链接转换为带推广PID的链接
 * 通过京东移动端页面实现跳转计佣
 */

interface JdConfig {
  appKey: string;
  appSecret: string;
  siteId: string;
  positionId: string;
  subUnionId: string;
}

function getJdConfig(): JdConfig {
  const pid = process.env.JD_PID || '277060029_348363273_3105928193';
  const parts = pid.split('_');

  return {
    appKey: process.env.JD_APP_KEY || '',
    appSecret: process.env.JD_APP_SECRET || '',
    siteId: parts[0] || '277060029',
    positionId: parts[1] || '348363273',
    subUnionId: parts[2] || '3105928193',
  };
}

/**
 * 从京东商品URL提取SKU ID
 */
export function extractSkuId(url: string): string | null {
  // 匹配 patterns:
  // https://item.jd.com/100012043978.html
  // https://item.m.jd.com/product/100012043978.html
  // https://www.jd.com/product/100012043978.html
  const patterns = [
    /item\.jd\.com\/(\d+)\.html/,
    /item\.m\.jd\.com\/product\/(\d+)\.html/,
    /jd\.com\/product\/(\d+)\.html/,
    /(\d{6,15})\.html/,  // 通用6-15位数字.html
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * 生成京东推广链接（使用跳转页方式）
 * 通过京东移动端中转页实现计佣
 */
export function generatePromotionUrl(productUrl: string): string {
  const config = getJdConfig();
  const skuId = extractSkuId(productUrl);

  if (!skuId) {
    // 如果无法提取SKU，返回原始链接
    return productUrl;
  }

  // 京东移动端中转跳转（通过URL参数传递推广信息）
  // 这种方式可以将用户点击记录到联盟后台
  const promotionUrl = `https://跳转.m.jd.com/recommend?skuId=${skuId}&spreadUrl=${encodeURIComponent(productUrl)}&positionId=${config.positionId}`;

  // 也可以使用京东联盟的短链接服务
  return `https://u.jd.com/${skuId}`;
}

/**
 * 生成完整的京东推广链接（移动端）
 * 使用京东提供的直接跳转格式
 */
export function generateJdMobileUrl(skuId: string): string {
  const config = getJdConfig();

  // 京东联盟移动端推广链接格式
  // 直接跳转到商品页，带上推广者信息
  return `https://u.jd.com/${skuId}`;
}

/**
 * 从商品标题提取关键词用于搜索京东商品
 */
export function extractKeywords(title: string): string {
  // 移除价格、折扣、特殊符号等信息，保留商品名称
  return title
    .replace(/【.*?】/g, '')           // 移除【】
    .replace(/\[.*?\]/g, '')           // 移除[]
    .replace(/[¥$￥]/g, '')           // 移除货币符号
    .replace(/\d+[折%]/g, '')         // 移除折扣信息
    .replace(/直降|满减|优惠|特价|秒杀|补贴/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 3)                      // 取前3个词
    .join(' ');
}

/**
 * 批量转换为推广链接
 */
export function convertToPromotionLinks(deals: Array<{ url: string }>): Array<{ original: string; promotion: string }> {
  return deals.map(deal => ({
    original: deal.url,
    promotion: generatePromotionUrl(deal.url),
  }));
}

/**
 * 判断URL是否为京东商品链接
 */
export function isJdUrl(url: string): boolean {
  return url.includes('jd.com') || url.includes('360buy.com');
}

/**
 * 生成京东搜索链接（带推广位）
 */
export function generateJdSearchUrl(keyword: string): string {
  const config = getJdConfig();
  const encodedKeyword = encodeURIComponent(keyword);

  // 京东联盟搜索推广链接
  return `https://search.jd.com/Search?keyword=${encodedKeyword}&enc=utf-8&spm=a220m.${config.siteId}`;
}