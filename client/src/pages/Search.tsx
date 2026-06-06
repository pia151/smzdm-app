import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import DealCard from '../components/DealCard';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  const doSearch = useCallback(async () => {
    if (!query.trim() && !selectedCategory) return;
    setLoading(true);
    setSearched(true);
    try {
      const params: Record<string, string> = {};
      if (query.trim()) params.search = query.trim();
      if (selectedCategory) params.category = selectedCategory;
      params.sort = 'new';
      const data = await api.getDeals(params);
      setResults(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') doSearch();
  }

  return (
    <div>
      <div className="bg-white px-3 py-3 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-gray-600 text-lg">←</Link>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索商品、好价..."
            className="flex-1 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-gray-100"
            autoFocus
          />
          <button onClick={doSearch} disabled={loading}
            className="text-sm text-[#007AFF] font-medium px-2">搜索</button>
        </div>
      </div>

      <div className="px-3 py-2 bg-white border-b border-gray-50">
        <div className="flex gap-2 overflow-x-auto category-scroll">
          <button onClick={() => { setSelectedCategory(''); setSearched(false); }}
            className={`text-xs px-3 py-1.5 rounded-full flex-shrink-0 ${!selectedCategory ? 'bg-[#E8F0FE] text-[#007AFF]' : 'bg-white text-gray-600'}`}>全部</button>
          {categories.map((cat: any) => (
            <button key={cat.id} onClick={() => { setSelectedCategory(String(cat.id)); setSearched(false); }}
              className={`text-xs px-3 py-1.5 rounded-full flex-shrink-0 ${selectedCategory === String(cat.id) ? 'bg-[#E8F0FE] text-[#007AFF]' : 'bg-white text-gray-600'}`}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#007AFF] border-t-transparent" />
          </div>
        ) : searched ? (
          results.length > 0 ? (
            results.map(deal => <DealCard key={deal.id} deal={deal} />)
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm">没有找到相关好价</p>
            </div>
          )
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">👆</p>
            <p className="text-sm">输入关键词搜索好价</p>
            <p className="text-xs mt-1">或选择分类浏览</p>
          </div>
        )}
      </div>
    </div>
  );
}