import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const API_BASE = 'http://10.0.2.2:3001/api';

interface AlertItem {
  id: string;
  title: string;
  url: string;
  platform: string;
  target_price: number;
  current_price: number;
  is_active: number;
  is_triggered: number;
  drop_amount: number;
  drop_percent: number;
}

const PLATFORM_ICONS: Record<string, string> = {
  '京东': '🛒',
  '天猫': '👑',
  '淘宝': '🛍️',
  '拼多多': '💰',
};

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [stats, setStats] = useState({ total: 0, triggered: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigation = useNavigation();

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  async function loadAlerts() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const statusParam = filter !== 'all' ? `?status=${filter}` : '';
      const res = await fetch(`${API_BASE}/alerts${statusParam}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
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
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/alerts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !isActive }),
      });
      loadAlerts();
    } catch (err) {
      console.error('更新失败:', err);
    }
  }

  async function deleteAlert(id: string) {
    Alert.alert('确认', '确定删除这个提醒？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/alerts/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            loadAlerts();
          } catch (err) {
            console.error('删除失败:', err);
          }
        },
      },
    ]);
  }

  function getPlatformIcon(p: string) {
    return PLATFORM_ICONS[p] || '🏪';
  }

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.title}>🔔 价格提醒</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{stats.total}</Text>
            <Text style={styles.statLabel}>全部</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{stats.active}</Text>
            <Text style={styles.statLabel}>监控中</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: '#FFD700' }]}>{stats.triggered}</Text>
            <Text style={styles.statLabel}>已触发</Text>
          </View>
        </View>
      </View>

      {/* 筛选 */}
      <View style={styles.filterRow}>
        {[
          { id: 'all', name: '全部' },
          { id: 'active', name: '监控中' },
          { id: 'triggered', name: '已触发' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.filterTab, filter === tab.id && styles.filterTabActive]}
            onPress={() => setFilter(tab.id)}
          >
            <Text style={[styles.filterText, filter === tab.id && styles.filterTextActive]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#FF6A00" />
          </View>
        )}

        {!loading && alerts.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>还没有价格提醒</Text>
            <Text style={styles.emptyHint}>去搜索商品并设置提醒</Text>
          </View>
        )}

        {!loading && alerts.length > 0 && (
          <View style={styles.list}>
            {alerts.map(item => (
              <View
                key={item.id}
                style={[styles.card, item.is_triggered ? styles.cardTriggered : null]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.platformIcon}>{getPlatformIcon(item.platform)}</Text>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                </View>

                <View style={styles.priceRow}>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>当前价</Text>
                    <Text style={styles.currentPrice}>¥{item.current_price}</Text>
                  </View>
                  <Text style={styles.arrow}>→</Text>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>目标价</Text>
                    <Text style={styles.targetPrice}>¥{item.target_price}</Text>
                  </View>
                </View>

                <View style={styles.statusRow}>
                  {item.is_triggered ? (
                    <Text style={styles.statusTriggered}>✅ 已触发</Text>
                  ) : item.is_active ? (
                    <Text style={styles.statusActive}>🔔 监控中</Text>
                  ) : (
                    <Text style={styles.statusPaused}>⏸️ 已暂停</Text>
                  )}
                  {item.drop_amount > 0 && !item.is_triggered && (
                    <Text style={styles.dropHint}>还需降 ¥{item.drop_amount.toFixed(2)}</Text>
                  )}
                </View>

                <View style={styles.actions}>
                  {!item.is_triggered && (
                    <>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => toggleAlert(item.id, !!item.is_active)}
                      >
                        <Text style={styles.actionText}>
                          {item.is_active ? '暂停' : '恢复'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionDelete]}
                        onPress={() => deleteAlert(item.id)}
                      >
                        <Text style={styles.actionDeleteText}>删除</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#FF6A00', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
  statItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 12, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  filterRow: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, gap: 20 },
  filterTab: { paddingBottom: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterTabActive: { borderBottomColor: '#FF6A00' },
  filterText: { fontSize: 14, color: '#999' },
  filterTextActive: { color: '#FF6A00', fontWeight: '600' },
  content: { flex: 1 },
  loading: { padding: 50, alignItems: 'center' },
  empty: { alignItems: 'center', padding: 50 },
  emptyIcon: { fontSize: 50 },
  emptyText: { color: '#666', fontSize: 16, marginTop: 10 },
  emptyHint: { color: '#999', fontSize: 12, marginTop: 4 },
  list: { padding: 12, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  cardTriggered: { borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  cardHeader: { flexDirection: 'row', gap: 8 },
  platformIcon: { fontSize: 16 },
  cardTitle: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  priceItem: { flex: 1 },
  priceLabel: { fontSize: 11, color: '#999' },
  currentPrice: { fontSize: 18, fontWeight: 'bold', color: '#FF6A00' },
  targetPrice: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
  arrow: { color: '#ccc', fontSize: 16 },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  statusTriggered: { fontSize: 12, backgroundColor: '#E8F5E9', color: '#4CAF50', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusActive: { fontSize: 12, backgroundColor: '#E3F2FD', color: '#2196F3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusPaused: { fontSize: 12, backgroundColor: '#F5F5F5', color: '#999', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  dropHint: { fontSize: 12, color: '#FF9800', marginLeft: 'auto' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#FF6A00', alignItems: 'center' },
  actionText: { color: '#FF6A00', fontSize: 13 },
  actionDelete: { borderColor: '#ddd' },
  actionDeleteText: { color: '#999', fontSize: 13 },
});