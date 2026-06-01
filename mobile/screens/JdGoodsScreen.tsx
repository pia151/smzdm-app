import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../src/api';

const ORANGE = '#FF6A00';
const TABS = [
  { id: 1, name: '好价' },
  { id: 2, name: '好券' },
  { id: 3, name: '爆款' },
  { id: 4, name: '高佣' },
  { id: 5, name: '销量' },
  { id: 6, name: '新品' },
  { id: 8, name: '低价' },
];

export default function JdGoodsScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState(1);
  const [goods, setGoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoods();
  }, [activeTab]);

  async function loadGoods() {
    setLoading(true);
    try {
      const data = await api.getJdJingfen(String(activeTab), '1', '20');
      setGoods(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function renderItem({ item }: { item: any }) {
    return (
      <TouchableOpacity style={s.card} activeOpacity={0.7}
        onPress={() => navigation.navigate('DealDetail', { id: item.skuId })}>
        <View style={s.cardInner}>
          {item.image && (
            <Image source={{ uri: item.image }} style={s.img} />
          )}
          <View style={s.content}>
            <Text style={s.title} numberOfLines={2}>{item.title}</Text>
            <View style={s.tagRow}>
              <View style={s.platformTag}><Text style={s.platformText}>京东</Text></View>
              {item.commission_rate > 0 && (
                <View style={s.commTag}><Text style={s.commText}>佣金 {item.commission_rate}%</Text></View>
              )}
            </View>
            <Text style={s.price}>¥{item.price}</Text>
            {item.original_price > item.price && (
              <Text style={s.origPrice}>¥{item.original_price}</Text>
            )}
            {item.commission > 0 && (
              <Text style={s.comm}>预估佣金 ¥{item.commission.toFixed(2)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={s.title}>京东精选</Text>
          <TouchableOpacity onPress={loadGoods} style={s.refreshBtn}>
            <Text style={s.refreshText}>🔄 刷新</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.sub}>购买可获佣金</Text>
      </View>

      <View style={s.tabBar}>
        <FlatList horizontal showsHorizontalScrollIndicator={false}
          data={TABS} keyExtractor={t => String(t.id)}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
          renderItem={({ item: tab }) => (
            <TouchableOpacity onPress={() => setActiveTab(tab.id)}
              style={[s.tabBtn, activeTab === tab.id && s.tabBtnActive]}>
              <Text style={[s.tabText, activeTab === tab.id && s.tabTextActive]}>{tab.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={ORANGE} style={{ marginTop: 40 }} />
      ) : (
        <FlatList data={goods} renderItem={renderItem} keyExtractor={i => String(i.skuId)}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ color: '#999' }}>暂无商品</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: ORANGE, paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  sub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  refreshBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  refreshText: { fontSize: 12, color: '#fff' },
  tabBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, marginRight: 8, backgroundColor: '#f5f5f5' },
  tabBtnActive: { backgroundColor: ORANGE },
  tabText: { fontSize: 12, color: '#666' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 10, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardInner: { flexDirection: 'row', padding: 12 },
  img: { width: 96, height: 96, borderRadius: 8, backgroundColor: '#f0f0f0', marginRight: 12 },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: '500', color: '#333', lineHeight: 19, marginBottom: 6 },
  tagRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  platformTag: { backgroundColor: '#FFF0E0', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  platformText: { fontSize: 10, color: ORANGE },
  commTag: { backgroundColor: '#FFF3E0', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  commText: { fontSize: 10, color: '#FF9800' },
  price: { fontSize: 18, fontWeight: 'bold', color: ORANGE, marginBottom: 2 },
  origPrice: { fontSize: 12, color: '#999', textDecorationLine: 'line-through' },
  comm: { fontSize: 10, color: '#FF9800', marginTop: 2 },
});