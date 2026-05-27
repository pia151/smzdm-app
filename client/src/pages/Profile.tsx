import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import { api } from '../utils/api';

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ deal_count: 0, favorite_count: 0 });

  useEffect(() => {
    if (user) {
      refreshUser();
      api.getProfile().then((data: any) => {
        setStats({ deal_count: data.deal_count || 0, favorite_count: data.favorite_count || 0 });
      }).catch(() => {});
    }
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">👤</p>
        <p className="text-gray-500 mb-4">登录后查看个人中心</p>
        <Link
          to="/login"
          className="inline-block bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-2.5 rounded-full text-sm"
        >
          去登录
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* 头部 */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 pt-8 pb-12">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar || ''}
            alt=""
            className="w-16 h-16 rounded-full border-2 border-white/50 bg-white"
          />
          <div>
            <h2 className="text-lg font-bold text-white">{user.nickname}</h2>
            <p className="text-white/80 text-xs mt-0.5">{user.bio || '这个人很懒，什么都没写'}</p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="bg-white rounded-xl mx-4 -mt-6 shadow-sm overflow-hidden">
        <div className="flex divide-x divide-gray-100">
          <div className="flex-1 py-4 text-center">
            <p className="text-xl font-bold text-gray-900">{stats.deal_count}</p>
            <p className="text-xs text-gray-400 mt-0.5">我的爆料</p>
          </div>
          <Link to="/favorites" className="flex-1 py-4 text-center block">
            <p className="text-xl font-bold text-gray-900">{stats.favorite_count}</p>
            <p className="text-xs text-gray-400 mt-0.5">我的收藏</p>
          </Link>
          <div className="flex-1 py-4 text-center">
            <p className="text-xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-400 mt-0.5">评论</p>
          </div>
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="mt-4 mx-3">
        <div className="bg-white rounded-lg">
          <Link to="/favorites" className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
            <span className="text-sm text-gray-800">⭐ 我的收藏</span>
            <span className="text-gray-300">→</span>
          </Link>
          <Link to="/submit" className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
            <span className="text-sm text-gray-800">✏️ 我的爆料</span>
            <span className="text-gray-300">→</span>
          </Link>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-gray-800">📱 版本信息</span>
            <span className="text-xs text-gray-400">v1.0.0</span>
          </div>
        </div>
      </div>

      {/* 退出登录 */}
      <div className="mt-6 mx-3 mb-8">
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="w-full bg-white rounded-lg py-3 text-sm text-gray-600 border border-gray-100"
        >
          退出登录
        </button>
      </div>
    </div>
  );
}