import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useNotificationBadge } from '@/hooks/useNotificationBadge';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
    </View>
  );
}

function NotificationsTabIcon({ focused }: { focused: boolean }) {
  const unreadCount = useNotificationBadge();
  return (
    <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
      <View style={styles.badgeWrapper}>
        <Text style={styles.emoji}>🔔</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, focused && styles.labelFocused]}>Alertes</Text>
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
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Accueil" focused={focused} /> }}
      />
      <Tabs.Screen
        name="orders"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Commandes" focused={focused} /> }}
      />
      <Tabs.Screen
        name="earnings"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="💰" label="Gains" focused={focused} /> }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ tabBarIcon: ({ focused }) => <NotificationsTabIcon focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profil" focused={focused} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 72, backgroundColor: '#fff',
    borderTopColor: Colors.surface[100], borderTopWidth: 1,
    paddingTop: 6, paddingBottom: 8, elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 12,
  },
  tabItem:       { alignItems: 'center', gap: 2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  tabItemFocused:{ backgroundColor: Colors.brand[50] },
  emoji:         { fontSize: 22 },
  label:         { fontSize: 10, color: Colors.surface[400], fontWeight: '500' },
  labelFocused:  { color: Colors.brand[600] },

  badgeWrapper:  { position: 'relative' },
  badge: {
    position: 'absolute', top: -4, right: -8,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: '#fff',
  },
  badgeText:     { color: '#fff', fontSize: 9, fontWeight: '800' },
});
