import { useState, useEffect } from 'react';
import { api } from '../utils/api';

interface Alert {
  id: string;
  title: string;
  url: string;
  platform: string;
  target_price: number;
  current_price: number;
  last_check_price: number;
  is_active: number;
  is_triggered: number;
  created_at: string;
  triggered_at: string;
  drop_amount: number;
  drop_percent: number;
}

const PLATFORM_ICONS: Record<string, string> = {
  '京东': '🛒',
  '天猫': '👑',
  '淘宝': '🛍️',
  '拼多多': '💰',
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState({ total: 0, triggered: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  async function loadAlerts() {
    setLoading(true);
    try {
      const status = filter === 'all' ? undefined : filter;
      const data = await api.getAlerts(status as any);
      setAlerts(data.alerts || []);
      setStats(data.stats || { total: 0, triggered: 0, active: 0 });
    } catch (err) {
      console.error('加载失败:', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAlert(id: string, isActive: boolean) {
    try {
      await api.updateAlert(id, { is_active: !isActive });
      loadAlerts();
    } catch (err) {
      console.error('更新失败:', err);
    }
  }

  async function deleteAlert(id: string) {
    if (!confirm('确定删除这个提醒？')) return;
    try {
      await api.deleteAlert(id);
      loadAlerts();
    } catch (err) {
      console.error('删除失败:', err);
    }
  }

  async function updateTargetPrice(id: string, currentPrice: number) {
    const newPrice = prompt('请输入新的目标价格:', String((currentPrice * 0.9).toFixed(2)));
    if (!newPrice) return;
    try {
      await api.updateAlert(id, { target_price: parseFloat(newPrice) });
      loadAlerts();
    } catch (err) {
      console.error('更新失败:', err);
    }
  }

  function getPlatformIcon(p: string) {
    return PLATFORM_ICONS[p] || '🏪';
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto pb-20">
      {/* 头部 */}
      <div className="bg-[#007AFF] px-4 pt-4 pb-5">
        <h1 className="text-xl font-bold text-white">🔔 价格提醒</h1>
        <p className="text-white/70 text-xs mt-1">降价时自动通知您</p>

        {/* 统计卡片 */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-white/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-white/70">全部提醒</p>
          </div>
          <div className="flex-1 bg-white/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{stats.active}</p>
            <p className="text-xs text-white/70">监控中</p>
          </div>
          <div className="flex-1 bg-white/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-300">{stats.triggered}</p>
            <p className="text-xs text-white/70">已触发</p>
          </div>
        </div>
      </div>

      {/* 筛选Tab */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-4">
        {[
          { id: 'all', name: '全部' },
          { id: 'active', name: '监控中' },
          { id: 'triggered', name: '已触发' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`text-sm pb-1 border-b-2 ${
              filter === tab.id
                ? 'border-[#007AFF] text-[#007AFF]'
                : 'border-transparent text-gray-400'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* 提醒列表 */}
      <div className="px-3 py-3">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#007AFF] border-t-transparent" />
          </div>
        )}

        {!loading && alerts.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">🔔</p>
            <p>还没有价格提醒</p>
            <p className="text-xs mt-1">去搜索商品并设置提醒</p>
          </div>
        )}

        {!loading && alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`bg-white rounded-xl p-4 shadow-sm ${
                  alert.is_triggered ? 'border-l-4 border-green-500' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getPlatformIcon(alert.platform)}</span>
                      <h3 className="text-sm font-medium text-gray-800 truncate">
                        {alert.title}
                      </h3>
                    </div>

                    {/* 价格信息 */}
                    <div className="flex items-center gap-3 mt-2">
                      <div>
                        <p className="text-xs text-gray-400">当前价</p>
                        <p className="text-lg font-bold text-[#007AFF]">
                          ¥{alert.current_price}
                        </p>
                      </div>
                      <div className="text-gray-300">→</div>
                      <div>
                        <p className="text-xs text-gray-400">目标价</p>
                        <p className="text-lg font-bold text-green-600">
                          ¥{alert.target_price}
                        </p>
                      </div>
                    </div>

                    {/* 状态标签 */}
                    <div className="flex gap-2 mt-2">
                      {alert.is_triggered ? (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                          ✅ 已触发
                        </span>
                      ) : alert.is_active ? (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                          🔔 监控中
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          ⏸️ 已暂停
                        </span>
                      )}
                      {alert.drop_amount > 0 && !alert.is_triggered && (
                        <span className="text-xs text-blue-500">
                          还需降 ¥{alert.drop_amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col gap-2 ml-3">
                    {!alert.is_triggered && (
                      <>
                        <button
                          onClick={() => updateTargetPrice(alert.id, alert.current_price)}
                          className="text-xs text-[#007AFF] px-2 py-1 border border-[#007AFF] rounded"
                        >
                          修改
                        </button>
                        <button
                          onClick={() => toggleAlert(alert.id, !!alert.is_active)}
                          className={`text-xs px-2 py-1 rounded ${
                            alert.is_active
                              ? 'text-gray-500 border border-gray-300'
                              : 'text-blue-500 border border-blue-300'
                          }`}
                        >
                          {alert.is_active ? '暂停' : '恢复'}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-xs text-red-400 px-2 py-1"
                    >
                      删除
                    </button>
                  </div>
                </div>

                {/* 购买链接 */}
                {alert.url && !alert.is_triggered && (
                  <a
                    href={alert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-3 text-center text-xs text-[#007AFF] py-2 bg-blue-50 rounded-lg"
                  >
                    去购买 →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}