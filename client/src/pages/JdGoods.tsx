import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

const ELITE_TABS = [
  { id: 1, name: '好价商品', icon: '🔥' },
  { id: 2, name: '好券商品', icon: '🎫' },
  { id: 3, name: '爆款商品', icon: '💥' },
  { id: 4, name: '高佣金', icon: '💰' },
  { id: 5, name: '销量排行', icon: '📈' },
  { id: 6, name: '新品首发', icon: '✨' },
  { id: 8, name: '历史低价', icon: '📉' },
  { id: 10, name: '大额券', icon: '🎁' },
];

export default function JdGoods() {
  const [activeTab, setActiveTab] = useState(1);
  const [goods, setGoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setPage(1);
    setGoods([]);
    loadGoods(1);
  }, [activeTab]);

  async function loadGoods(p: number) {
    setLoading(true);
    setError('');
    try {
      const data = await api.getJdJingfen(String(activeTab), String(p), '20');
      const list = data.data || [];
      if (p === 1) {
        setGoods(list);
      } else {
        setGoods(prev => [...prev, ...list]);
      }
      setHasMore(list.length >= 20);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    loadGoods(next);
  }

  return (
    <div>
      {/* 顶部 */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 px-4 pt-3 pb-4">
        <h1 className="text-xl font-bold text-white">京东精选</h1>
        <p className="text-xs text-white/80 mt-0.5">京东联盟推荐好价，购买可获佣金</p>
      </div>

      {/* 分类Tab */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="category-scroll overflow-x-auto px-3 py-2">
          <div className="flex gap-2 whitespace-nowrap">
            {ELITE_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs px-3 py-1.5 rounded-full flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-50 text-gray-600'
                }`}
              >
                {tab.icon} {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-3 mt-3 bg-red-50 text-red-500 text-sm p-3 rounded-lg">
          {error}
          <p className="text-xs mt-1 text-red-400">请确认 server/.env 中 JD_APP_KEY 和 JD_APP_SECRET 已正确配置</p>
        </div>
      )}

      {/* 商品列表 */}
      <div className="pt-2">
        {goods.map(item => (
          <Link
            key={item.skuId}
            to={`/jd/${item.skuId}`}
            className="block bg-white rounded-lg mb-3 mx-3 p-3 shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="flex gap-3">
              {/* 商品图 */}
              {item.image && (
                <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-1">
                  {item.title}
                </h3>

                {/* 标签 */}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">京东</span>
                  {item.commission_rate > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium">
                      佣金 {item.commission_rate}%
                    </span>
                  )}
                  {item.coupon && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                      券满{item.coupon.quota}减{item.coupon.discount}
                    </span>
                  )}
                </div>

                {/* 价格 */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-red-500">¥{item.price}</span>
                  {item.original_price > item.price && (
                    <>
                      <span className="text-xs text-gray-400 line-through">¥{item.original_price}</span>
                      <span className="text-[10px] bg-red-50 text-red-500 px-1 py-0.5 rounded">
                        -{Math.round((1 - item.price / item.original_price) * 100)}%
                      </span>
                    </>
                  )}
                </div>

                {/* 佣金 */}
                {item.commission > 0 && (
                  <p className="text-[10px] text-orange-500 mt-0.5">
                    预估佣金 ¥{item.commission.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}

        {loading && (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-500 border-t-transparent" />
          </div>
        )}

        {!loading && hasMore && (
          <button onClick={loadMore} className="w-full py-3 text-sm text-red-500 font-medium">
            加载更多
          </button>
        )}

        {!loading && !error && goods.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-3">🛒</p>
            <p>暂无京东精选商品</p>
          </div>
        )}
      </div>
    </div>
  );
}