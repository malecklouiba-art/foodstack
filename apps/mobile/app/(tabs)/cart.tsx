import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/store/cart';

export default function CartScreen() {
  const router = useRouter();
  const { items, removeItem, updateQty, clearCart, total } = useCartStore();

  const handleCheckout = () => {
    if (items.length === 0) return;
    Alert.alert(
      'Commander',
      `Confirmer votre commande de ${total().toFixed(2)} € ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            clearCart();
            Alert.alert('Commande passée !', 'Votre commande a été envoyée au restaurant.', [
              { text: 'OK', onPress: () => router.replace('/(tabs)/') },
            ]);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#f1f5f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon panier</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={() => clearCart()} style={styles.clearBtn}>
            <Text style={styles.clearText}>Vider</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Panier vide</Text>
          <Text style={styles.emptySubtitle}>Ajoutez des articles depuis le menu</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.replace('/(tabs)/menu' as never)}
            activeOpacity={0.8}
          >
            <Text style={styles.browseBtnText}>Parcourir le menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
            {/* Restaurant info */}
            <View style={styles.restaurantBanner}>
              <Ionicons name="storefront-outline" size={16} color="#f97316" />
              <Text style={styles.restaurantName}>{items[0].restaurantName}</Text>
            </View>

            {/* Items */}
            {items.map((item) => (
              <View key={item.menuItemId} style={styles.cartItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{(item.price * item.qty).toFixed(2)} €</Text>
                </View>
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQty(item.menuItemId, item.qty - 1)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="remove" size={16} color="#f1f5f9" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.qty}</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, styles.qtyBtnAdd]}
                    onPress={() => updateQty(item.menuItemId, item.qty + 1)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Order summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sous-total</Text>
                <Text style={styles.summaryValue}>{total().toFixed(2)} €</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Frais de livraison</Text>
                <Text style={styles.summaryValueGreen}>Gratuit</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{total().toFixed(2)} €</Text>
              </View>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* Checkout button */}
          <View style={styles.checkoutContainer}>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={handleCheckout}
              activeOpacity={0.9}
            >
              <Text style={styles.checkoutBtnText}>Commander • {total().toFixed(2)} €</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    backgroundColor: '#1e293b',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
  clearBtn: { padding: 8 },
  clearText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#f1f5f9', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 32 },
  browseBtn: {
    backgroundColor: '#f97316',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  browseBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  scrollView: { flex: 1 },

  restaurantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  restaurantName: { fontSize: 14, fontWeight: '600', color: '#f1f5f9' },

  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#f1f5f9', marginBottom: 4 },
  itemPrice: { fontSize: 14, color: '#f97316', fontWeight: '700' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    backgroundColor: '#334155',
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnAdd: { backgroundColor: '#f97316' },
  qtyText: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', minWidth: 20, textAlign: 'center' },

  summaryCard: {
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: { fontSize: 14, color: '#94a3b8' },
  summaryValue: { fontSize: 14, color: '#f1f5f9', fontWeight: '600' },
  summaryValueGreen: { fontSize: 14, color: '#4ade80', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#334155', marginBottom: 12 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#f97316' },

  checkoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  checkoutBtn: {
    backgroundColor: '#f97316',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  bottomPadding: { height: 20 },
});
