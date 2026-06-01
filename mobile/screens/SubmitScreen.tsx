import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ORANGE = '#FF6A00';

export default function SubmitScreen() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>爆料好价</Text>
        <Text style={s.sub}>分享你发现的优惠信息</Text>
      </View>
      <View style={{ alignItems: 'center', paddingTop: 80 }}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>✏️</Text>
        <Text style={{ color: '#999', marginBottom: 6 }}>APP端爆料功能即将推出</Text>
        <Text style={{ color: '#ccc', fontSize: 12 }}>请先在网页版提交爆料</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: ORANGE, paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
});