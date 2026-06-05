import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const API_BASE = 'http://10.0.2.2:3001/api'; // Android模拟器用10.0.2.2访问宿主机

const PLATFORM_ICONS: Record<string, string> = {
  '京东': '🛒',
  '天猫': '👑',
  '淘宝': '🛍️',
  '拼多多': '💰',
};

export default function AggregateSearchScreen() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigation = useNavigation<any>();

  async function handleSearch() {
    if (!keyword.trim()) return;
    setSearched(true);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/aggregate/search?q=${encodeURIComponent(keyword)}`);
      const data = await res.json();
      setResults(data.items || []);
    } catch (err) {
      console.error('搜索失败:', err);
    } finally {
      setLoading(false);
    }
  }

  function getPlatformIcon(p: string) {
    return PLATFORM_ICONS[p] || '🏪';
  }

  const hotKeywords = ['iPhone', '茅台', 'AJ', '神仙水', 'Switch', 'MacBook', '戴森'];

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.title}>🔍 多平台搜索</Text>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.input}
            value={keyword}
            onChangeText={setKeyword}
            placeholder="搜索全网好价..."
            placeholderTextColor="#999"
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>搜索</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#FF6A00" />
          </View>
        )}

        {!loading && searched && results.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>未找到相关好价</Text>
          </View>
        )}

        {!loading && results.length > 0 && (
          <>
            <Text style={styles.resultCount}>共 {results.length} 个好价</Text>
            {results.map((item, index) => (
              <TouchableOpacity
                key={item.id || index}
                style={styles.itemCard}
                onPress={() => {
                  if (item.url) {
                    // 可以用 Linking.openURL(item.url)
                  }
                }}
              >
                <View style={styles.itemImage}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.image} />
                  ) : (
                    <Text style={styles.placeholderIcon}>{getPlatformIcon(item.platform)}</Text>
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>¥{item.price}</Text>
                    {item.original_price > item.price && (
                      <Text style={styles.originalPrice}>¥{item.original_price}</Text>
                    )}
                    {item.discount > 0 && (
                      <Text style={styles.discount}>{item.discount}折</Text>
                    )}
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.platform}>{getPlatformIcon(item.platform)} {item.platform}</Text>
                    {item.sales > 0 && (
                      <Text style={styles.sales}>已售 {item.sales}</Text>
                    )}
                  </View>
                  {item.coupon && (
                    <Text style={styles.coupon}>🎫 {item.coupon}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {!searched && (
          <View style={styles.hotSearch}>
            <Text style={styles.hotTitle}>👇 热门搜索</Text>
            <View style={styles.hotTags}>
              {hotKeywords.map(kw => (
                <TouchableOpacity
                  key={kw}
                  style={styles.hotTag}
                  onPress={() => setKeyword(kw)}
                >
                  <Text style={styles.hotTagText}>{kw}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#FF6A00', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  searchBox: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, height: 40, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, fontSize: 14 },
  searchBtn: { backgroundColor: '#fff', paddingHorizontal: 20, borderRadius: 20, justifyContent: 'center' },
  searchBtnText: { color: '#FF6A00', fontWeight: '600' },
  content: { flex: 1 },
  loading: { padding: 50, alignItems: 'center' },
  empty: { alignItems: 'center', padding: 50 },
  emptyIcon: { fontSize: 50 },
  emptyText: { color: '#999', marginTop: 10 },
  resultCount: { padding: 12, color: '#999', fontSize: 12 },
  itemCard: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 10, borderRadius: 12, padding: 12, gap: 12 },
  itemImage: { width: 80, height: 80, backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  image: { width: 80, height: 80 },
  placeholderIcon: { fontSize: 30 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 14, color: '#333', lineHeight: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6 },
  price: { fontSize: 18, fontWeight: 'bold', color: '#FF6A00' },
  originalPrice: { fontSize: 12, color: '#999', textDecorationLine: 'line-through' },
  discount: { fontSize: 10, backgroundColor: '#FFF0E0', color: '#FF6A00', paddingHorizontal: 4, borderRadius: 4 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  platform: { fontSize: 11, color: '#666' },
  sales: { fontSize: 11, color: '#999' },
  coupon: { fontSize: 11, color: '#FF6A00', backgroundColor: '#FFF0E0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  hotSearch: { padding: 20 },
  hotTitle: { color: '#666', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  hotTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  hotTag: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  hotTagText: { fontSize: 14, color: '#666' },
});