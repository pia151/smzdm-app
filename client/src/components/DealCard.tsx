import { Link } from 'react-router-dom';

interface DealCardProps {
  deal: any;
  onFavorite?: (id: string) => void;
}

export default function DealCard({ deal, onFavorite }: DealCardProps) {
  const platformColors: Record<string, string> = {
    '京东': 'bg-red-100 text-red-600',
    '天猫': 'bg-orange-100 text-orange-600',
    '小米商城': 'bg-blue-100 text-blue-600',
    '拼多多': 'bg-green-100 text-green-600',
    '淘宝': 'bg-yellow-100 text-yellow-700',
  };

  const platformColor = platformColors[deal.platform] || 'bg-gray-100 text-gray-600';

  return (
    <Link
      to={`/deal/${deal.id}`}
      className="block bg-white rounded-lg mb-3 mx-3 overflow-hidden shadow-sm active:scale-[0.98] transition-transform"
    >
      <div className="flex p-3">
        {/* 商品图片 */}
        {deal.image && (
          <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 mr-3">
            <img
              src={deal.image}
              alt={deal.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23999" font-size="12">暂无图</text></svg>';
              }}
            />
          </div>
        )}

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-1">
            {deal.title}
          </h3>

          {/* 标签 */}
          <div className="flex items-center gap-1.5 mb-1.5">
            {deal.platform && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${platformColor}`}>
                {deal.platform}
              </span>
            )}
            {deal.discount_percent && deal.discount_percent > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">
                -{deal.discount_percent}%
              </span>
            )}
          </div>

          {/* 价格 */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-red-500">¥{deal.price}</span>
            {deal.original_price > deal.price && (
              <span className="text-xs text-gray-400 line-through">¥{deal.original_price}</span>
            )}
          </div>

          {/* 用户信息 */}
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-1">
              {deal.avatar && (
                <img src={deal.avatar} alt="" className="w-4 h-4 rounded-full" />
              )}
              <span className="text-[10px] text-gray-400">{deal.nickname || '匿名用户'}</span>
              <span className="text-[10px] text-gray-300">{timeAgo(deal.created_at)}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">❤️ {deal.like_count || 0}</span>
              <span className="text-[10px] text-gray-400">💬 {deal.comment_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
  return dateStr.slice(0, 10);
}