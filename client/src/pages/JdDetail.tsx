import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';

export default function JdDetail() {
  const { skuId } = useParams<{ skuId: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gettingLink, setGettingLink] = useState(false);
  const [promotionUrl, setPromotionUrl] = useState('');

  useEffect(() => {
    if (skuId) {
      api.getJdDetail(skuId)
        .then(setProduct)
        .catch((err: any) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [skuId]);

  async function handleGetLink() {
    if (!skuId) return;
    setGettingLink(true);
    try {
      const materialId = `https://item.m.jd.com/product/${skuId}.html`;
      const data = await api.getJdPromotion({ materialId });
      const url = data.mobile_short_url || data.short_url || data.mobile_click_url || data.click_url || '';
      setPromotionUrl(url);
    } catch (err: any) {
      alert('获取推广链接失败: ' + err.message);
    } finally {
      setGettingLink(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FF6A00] border-t-transparent" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-4xl mb-3">😢</p>
        <p>{error || '商品不存在'}</p>
        <Link to="/jd" className="text-[#FF6A00] text-sm mt-2 inline-block">返回京东精选</Link>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="sticky top-0 bg-white z-10 px-3 py-2.5 border-b border-gray-50 flex items-center">
        <Link to="/jd" className="text-gray-600 text-lg mr-3">←</Link>
        <span className="text-sm font-medium text-gray-800">京东商品详情</span>
      </div>

      {product.image && (
        <div className="w-full h-56 bg-gray-100">
          <img src={product.image} alt={product.title} className="w-full h-full object-contain" />
        </div>
      )}

      <div className="px-4 pt-4">
        <h1 className="text-lg font-bold text-gray-900 leading-snug mb-3">{product.title}</h1>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-[#FF6A00]">¥{product.price}</span>
          {product.original_price > product.price && (
            <><span className="text-sm text-gray-400 line-through">¥{product.original_price}</span>
              <span className="text-xs bg-[#FFF0E0] text-[#FF6A00] px-2 py-0.5 rounded-full">-{Math.round((1 - product.price / product.original_price) * 100)}%</span></>
          )}
        </div>

        {product.commission_rate > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-3 mb-4 border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-orange-600">佣金率 {product.commission_rate}%</span>
                <span className="text-xs text-orange-500 ml-2">预估 ¥{product.commission.toFixed(2)}</span>
              </div>
              <span className="text-xs text-orange-400">推广此商品可赚佣金</span>
            </div>
          </div>
        )}

        {product.coupon && (
          <div className="bg-gradient-to-r from-[#FFF0E0] to-[#FFE4CC] rounded-lg p-3 mb-4 border border-dashed border-[#FFD6A0]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#FF6A00]">满{product.coupon.quota}减{product.coupon.discount}</span>
              <span className="text-xs text-[#FF6A00]/60">优惠券</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 text-xs text-gray-400 mb-4">
          {product.shop_name && <span>店铺: {product.shop_name}</span>}
          {product.sales > 0 && <span>销量: {product.sales.toLocaleString()}</span>}
          {product.score > 0 && <span>评分: {product.score}</span>}
        </div>

        {product.description && (
          <div className="bg-white rounded-lg p-3 mb-4 text-sm text-gray-700">{product.description}</div>
        )}

        <div className="space-y-3 mb-4">
          <a href={product.promotion_url || product.jd_url} target="_blank" rel="noopener noreferrer"
            className="block w-full bg-[#FF6A00] text-white text-center py-3 rounded-lg font-medium active:opacity-90">
            去京东购买
          </a>
          <button onClick={handleGetLink} disabled={gettingLink}
            className="w-full py-2.5 rounded-lg text-sm font-medium border border-[#FFD6A0] bg-[#FFF0E0] text-[#FF6A00] disabled:opacity-50">
            {gettingLink ? '获取中...' : '获取推广链接（赚佣金）'}
          </button>
        </div>

        {promotionUrl && (
          <div className="bg-green-50 rounded-lg p-3 mb-4 border border-green-100">
            <p className="text-xs text-green-600 mb-1">推广链接已生成！分享此链接，有人购买即可获得佣金</p>
            <div className="flex items-center gap-2">
              <input type="text" value={promotionUrl} readOnly
                className="flex-1 bg-white border border-green-200 rounded px-2 py-1 text-xs" />
              <button onClick={() => navigator.clipboard.writeText(promotionUrl)}
                className="px-3 py-1 bg-green-500 text-white rounded text-xs">复制</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}