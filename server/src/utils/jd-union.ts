import crypto from 'crypto';

// 京东联盟 API 配置
const JD_APP_KEY = process.env.JD_APP_KEY || '';
const JD_APP_SECRET = process.env.JD_APP_SECRET || '';
const JD_GATEWAY = 'https://api.jd.com/routerjson';

/**
 * 京东联盟 API 签名算法
 * 规则: MD5(app_secret + 按字母排序的参数键值对 + app_secret)
 */
function generateSign(params: Record<string, string>): string {
  // 1. 过滤空值和sign参数
  const filtered = Object.entries(params)
    .filter(([k, v]) => v !== '' && k !== 'sign')
    .sort(([a], [b]) => a.localeCompare(b));

  // 2. 拼接: secret + key1value1key2value2... + secret
  const str = JD_APP_SECRET +
    filtered.map(([k, v]) => `${k}${v}`).join('') +
    JD_APP_SECRET;

  // 3. MD5 转大写
  return crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
}

/**
 * 调用京东联盟 API
 */
export async function jdApi<T = any>(
  method: string,
  bizParams: Record<string, any> = {},
  options: { pageNo?: number; pageSize?: number } = {}
): Promise<T> {
  if (!JD_APP_KEY || !JD_APP_SECRET) {
    throw new Error('京东联盟 API 密钥未配置，请在 .env 中设置 JD_APP_KEY 和 JD_APP_SECRET');
  }

  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '+0000');

  const systemParams: Record<string, string> = {
    method,
    app_key: JD_APP_KEY,
    timestamp,
    format: 'json',
    v: '1.0',
    sign_method: 'md5',
  };

  // 业务参数 JSON 序列化
  const paramJson = JSON.stringify({
    ...bizParams,
    ...(options.pageNo ? { pageNo: options.pageNo } : {}),
    ...(options.pageSize ? { pageSize: options.pageSize } : {}),
  });

  const allParams: Record<string, string> = {
    ...systemParams,
    param_json: paramJson,
  };

  const sign = generateSign(allParams);
  allParams.sign = sign;

  // 发送请求
  const formBody = Object.entries(allParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const response = await fetch(JD_GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody,
  });

  const text = await response.text();
  try {
    const data = JSON.parse(text);

    // 京东 API 返回格式: { method_response: { ... } }
    // 或错误格式: { error_response: { ... } }
    const responseKey = `${method.replace(/\./g, '_')}_response`;
    if (data.error_response) {
      throw new Error(`京东 API 错误: ${data.error_response.code} - ${data.error_response.zh_desc || data.error_response.msg}`);
    }

    const result = data[responseKey];
    if (!result) {
      throw new Error(`京东 API 返回格式异常: ${text.slice(0, 200)}`);
    }

    // 解析内部的 result 字段
    if (result.result) {
      const inner = JSON.parse(result.result);
      if (inner.code !== 0 && inner.code !== 200) {
        throw new Error(`京东联盟业务错误: ${inner.message || inner.msg || inner.code}`);
      }
      return inner.data || inner;
    }

    return result;
  } catch (e: any) {
    if (e.message?.startsWith('京东')) throw e;
    throw new Error(`京东 API 解析失败: ${text.slice(0, 200)}`);
  }
}

// ========================================
// 具体业务接口封装
// ========================================

/**
 * 精选商品查询 (jd.union.open.goods.jingfen.query)
 * 获取京东精选推荐商品，包含佣金信息
 */
export async function queryJingfenGoods(
  eliteId: number = 1,
  pageNo: number = 1,
  pageSize: number = 20,
  sortName?: string,
  sort?: string
): Promise<any> {
  return jdApi('jd.union.open.goods.jingfen.query', {
    eliteId,
    sortName: sortName || 'price',
    sort: sort || 'desc',
  }, { pageNo, pageSize });
}

/**
 * 关键词搜索商品 (jd.union.open.goods.query)
 */
export async function searchGoods(
  keyword: string,
  pageNo: number = 1,
  pageSize: number = 20
): Promise<any> {
  return jdApi('jd.union.open.goods.query', {
    keyword,
  }, { pageNo, pageSize });
}

/**
 * 商品详情查询 (jd.union.open.goods.promotiongoodsinfo.query)
 */
export async function queryGoodsInfo(skuIds: string[]): Promise<any> {
  return jdApi('jd.union.open.goods.promotiongoodsinfo.query', {
    skuIds,
  });
}

/**
 * 获取推广链接 (jd.union.open.promotion.common.get)
 * 生成带推广参数的购买链接，用于赚取佣金
 */
export async function getPromotionUrl(
  materialId: string,
  positionId?: number,
  couponUrl?: string,
  subPositionId?: string
): Promise<any> {
  return jdApi('jd.union.open.promotion.common.get', {
    materialId,
    positionId: positionId || 0,
    couponUrl: couponUrl || '',
    subPositionId: subPositionId || '',
  });
}

/**
 * 获取联盟分类列表 (jd.union.open.category.list.get)
 */
export async function getCategoryList(parentId: number = 0, level: number = 1): Promise<any> {
  return jdApi('jd.union.open.category.list.get', {
    parentId,
    grade: level,
  });
}

/**
 * 精选商品eliteId对照表
 * 1-好价商品 2-好券商品 3-爆款商品 4-高佣金商品
 * 5-销量排行 6-新品首发 7-视频购物 8-历史低价
 * 10-大额券商品 11-618大促 12-双11大促 13-秒杀商品
 */
export const ELITE_MAP: Record<number, string> = {
  1: '好价商品',
  2: '好券商品',
  3: '爆款商品',
  4: '高佣金商品',
  5: '销量排行',
  6: '新品首发',
  8: '历史低价',
  10: '大额券商品',
  13: '秒杀商品',
};