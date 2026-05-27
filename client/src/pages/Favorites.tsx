import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../utils/auth';
import DealCard from '../components/DealCard';

export default function Favorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.getFavorites()
        .then((data: any) => setFavorites(data.data || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">⭐</p>
        <p className="text-gray-500 mb-4">登录后查看收藏</p>
        <Link to="/login" className="inline-block bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-2.5 rounded-full text-sm">去登录</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white px-3 py-3 border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-base font-bold text-gray-800">我的收藏</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-500 border-t-transparent" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-sm">还没有收藏的好价</p>
          <Link to="/" className="text-red-500 text-xs mt-2 inline-block">去首页看看 →</Link>
        </div>
      ) : (
        <div className="pt-2">
          {favorites.map((fav: any) => (
            <div key={fav.fav_id} className="relative">
              <DealCard deal={fav} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}