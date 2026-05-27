import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../utils/auth';

export default function Submit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    content: '',
    price: '',
    original_price: '',
    platform: '',
    source_url: '',
    coupon_info: '',
    category_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">✏️</p>
        <p className="text-gray-500 mb-2">登录后才能爆料</p>
        <p className="text-xs text-gray-400 mb-4">分享好价，让大家一起省钱</p>
        <Link to="/login" className="inline-block bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-2.5 rounded-full text-sm">去登录</Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim() || !form.price) {
      setError('标题和价格不能为空');
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.submitDeal({
        ...form,
        price: Number(form.price),
        original_price: Number(form.original_price || 0),
        category_id: form.category_id ? Number(form.category_id) : null,
      });
      setSuccess('爆料成功！正在等待审核...');
      setForm({
        title: '', content: '', price: '', original_price: '',
        platform: '', source_url: '', coupon_info: '', category_id: '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 pt-4 pb-8">
      <h1 className="text-lg font-bold text-gray-900 mb-1">爆料好价</h1>
      <p className="text-xs text-gray-400 mb-5">分享你发现的优惠信息，帮助更多人省钱</p>

      {error && (
        <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg mb-4">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">标题 *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm({...form, title: e.target.value})}
            placeholder="例：Apple AirPods Pro 2 直降400元"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-300"
            required
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">描述</label>
          <textarea
            value={form.content}
            onChange={e => setForm({...form, content: e.target.value})}
            placeholder="描述一下这个好价，如活动范围、使用门槛等"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-300 min-h-[80px]"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">到手价 *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm({...form, price: e.target.value})}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:border-red-300"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">原价</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
              <input
                type="number"
                value={form.original_price}
                onChange={e => setForm({...form, original_price: e.target.value})}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:border-red-300"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">平台</label>
            <select
              value={form.platform}
              onChange={e => setForm({...form, platform: e.target.value})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-300"
            >
              <option value="">选择平台</option>
              <option value="京东">京东</option>
              <option value="天猫">天猫</option>
              <option value="淘宝">淘宝</option>
              <option value="拼多多">拼多多</option>
              <option value="小米商城">小米商城</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">分类</label>
            <select
              value={form.category_id}
              onChange={e => setForm({...form, category_id: e.target.value})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-300"
            >
              <option value="">选择分类</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">购买链接</label>
          <input
            type="url"
            value={form.source_url}
            onChange={e => setForm({...form, source_url: e.target.value})}
            placeholder="https://..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-300"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">优惠信息/券口令</label>
          <input
            type="text"
            value={form.coupon_info}
            onChange={e => setForm({...form, coupon_info: e.target.value})}
            placeholder="如：满199减30 券口令：￥xxx￥"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-300"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-lg font-medium text-sm active:opacity-90 disabled:opacity-60"
        >
          {submitting ? '提交中...' : '提交爆料'}
        </button>
      </form>
    </div>
  );
}