import crypto from 'crypto';

const JD_GATEWAY = 'https://api.jd.com/routerjson';

function getJdConfig() {
  const config = {
    appKey: process.env.JD_APP_KEY || '',
    appSecret: process.env.JD_APP_SECRET || '',
  };

  // 解析 PID: 格式: siteId_positionId_subUnionId
  // 例如: 277060029_348363273_3105928193
  const pid = process.env.JD_PID || '';
  if (pid) {
    const parts = pid.split('_');
    config.siteId = parts[0] || '';
    config.positionId = parts[1] || '';
    config.subUnionId = parts[2] || '';
  }

  return config;
}

function generateSign(params: Record<string, string>): string {
  const config = getJdConfig();
  const filtered = Object.entries(params)
    .filter(([k, v]) => v !== '' && k !== 'sign')
    .sort(([a], [b]) => a.localeCompare(b));

  const str = config.appSecret +
    filtered.map(([k, v]) => `${k}${v}`).join('') +
    config.appSecret;

  return crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
}

export async function jdApi<T = any>(
  method: string,
  bizParams: Record<string, any> = {},
  options: { pageNo?: number; pageSize?: number } = {}
): Promise<T> {
  const config = getJdConfig();
  if (!config.appKey || !config.appSecret) {
    throw new Error('京东联盟 API 密钥未配置，请在 .env 中设置 JD_APP_KEY 和 JD_APP_SECRET');
  }

  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '+0000');

  const systemParams: Record<string, string> = {
    method,
    app_key: config.appKey,
    timestamp,
    format: 'json',
    v: '1.0',
    sign_method: 'md5',
  };

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

    const responseKey = `${method.replace(/\./g, '_')}_response`;
    if (data.error_response) {
      throw new Error(`京东 API 错误: ${data.error_response.code} - ${data.error_response.zh_desc || data.error_response.msg}`);
    }

    const result = data[responseKey];
    if (!result) {
      throw new Error(`京东 API 返回格式异常: ${text.slice(0, 200)}`);
    }

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

export async function jdApiV2<T = any>(
  method: string,
  bizParams: Record<string, any> = {},
  options: { pageNo?: number; pageSize?: number } = {}
): Promise<T> {
  const config = getJdConfig();
  if (!config.appKey || !config.appSecret) {
    throw new Error('京东联盟 API 密钥未配置，请在 .env 中设置 JD_APP_KEY 和 JD_APP_SECRET');
  }

  const finalBiz = { ...bizParams };
  if (options.pageNo) finalBiz.pageNo = options.pageNo;
  if (options.pageSize) finalBiz.pageSize = options.pageSize;

  const d = new Date();
  d.setHours(d.getHours() + 8); // 北京时间 UTC+8
  const timestamp = d.toISOString().replace(/T/, ' ').replace(/\.\d{3}Z$/, '');

  const systemParams: Record<string, string> = {
    method,
    app_key: config.appKey,
    timestamp,
    format: 'json',
    v: '1.0',
    sign_method: 'md5',
  };

  const paramJson = JSON.stringify(finalBiz);

  const allParams: Record<string, string> = {
    ...systemParams,
    param_json: paramJson,
  };

  const sign = generateSign(allParams);
  allParams.sign = sign;

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

    const responseKey = `${method.replace(/\./g, '_')}_response`;
    const altResponseKey = `${method.replace(/\./g, '_')}_responce`;

    if (data.error_response) {
      throw new Error(`京东 API 错误: ${data.error_response.code} - ${data.error_response.zh_desc || data.error_response.msg}`);
    }

    const result = data[responseKey] || data[altResponseKey];
    if (!result) {
      throw new Error(`京东 API 返回格式异常: ${text.slice(0, 200)}`);
    }

    if (result.queryResult) {
      const inner = JSON.parse(result.queryResult);
      if (inner.code !== 0 && inner.code !== 200) {
        throw new Error(`京东联盟业务错误: ${inner.message || inner.msg || inner.code}`);
      }
      return inner.data || inner;
    }

    if (result.getResult) {
      const inner = JSON.parse(result.getResult);
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

export async function queryJingfenGoods(
  eliteId: number = 1,
  pageNo: number = 1,
  pageSize: number = 20,
  sortName?: string,
  sort?: string
): Promise<any> {
  return jdApiV2('jd.union.open.goods.query', {
    goodsReq: {
      pageIndex: pageNo,
      pageSize,
      isCouponOnly: 0,
      isPG: 0,
      sortName: sortName || 'inOrderCount30DaysDesc',
      sort: sort || '',
      fields: 'skuName,skuId,price,imageInfo,couponInfo,commissionInfo,shopInfo,shareInfo,owner,exPrice,scoreInfo,inOrderCount30Days',
    }
  });
}

export async function searchGoods(
  keyword: string,
  pageNo: number = 1,
  pageSize: number = 20
): Promise<any> {
  return jdApiV2('jd.union.open.goods.query', {
    goodsReq: {
      keyword,
      pageIndex: pageNo,
      pageSize,
      fields: 'skuName,skuId,price,imageInfo,couponInfo,commissionInfo,shopInfo,shareInfo,owner,inOrderCount30Days',
    }
  });
}

export async function queryGoodsInfo(skuIds: string[]): Promise<any> {
  return jdApiV2('jd.union.open.goods.promotiongoodsinfo.query', {
    goodsReq: {
      skuIds,
    }
  });
}

export async function getPromotionUrl(
  materialId: string,
  positionId?: number | string,
  couponUrl?: string,
  subPositionId?: string
): Promise<any> {
  const config = getJdConfig();

  // 优先使用传入的positionId，否则用环境变量中的
  const finalPositionId = positionId || config.positionId || 0;

  return jdApiV2('jd.union.open.promotion.common.get', {
    promotionCodeReq: {
      materialId,
      siteId: config.siteId || '',
      positionId: Number(finalPositionId) || 0,
      couponUrl: couponUrl || '',
      subUnionId: config.subUnionId || '',
    }
  });
}

export async function getCategoryList(parentId: number = 0): Promise<any> {
  return jdApiV2('jd.union.open.category.goods.get', {
    req: {
      parentId,
      grade: parentId === 0 ? 1 : 0,
    }
  });
}

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

export function parseJdGoods(item: any, eliteName: string) {
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
