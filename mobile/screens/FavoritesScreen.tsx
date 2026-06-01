import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ORANGE = '#FF6A00';

export default function FavoritesScreen() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>我的收藏</Text>
      </View>
      <View style={{ alignItems: 'center', paddingTop: 80 }}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>⭐</Text>
        <Text style={{ color: '#999', marginBottom: 6 }}>登录后查看收藏</Text>
        <Text style={{ color: '#ccc', fontSize: 12 }}>收藏你感兴趣的好价</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: ORANGE, paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
});