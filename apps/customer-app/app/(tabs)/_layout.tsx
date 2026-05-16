import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useCartStore } from '@/store/cart';

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
