import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../src/api';

const ORANGE = '#FF6A00';
const ORANGE_LIGHT = '#FFF0E0';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [categories, setCategories] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [sort, setSort] = useState('new');
  const [stats, setStats] = useState({ total_deals: 0, today_deals: 0 });

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    loadDeals();
  }, [activeCategory, sort]);

  async function loadDeals() {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: '1', pageSize: '20', sort };
      if (activeCategory) params.category = String(activeCategory);
      const data = await api.getDeals(params);
      setDeals(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function timeAgo(dateStr: string) {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
    return dateStr.slice(0, 10);
  }

  function renderDeal({ item }: { item: any }) {
    const discount = item.original_price > item.price
      ? Math.round((1 - item.price / item.original_price) * 100) : 0;

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('DealDetail', { id: item.id })}
      >
        <View style={s.cardInner}>
          {item.image && (
            <Image source={{ uri: item.image }} style={s.cardImage} />
          )}
          <View style={s.cardContent}>
            <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
            <View style={s.tagRow}>
              {item.platform && (
                <View style={s.platformTag}>
                  <Text style={s.platformTagText}>{item.platform}</Text>
                </View>
              )}
              {discount > 0 && (
                <View style={s.discountTag}>
                  <Text style={s.discountTagText}>-{discount}%</Text>
                </View>
              )}
            </View>
            <View style={s.priceRow}>
              <Text style={s.price}>¥{item.price}</Text>
              {item.original_price > item.price && (
                <Text style={s.origPrice}>¥{item.original_price}</Text>
              )}
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaText}>{item.nickname || '匿名'}</Text>
              <Text style={s.metaText}>{timeAgo(item.created_at)}</Text>
              <Text style={s.metaText}>❤️ {item.like_count || 0}</Text>
              <Text style={s.metaText}>💬 {item.comment_count || 0}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>值否</Text>
            <View style={s.badge}><Text style={s.badgeText}>好价由你判断</Text></View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('JdGoods')}>
            <Text style={s.headerLink}>京东 ▸</Text>
          </TouchableOpacity>
        </View>
        <View style={s.statsRow}>
          <Text style={s.statsText}>今日 <Text style={s.statsNum}>{stats.today_deals}</Text> 条</Text>
          <Text style={s.statsText}>累计 <Text style={s.statsNum}>{stats.total_deals}</Text> 条</Text>
        </View>
      </View>

      <View style={s.sortBar}>
        <TouchableOpacity onPress={() => setSort('new')}
          style={[s.sortBtn, sort === 'new' && s.sortBtnActive]}>
          <Text style={[s.sortBtnText, sort === 'new' && s.sortBtnTextActive]}>最新</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSort('hot')}
          style={[s.sortBtn, sort === 'hot' && s.sortBtnActive]}>
          <Text style={[s.sortBtnText, sort === 'hot' && s.sortBtnTextActive]}>最热</Text>
        </TouchableOpacity>
        <Text style={s.sortCount}>共 {stats.total_deals} 个好价</Text>
      </View>

      {/* 分类横向滚动 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categoryBar}>
        <TouchableOpacity onPress={() => setActiveCategory(null)}
          style={[s.catBtn, activeCategory === null && s.catBtnActive]}>
          <Text style={[s.catBtnText, activeCategory === null && s.catBtnTextActive]}>全部</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity key={cat.id} onPress={() => setActiveCategory(cat.id)}
            style={[s.catBtn, activeCategory === cat.id && s.catBtnActive]}>
            <Text style={[s.catBtnText, activeCategory === cat.id && s.catBtnTextActive]}>
              {cat.icon} {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color={ORANGE} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={deals}
          renderItem={renderDeal}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 80 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text style={{ color: '#999', marginTop: 12 }}>这里还没有好价</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: ORANGE, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  badge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, color: 'rgba(255,255,255,0.9)' },
  headerLink: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  statsText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  statsNum: { color: '#fff', fontWeight: 'bold' },
  sortBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, marginRight: 8 },
  sortBtnActive: { backgroundColor: ORANGE },
  sortBtnText: { fontSize: 13, color: '#666' },
  sortBtnTextActive: { color: '#fff' },
  sortCount: { marginLeft: 'auto', fontSize: 11, color: '#999' },
  categoryBar: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', maxHeight: 44 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginRight: 8, backgroundColor: '#f5f5f5' },
  catBtnActive: { backgroundColor: ORANGE_LIGHT, borderWidth: 1, borderColor: '#FFD6A0' },
  catBtnText: { fontSize: 12, color: '#666' },
  catBtnTextActive: { color: ORANGE },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 10, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardInner: { flexDirection: 'row', padding: 12 },
  cardImage: { width: 96, height: 96, borderRadius: 8, backgroundColor: '#f0f0f0', marginRight: 12 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '500', color: '#333', lineHeight: 19, marginBottom: 6 },
  tagRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  platformTag: { backgroundColor: '#FFF0E0', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  platformTagText: { fontSize: 10, color: ORANGE },
  discountTag: { backgroundColor: '#FFF0E0', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  discountTagText: { fontSize: 10, color: ORANGE },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 6 },
  price: { fontSize: 18, fontWeight: 'bold', color: ORANGE },
  origPrice: { fontSize: 12, color: '#999', textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  metaText: { fontSize: 10, color: '#999' },
});