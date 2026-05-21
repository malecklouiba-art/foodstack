import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { Colors } from '@/constants/Colors';
import { useCartStore } from '@/store/cart';
import AsyncStorage from '@react-native-async-storage/async-storage';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

function CartTabIcon({ focused }: { focused: boolean }) {
  const count = useCartStore((s) => s.count());
  return (
    <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
      <View>
        <Text style={styles.emoji}>🛒</Text>
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>Panier</Text>
    </View>
  );
}

function NotifTabIcon({ focused }: { focused: boolean }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchUnread = async () => {
      try {
        const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
        const token = await AsyncStorage.getItem('auth_token').catch(() => null);
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_URL}/api/v1/notifications`, { headers });
        if (res.ok) {
          const data = (await res.json()) as { read: boolean }[];
          if (mounted) setUnread(data.filter((n) => !n.read).length);
        }
      } catch {
        // silently ignore
      }
    };
    void fetchUnread();
    return () => { mounted = false; };
  }, [focused]);

  return (
    <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
      <View>
        <Text style={styles.emoji}>🔔</Text>
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>Alertes</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Accueil" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🍽️" label="Menu" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarIcon: ({ focused }) => <CartTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📦" label="Commandes" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ focused }) => <NotifTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profil" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 72,
    backgroundColor: '#fff',
    borderTopColor: Colors.surface[100],
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  tabItem: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tabItemFocused: { backgroundColor: Colors.brand[50] },
  emoji:          { fontSize: 22 },
  tabLabel:       { fontSize: 10, color: Colors.surface[400], fontWeight: '500' },
  tabLabelFocused:{ color: Colors.brand[600] },
  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: Colors.brand[500],
    borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
