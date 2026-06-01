import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getProduct(id)
        .then(setProduct)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FF6A00] border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-4xl mb-3">😢</p>
        <p>商品不存在</p>
        <Link to="/" className="text-[#FF6A00] text-sm mt-2 inline-block">返回首页</Link>
      </div>
    );
  }

  const prices = product.price_history || [];
  const minPrice = prices.length > 0 ? Math.min(...prices.map((p: any) => p.price)) : product.current_price;
  const maxPrice = prices.length > 0 ? Math.max(...prices.map((p: any) => p.price)) : product.current_price;

  return (
    <div className="pb-4">
      <div className="sticky top-0 bg-white z-10 px-3 py-2.5 border-b border-gray-50 flex items-center">
        <Link to="/" className="text-gray-600 text-lg mr-3">←</Link>
        <span className="text-sm font-medium text-gray-800">商品详情</span>
      </div>

      <div className="px-4 pt-4">
        <h1 className="text-lg font-bold text-gray-900 leading-snug mb-2">{product.title}</h1>
        {product.subtitle && <p className="text-sm text-gray-500 mb-3">{product.subtitle}</p>}

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold text-[#FF6A00]">¥{product.current_price}</span>
          {product.original_price > product.current_price && (
            <>
              <span className="text-sm text-gray-400 line-through">¥{product.original_price}</span>
              <span className="text-xs bg-[#FFF0E0] text-[#FF6A00] px-2 py-0.5 rounded-full">-{product.discount}%</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-6">
          {product.platform && <span>{product.platform}</span>}
          {product.sales_count > 0 && <span>已售 {product.sales_count.toLocaleString()}</span>}
          {product.rating > 0 && <span>⭐ {product.rating}</span>}
        </div>

        {prices.length > 1 && (
          <div className="bg-white rounded-lg border border-gray-100 p-3 mb-6">
            <h3 className="text-sm font-medium text-gray-800 mb-2">📈 价格趋势（近30天）</h3>
            <div className="relative h-32 flex items-end gap-0.5">
              {prices.map((p: any, i: number) => {
                const height = ((p.price - minPrice) / (maxPrice - minPrice || 1)) * 80 + 20;
                return (
                  <div key={i}
                    className="flex-1 bg-[#FFD6A0] rounded-t"
                    style={{ height: `${height}%` }}
                    title={`¥${p.price} (${p.date?.slice(0, 10) || ''})`} />
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>30天前</span>
              <span>最低 ¥{minPrice}</span>
              <span>最高 ¥{maxPrice}</span>
              <span>今天</span>
            </div>
          </div>
        )}

        {product.related_deals?.length > 0 && (
          <>
            <h3 className="text-sm font-medium text-gray-800 mb-3">💰 相关好价</h3>
            {product.related_deals.map((deal: any) => (
              <Link key={deal.id} to={`/deal/${deal.id}`}
                className="block bg-white rounded-lg p-3 mb-2 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[#FF6A00]">¥{deal.price}</span>
                  {deal.original_price > deal.price && <span className="text-xs text-gray-400 line-through">¥{deal.original_price}</span>}
                  <span className="text-xs text-gray-400">{deal.platform}</span>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );
}