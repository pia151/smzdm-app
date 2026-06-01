import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ORANGE = '#FF6A00';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>个人中心</Text>
      </View>

      {/* 快捷入口 */}
      <View style={s.menuSection}>
        <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate('JdGoods')}>
          <Text style={s.menuIcon}>🛒</Text>
          <Text style={s.menuText}>京东精选</Text>
          <Text style={s.menuArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.menuItem}>
          <Text style={s.menuIcon}>📱</Text>
          <Text style={s.menuText}>版本信息</Text>
          <Text style={s.menuValue}>v1.0.0</Text>
        </TouchableOpacity>
      </View>

      <View style={s.infoBox}>
        <Text style={s.infoTitle}>🤖 自动同步</Text>
        <Text style={s.infoText}>京东商品每4小时自动同步，价格实时更新</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: ORANGE, paddingTop: 48, paddingBottom: 24, paddingHorizontal: 16, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  menuSection: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 10, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuText: { flex: 1, fontSize: 14, color: '#333' },
  menuArrow: { fontSize: 14, color: '#ccc' },
  menuValue: { fontSize: 12, color: '#999' },
  infoBox: { marginHorizontal: 16, marginTop: 16, backgroundColor: ORANGE + '10', borderRadius: 10, padding: 16 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: ORANGE, marginBottom: 6 },
  infoText: { fontSize: 12, color: '#666', lineHeight: 18 },
});