import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../utils/auth';

export default function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    if (id) {
      api.getDeal(id)
        .then(data => {
          setDeal(data);
          setFavorited(data.is_favorited);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  async function handleFavorite() {
    if (!user) return;
    try {
      const res = await api.toggleFavorite('deal', id!);
      setFavorited(res.favorited);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleComment() {
    if (!commentText.trim()) return;
    try {
      await api.postComment(id!, commentText.trim());
      setCommentText('');
      // 重新加载详情获取新评论
      const data = await api.getDeal(id!);
      setDeal(data);
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-4xl mb-3">😢</p>
        <p>好价不存在</p>
        <Link to="/" className="text-red-500 text-sm mt-2 inline-block">返回首页</Link>
      </div>
    );
  }

  const platformColorMap: Record<string, string> = {
    '京东': 'bg-red-50 text-red-600',
    '天猫': 'bg-orange-50 text-orange-600',
    '小米商城': 'bg-blue-50 text-blue-600',
    '拼多多': 'bg-green-50 text-green-600',
  };

  return (
    <div className="pb-4">
      {/* 返回按钮 */}
      <div className="sticky top-0 bg-white z-10 px-3 py-2.5 border-b border-gray-50 flex items-center">
        <Link to="/" className="text-gray-600 text-lg mr-3">←</Link>
        <span className="text-sm font-medium text-gray-800">好价详情</span>
      </div>

      {/* 主内容 */}
      {deal.image && (
        <div className="w-full h-56 bg-gray-100">
          <img src={deal.image} alt={deal.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="px-4 pt-4">
        {/* 标题 */}
        <h1 className="text-lg font-bold text-gray-900 leading-snug mb-3">{deal.title}</h1>

        {/* 价格 */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold text-red-500">¥{deal.price}</span>
          {deal.original_price > deal.price && (
            <>
              <span className="text-sm text-gray-400 line-through">¥{deal.original_price}</span>
              <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">
                -{deal.discount_percent}%
              </span>
            </>
          )}
        </div>

        {/* 平台和标签 */}
        <div className="flex items-center gap-2 mb-4">
          {deal.platform && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${platformColorMap[deal.platform] || 'bg-gray-100'}`}>
              {deal.platform}
            </span>
          )}
          <span className="text-xs text-gray-400">爆料: {deal.nickname || '匿名'}</span>
          <span className="text-xs text-gray-400">{timeAgo(deal.created_at)}</span>
        </div>

        {/* 内容描述 */}
        {deal.content && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-700 leading-relaxed">
            {deal.content}
          </div>
        )}

        {/* 优惠券信息 */}
        {deal.coupon_info && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-3 mb-4 border border-dashed border-red-200">
            <p className="text-xs text-gray-500 mb-1">优惠券/口令</p>
            <p className="text-sm coupon-code">{deal.coupon_info}</p>
          </div>
        )}

        {/* 购买按钮 */}
        {deal.source_url && (
          <a
            href={deal.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-center py-3 rounded-lg font-medium mb-4 active:opacity-90"
          >
            去购买 → {deal.platform || '前往'}
          </a>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleFavorite}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${
              favorited
                ? 'bg-red-50 text-red-500 border-red-200'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {favorited ? '⭐ 已收藏' : '☆ 收藏'}
          </button>
          <button
            onClick={() => api.likeDeal(deal.id).then(() => setDeal({...deal, like_count: deal.like_count + 1}))}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200"
          >
            ❤️ {deal.like_count || 0}
          </button>
        </div>

        {/* 评论区 */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">
            评论 ({deal.comments?.length || 0})
          </h3>

          {/* 评论输入 */}
          {user ? (
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="说点什么..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-300"
                onKeyDown={e => e.key === 'Enter' && handleComment()}
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm disabled:opacity-50"
              >
                发送
              </button>
            </div>
          ) : (
            <Link to="/login" className="block text-center text-sm text-red-500 py-3 mb-3 border border-dashed border-gray-200 rounded-lg">
              登录后参与评论
            </Link>
          )}

          {/* 评论列表 */}
          {deal.comments?.map((comment: any) => (
            <div key={comment.id} className="flex gap-2 mb-3 pb-3 border-b border-gray-50">
              <img
                src={comment.avatar || ''}
                alt=""
                className="w-6 h-6 rounded-full flex-shrink-0 bg-gray-100"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700">{comment.nickname || '匿名'}</span>
                  <span className="text-[10px] text-gray-400">{timeAgo(comment.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))}

          {(!deal.comments || deal.comments.length === 0) && (
            <p className="text-center text-gray-400 text-xs py-4">暂无评论，来说两句吧</p>
          )}
        </div>
      </div>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
  return dateStr.slice(0, 10);
}