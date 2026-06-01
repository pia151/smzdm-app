import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, TextInput,
  TouchableOpacity, StyleSheet, ActivityIndicator, Linking,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { api } from '../src/api';

const ORANGE = '#FF6A00';
const ORANGE_LIGHT = '#FFF0E0';

export default function DealDetailScreen() {
  const route = useRoute<any>();
  const { id } = route.params;
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getDeal(id)
        .then(setDeal)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  function timeAgo(dateStr: string) {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
    return dateStr.slice(0, 10);
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={ORANGE} />
      </View>
    );
  }

  if (!deal) {
    return (
      <View style={s.center}>
        <Text style={{ fontSize: 48 }}>😢</Text>
        <Text style={{ color: '#999', marginTop: 12 }}>好价不存在</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container}>
      {/* 回到首页按钮 */}
      <TouchableOpacity style={s.backBtn} onPress={() => {}}>
        <Text style={s.backBtnText}>← 返回</Text>
      </TouchableOpacity>

      {deal.image && (
        <Image source={{ uri: deal.image }} style={s.image} />
      )}

      <View style={s.content}>
        <Text style={s.title}>{deal.title}</Text>

        <View style={s.priceRow}>
          <Text style={s.price}>¥{deal.price}</Text>
          {deal.original_price > deal.price && (
            <>
              <Text style={s.origPrice}>¥{deal.original_price}</Text>
              <View style={s.discountBadge}>
                <Text style={s.discountText}>-{deal.discount_percent || Math.round((1 - deal.price / deal.original_price) * 100)}%</Text>
              </View>
            </>
          )}
        </View>

        <View style={s.metaRow}>
          {deal.platform && <Text style={s.platform}>{deal.platform}</Text>}
          <Text style={s.meta}>爆料: {deal.nickname || '匿名'}</Text>
          <Text style={s.meta}>{timeAgo(deal.created_at)}</Text>
        </View>

        {deal.content && (
          <View style={s.contentBox}>
            <Text style={s.contentText}>{deal.content}</Text>
          </View>
        )}

        {deal.coupon_info && (
          <View style={s.couponBox}>
            <Text style={s.couponLabel}>优惠券/口令</Text>
            <Text style={s.couponCode}>{deal.coupon_info}</Text>
          </View>
        )}

        {/* 去购买链接 */}
        {deal.source_url && (
          <TouchableOpacity style={s.buyBtn} onPress={() => Linking.openURL(deal.source_url)}>
            <Text style={s.buyBtnText}>去购买 → {deal.platform || '前往'}</Text>
          </TouchableOpacity>
        )}

        {/* 评论区 */}
        <View style={s.commentSection}>
          <Text style={s.commentTitle}>评论 ({deal.comments?.length || 0})</Text>
          {deal.comments?.map((comment: any) => (
            <View key={comment.id} style={s.commentItem}>
              <Text style={s.commentName}>{comment.nickname || '匿名'}</Text>
              <Text style={s.commentContent}>{comment.content}</Text>
            </View>
          ))}
          {(!deal.comments || deal.comments.length === 0) && (
            <Text style={{ color: '#ccc', textAlign: 'center', paddingVertical: 16, fontSize: 12 }}>
              暂无评论
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  backBtn: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtnText: { fontSize: 14, color: '#666' },
  image: { width: '100%', height: 240, backgroundColor: '#f0f0f0' },
  content: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333', lineHeight: 24, marginBottom: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
  price: { fontSize: 28, fontWeight: 'bold', color: ORANGE },
  origPrice: { fontSize: 14, color: '#999', textDecorationLine: 'line-through' },
  discountBadge: { backgroundColor: ORANGE_LIGHT, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  discountText: { fontSize: 11, color: ORANGE },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  platform: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: ORANGE_LIGHT, color: ORANGE, overflow: 'hidden' },
  meta: { fontSize: 11, color: '#999' },
  contentBox: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, marginBottom: 16 },
  contentText: { fontSize: 13, color: '#666', lineHeight: 20 },
  couponBox: { backgroundColor: ORANGE_LIGHT, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: '#FFD6A0' },
  couponLabel: { fontSize: 11, color: '#999', marginBottom: 4 },
  couponCode: { fontSize: 13, color: ORANGE, fontWeight: '600' },
  buyBtn: { backgroundColor: ORANGE, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 24 },
  buyBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  commentSection: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 16 },
  commentTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 },
  commentItem: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  commentName: { fontSize: 12, fontWeight: '500', color: '#666', marginBottom: 4 },
  commentContent: { fontSize: 13, color: '#333' },
});