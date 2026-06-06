import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Link, useNavigate } from 'react-router-dom';

const PLATFORM_ICONS: Record<string, string> = {
  '京东': '🛒',
  '天猫': '👑',
  '淘宝': '🛍️',
  '拼多多': '💰',
  '美团': '🍜',
};

export default function Search() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setSearched(true);
    setLoading(true);
    try {
      const data = await api.aggregateSearch(keyword);
      setResults(data.items || []);
    } catch (err) {
      console.error('搜索失败:', err);
    } finally {
      setLoading(false);
    }
  }

  function getPlatformIcon(p: string) {
    return PLATFORM_ICONS[p] || '🏪';
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto">
      {/* 搜索头部 */}
      <div className="bg-[#007AFF] px-4 pt-4 pb-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="搜索商品、优惠券、羊毛..."
            className="flex-1 h-10 px-4 rounded-full text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-ios-200"
          />
          <button
            type="submit"
            className="h-10 px-5 bg-white text-[#007AFF] font-semibold rounded-full text-sm shadow-sm"
          >
            搜索
          </button>
        </form>

        {/* 平台筛选 */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {[
            { id: null, name: '全部', icon: '🔥' },
            { id: '京东', name: '京东', icon: '🛒' },
            { id: '天猫', name: '天猫', icon: '👑' },
            { id: '淘宝', name: '淘宝', icon: '🛍️' },
            { id: '拼多多', name: '拼多多', icon: '💰' },
          ].map(p => (
            <button
              key={p.id || 'all'}
              onClick={() => setPlatform(p.id)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                platform === p.id
                  ? 'bg-white text-[#007AFF]'
                  : 'bg-white/20 text-white'
              }`}
            >
              {p.icon} {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* 搜索结果 */}
      <div className="px-3 py-3">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#007AFF] border-t-transparent" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">🔍</p>
            <p>未找到相关好价</p>
            <p className="text-xs mt-1">试试其他关键词</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-3">
              共找到 {results.length} 个好价
            </p>
            <div className="space-y-3">
              {results
                .filter(r => !platform || r.id?.startsWith(platform.slice(0, 2).toLowerCase()) || r.url?.includes(platform))
                .map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-3 shadow-sm"
                >
                  <div className="flex gap-3">
                    {/* 商品图 */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          {getPlatformIcon(item.platform || '京东')}
                        </div>
                      )}
                    </div>

                    {/* 商品信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight">
                          {item.title}
                        </h3>
                        <span className="text-lg flex-shrink-0">
                          {getPlatformIcon(item.platform || '京东')}
                        </span>
                      </div>

                      {/* 价格 */}
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-lg font-bold text-[#007AFF]">
                          ¥{item.price}
                        </span>
                        {item.original_price > item.price && (
                          <span className="text-xs text-gray-400 line-through">
                            ¥{item.original_price}
                          </span>
                        )}
                        {item.discount > 0 && (
                          <span className="text-xs bg-blue-50 text-[#007AFF] px-1.5 py-0.5 rounded">
                            {item.discount}折
                          </span>
                        )}
                      </div>

                      {/* 店铺+销量 */}
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        {item.shop && <span>{item.shop}</span>}
                        {item.sales > 0 && (
                          <span>已售 {item.sales >= 10000 ? (item.sales / 10000).toFixed(1) + '万' : item.sales}</span>
                        )}
                      </div>

                      {/* 优惠券 */}
                      {item.coupon && (
                        <div className="mt-1.5 text-xs bg-blue-50 text-[#007AFF] px-2 py-0.5 rounded inline-block">
                          🎫 {item.coupon}
                        </div>
                      )}

                      {/* 操作按钮 */}
                      <div className="flex gap-2 mt-2">
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-[#007AFF] text-white text-center py-1.5 rounded-lg text-xs font-medium"
                          >
                            去购买
                          </a>
                        )}
                        <button
                          onClick={() => {
                            api.createAlert({
                              title: item.title,
                              url: item.url,
                              platform: item.platform,
                              target_price: item.price * 0.9,
                              current_price: item.price,
                            }).then(() => alert('已设置降价提醒')).catch(() => {});
                          }}
                          className="px-3 py-1.5 border border-[#007AFF] text-[#007AFF] rounded-lg text-xs"
                        >
                          🔔提醒
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!searched && (
          <div className="py-10">
            <p className="text-center text-gray-400 text-sm mb-4">👇 热门搜索</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['iPhone', '茅台', 'AJ球鞋', '神仙水', 'Switch', 'MacBook', '戴森', '筋膜枪'].map(kw => (
                <button
                  key={kw}
                  onClick={() => setKeyword(kw)}
                  className="px-4 py-2 bg-white rounded-full text-sm text-gray-600 shadow-sm hover:shadow-md transition-shadow"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}