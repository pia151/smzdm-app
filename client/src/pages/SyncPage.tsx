import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

interface SyncStatus {
  products: Record<string, number>;
  deals: Record<string, number>;
  last_sync: string | null;
}

export default function SyncPage() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [pricing, setPricing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const res = await fetch('/api/sync/status');
      setStatus(await res.json());
    } catch {}
  }

  async function doSyncAll() {
    setSyncing(true);
    setMessage('正在全平台同步...');
    try {
      const res = await fetch('/api/sync/sync-all', { method: 'POST' });
      const data = await res.json();
      setMessage(data.message || `同步完成`);
      loadStatus();
    } catch (err: any) {
      setMessage('同步失败: ' + err.message);
    } finally {
      setSyncing(false);
    }
  }

  async function doUpdatePrices() {
    setPricing(true);
    setMessage('正在更新价格...');
    try {
      const res = await fetch('/api/sync/update-prices', { method: 'POST' });
      const data = await res.json();
      setMessage(data.message || `价格更新完成`);
      loadStatus();
    } catch (err: any) {
      setMessage('价格更新失败: ' + err.message);
    } finally {
      setPricing(false);
    }
  }

  return (
    <div className="pb-8">
      <div className="bg-white px-3 py-3 border-b border-gray-100 sticky top-0 z-10 flex items-center gap-2">
        <Link to="/" className="text-gray-600 text-lg">←</Link>
        <h1 className="text-base font-bold text-gray-800">数据同步</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* 操作按钮 */}
        <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-medium text-gray-800">同步操作</h2>

          <button
            onClick={doSyncAll}
            disabled={syncing}
            className="w-full bg-[#FF6A00] text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {syncing ? '⏳ 同步中...' : '🔄 全平台同步商品'}
          </button>

          <button
            onClick={doUpdatePrices}
            disabled={pricing}
            className="w-full bg-white text-[#FF6A00] py-2.5 rounded-lg text-sm font-medium border border-[#FFD6A0] disabled:opacity-50"
          >
            {pricing ? '⏳ 更新中...' : '💰 更新商品价格'}
          </button>

          {message && (
            <div className="text-sm text-center text-gray-600 bg-white rounded-lg py-2">
              {message}
            </div>
          )}
        </div>

        {/* 平台数据统计 */}
        {status && (
          <>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h2 className="text-sm font-medium text-gray-800 mb-3">📦 商品统计</h2>
              <div className="space-y-2">
                {Object.entries(status.products).map(([platform, count]) => (
                  <div key={platform} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{platform}</span>
                    <span className="font-medium text-gray-800">{count} 件</span>
                  </div>
                ))}
                {Object.keys(status.products).length === 0 && (
                  <p className="text-xs text-gray-400">暂无数据，点击同步</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h2 className="text-sm font-medium text-gray-800 mb-3">🔥 好价统计</h2>
              <div className="space-y-2">
                {Object.entries(status.deals).map(([platform, count]) => (
                  <div key={platform} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{platform}</span>
                    <span className="font-medium text-gray-800">{count} 条</span>
                  </div>
                ))}
                {Object.keys(status.deals).length === 0 && (
                  <p className="text-xs text-gray-400">暂无数据</p>
                )}
              </div>
            </div>

            <div className="text-center text-xs text-gray-400">
              最近同步: {status.last_sync || '从未同步'}
            </div>
          </>
        )}

        {/* 自动同步说明 */}
        <div className="bg-[#FFF0E0] rounded-lg p-4 text-xs text-gray-600 leading-relaxed">
          <p className="font-medium text-[#FF6A00] mb-1">🤖 自动同步说明</p>
          <p>• 京东精选商品：每4小时自动同步一次</p>
          <p>• 商品价格：每次同步时自动更新</p>
          <p>• 价格历史：按天记录，支持30天趋势图</p>
          <p className="mt-2">需要更多平台支持？请联系管理员配置</p>
        </div>
      </div>
    </div>
  );
}