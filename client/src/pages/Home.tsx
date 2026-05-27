import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import DealCard from '../components/DealCard';
import { Link } from 'react-router-dom';

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface Deal {
  id: string;
  title: string;
  price: number;
  original_price: number;
  platform: string;
  image: string;
  like_count: number;
  comment_count: number;
  nickname: string;
  avatar: string;
  created_at: string;
  discount_percent: number;
  is_hot: number;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [sort, setSort] = useState('new');
  const [stats, setStats] = useState({ total_deals: 0, total_users: 0, today_deals: 0 });

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
    setDeals([]);
    loadDeals(1);
  }, [activeCategory, sort]);

  async function loadDeals(p: number) {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(p), pageSize: '20', sort: sort === 'hot' ? 'hot' : 'new' };
      if (activeCategory) params.category = String(activeCategory);
      const data = await api.getDeals(params);
      if (p === 1) {
        setDeals(data.data);
      } else {
        setDeals(prev => [...prev, ...data.data]);
      }
      setHasMore(data.page < data.totalPages);
    } catch (err) {
      console.error('加载失败:', err);
    } finally {
      setLoading(false);
    }
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    loadDeals(next);
  }

  return (
    <div>
      {/* 顶部横幅 */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 pt-3 pb-5">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-white">值得买</h1>
          <Link to="/search" className="text-white/80 text-sm">🔍 搜索好价</Link>
        </div>
        {/* 数据概览 */}
        <div className="flex gap-4 text-white/90 text-xs">
          <span>今日好价 {stats.today_deals} 条</span>
          <span>累计 {stats.total_deals} 条</span>
        </div>
      </div>

      {/* 分类导航 (横向滚动) */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        {/* 排序tab */}
        <div className="flex items-center px-3 py-2 border-b border-gray-50">
          <button
            onClick={() => setSort('new')}
            className={`text-sm px-3 py-1 rounded-full mr-2 ${sort === 'new' ? 'bg-red-500 text-white' : 'text-gray-500'}`}
          >
            最新
          </button>
          <button
            onClick={() => setSort('hot')}
            className={`text-sm px-3 py-1 rounded-full ${sort === 'hot' ? 'bg-red-500 text-white' : 'text-gray-500'}`}
          >
            最热
          </button>
          <span className="ml-auto text-xs text-gray-400">共 {stats.total_deals} 个好价</span>
        </div>

        {/* 分类列表 */}
        <div className="category-scroll overflow-x-auto px-3 py-2">
          <div className="flex gap-2 whitespace-nowrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={`text-xs px-3 py-1.5 rounded-full flex-shrink-0 ${
                activeCategory === null ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-gray-50 text-gray-600 border border-gray-100'
              }`}
            >
              全部
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-full flex-shrink-0 ${
                  activeCategory === cat.id ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-gray-50 text-gray-600 border border-gray-100'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 好价列表 */}
      <div className="pt-2">
        {deals.map(deal => (
          <DealCard key={deal.id} deal={deal} />
        ))}

        {loading && (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-500 border-t-transparent" />
          </div>
        )}

        {!loading && hasMore && (
          <button
            onClick={loadMore}
            className="w-full py-3 text-sm text-red-500 font-medium"
          >
            加载更多
          </button>
        )}

        {!loading && !hasMore && deals.length > 0 && (
          <p className="text-center text-gray-400 text-xs py-4">— 没有更多了好价 —</p>
        )}

        {!loading && deals.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p>这里还没有好价</p>
            <Link to="/submit" className="text-red-500 text-sm mt-2 inline-block">去爆料 →</Link>
          </div>
        )}
      </div>
    </div>
  );
}