import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import AggregateSearchScreen from './screens/AggregateSearchScreen';
import SubmitScreen from './screens/SubmitScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import ProfileScreen from './screens/ProfileScreen';
import DealDetailScreen from './screens/DealDetailScreen';
import JdGoodsScreen from './screens/JdGoodsScreen';
import AlertsScreen from './screens/AlertsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    '首页': '🏠',
    '搜索': '🔍',
    '爆料': '✏️',
    '收藏': '⭐',
    '提醒': '🔔',
    '我的': '👤',
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{icons[label] || '📄'}</Text>
      <Text style={{
        fontSize: 10,
        color: focused ? '#FF6A00' : '#999',
        marginTop: 2,
      }}>{label}</Text>
    </View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
        tabBarLabel: () => null,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f0f0f0',
          height: 56,
          paddingBottom: 4,
        },
        tabBarActiveTintColor: '#FF6A00',
        tabBarInactiveTintColor: '#999',
      })}
    >
      <Tab.Screen name="首页" component={HomeScreen} />
      <Tab.Screen name="搜索" component={AggregateSearchScreen} />
      <Tab.Screen name="爆料" component={SubmitScreen} />
      <Tab.Screen name="收藏" component={FavoritesScreen} />
      <Tab.Screen name="提醒" component={AlertsScreen} />
      <Tab.Screen name="我的" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="DealDetail" component={DealDetailScreen} />
        <Stack.Screen name="JdGoods" component={JdGoodsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}