import { Outlet, Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/search', label: '搜索', icon: '🔍' },
  { path: '/submit', label: '爆料', icon: '✏️' },
  { path: '/favorites', label: '收藏', icon: '⭐' },
  { path: '/profile', label: '我的', icon: '👤' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto relative">
      {/* 主内容区 */}
      <main className="pb-16">
        <Outlet />
      </main>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-50">
        <div className="max-w-lg mx-auto flex justify-around items-center h-14">
          {navItems.map(item => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center min-w-[60px] py-1 transition-colors ${
                  isActive ? 'text-red-500' : 'text-gray-400'
                }`}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}