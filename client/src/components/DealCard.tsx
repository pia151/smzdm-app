import { useState } from 'react';

interface DealCardProps {
  deal: any;
  onFavorite?: (id: string) => void;
}

// 从商品ID提取京东SKU ID
function extractSkuId(deal: any): string | null {
  if (!deal.product_id) return null;
  // product_id格式: jd_123456 或 p1
  if (deal.product_id.startsWith('jd_')) {
    return deal.product_id.replace('jd_', '');
  }
  return null;
}

// 生成京东商品图片URL
function getJdImageUrl(skuId: string): string {
  return `https://img10.360buyimg.com/n1/s450x450_${skuId}.jpg`;
}

// 生成京东搜索页URL
function getJdSearchUrl(title: string): string {
  return `https://search.jd.com/Search?keyword=${encodeURIComponent(title)}&enc=utf-8`;
}

// 生成占位图SVG (带商品关键词)
function getPlaceholderSvg(title: string): string {
  const encoded = encodeURIComponent(title.slice(0, 20));
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect fill='%23f5f5f5' width='200' height='200'/><text x='100' y='90' text-anchor='middle' fill='%23999' font-size='14' font-family='sans-serif'>暂无图片</text><text x='100' y='115' text-anchor='middle' fill='%23ccc' font-size='12' font-family='sans-serif'>${encoded}</text></svg>`;
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
  const skuId = extractSkuId(deal);
  const jdImageUrl = skuId ? getJdImageUrl(skuId) : null;
  const hasRealImage = deal.image && deal.image.startsWith('http');

  // 跳转URL: 优先source_url，其次京东商品页，最后京东搜索
  const jumpUrl = deal.source_url || (skuId ? `https://item.m.jd.com/product/${skuId}.html` : getJdSearchUrl(deal.title));

  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white rounded-lg mb-3 mx-3 overflow-hidden shadow-sm border border-gray-100">
      <div className="flex p-3">
        {/* 商品图片 - 带跳转 */}
        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-white mr-3">
          {jdImageUrl && !imgError ? (
            <a href={jumpUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              <img
                src={jdImageUrl}
                alt={deal.title}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            </a>
          ) : hasRealImage ? (
            <a href={jumpUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              <img
                src={deal.image}
                alt={deal.title}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            </a>
          ) : (
            <a href={jumpUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              <img
                src={getPlaceholderSvg(deal.title)}
                alt=""
                className="w-full h-full object-cover"
              />
            </a>
          )}
          {/* 平台角标 */}
          <span className={`absolute top-0 left-0 text-[9px] px-1 py-0.5 rounded-br ${platformColor}`}>
            {deal.platform}
          </span>
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <a href={jumpUrl} target="_blank" rel="noopener noreferrer">
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-1 hover:text-[#007AFF]">
              {deal.title}
            </h3>
          </a>

          {/* 标签 */}
          <div className="flex items-center gap-1.5 mb-1.5">
            {deal.discount_percent && deal.discount_percent > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-[#007AFF] font-medium">
                -{deal.discount_percent}%
              </span>
            )}
            {deal.coupon_info && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] font-medium">
                券
              </span>
            )}
          </div>

          {/* 价格 */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-[#007AFF]">¥{deal.price}</span>
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

      {/* 底部跳转按钮 - 带转链 */}
      {jumpUrl && jumpUrl !== '#' && (
        <div className="px-3 pb-2">
          <a
            href={`/api/scraper/jump/${deal.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-xs py-1.5 bg-[#007AFF] text-white rounded-md hover:bg-[#0062cc] transition-colors"
            onClick={(e) => {
              // 阻止默认跳转，由后端重定向
              e.preventDefault();
              // 直接跳转，让后端处理转链
              window.open(`/api/scraper/jump/${deal.id}`, '_blank');
            }}
          >
            去购买 ▸
          </a>
        </div>
      )}
    </div>
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