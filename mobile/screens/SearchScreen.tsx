import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../src/api';

const ORANGE = '#FF6A00';

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.getDeals({ search: query.trim(), sort: 'new' });
      setResults(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function renderItem({ item }: { item: any }) {
    return (
      <TouchableOpacity style={s.card} activeOpacity={0.7}
        onPress={() => navigation.navigate('DealDetail', { id: item.id })}>
        <View style={s.cardInner}>
          {item.image && <Image source={{ uri: item.image }} style={s.img} />}
          <View style={s.content}>
            <Text style={s.title} numberOfLines={2}>{item.title}</Text>
            <Text style={s.price}>¥{item.price}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.searchBar}>
          <TextInput
            style={s.input}
            placeholder="搜索商品、好价..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={doSearch}
            returnKeyType="search"
            autoFocus
          />
          <TouchableOpacity onPress={doSearch} style={s.searchBtn}>
            <Text style={s.searchBtnText}>搜索</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={ORANGE} style={{ marginTop: 40 }} />
      ) : searched ? (
        results.length > 0 ? (
          <FlatList data={results} renderItem={renderItem} keyExtractor={i => i.id}
            contentContainerStyle={{ padding: 12, paddingBottom: 80 }} />
        ) : (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 40 }}>🔍</Text>
            <Text style={{ color: '#999', marginTop: 12 }}>没有找到相关好价</Text>
          </View>
        )
      ) : (
        <View style={{ alignItems: 'center', paddingTop: 60 }}>
          <Text style={{ fontSize: 40 }}>👆</Text>
          <Text style={{ color: '#999', marginTop: 12 }}>输入关键词搜索好价</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: ORANGE, paddingTop: 48, paddingBottom: 12, paddingHorizontal: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  searchBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  searchBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 8, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardInner: { flexDirection: 'row', padding: 12 },
  img: { width: 72, height: 72, borderRadius: 8, backgroundColor: '#f0f0f0', marginRight: 12 },
  content: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 6 },
  price: { fontSize: 18, fontWeight: 'bold', color: ORANGE },
});