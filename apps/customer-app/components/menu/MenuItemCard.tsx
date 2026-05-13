import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useCartStore } from '@/store/cart';

interface MenuItemCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  calories?: number;
  prepTime: number;
  isFeatured?: boolean;
  isActive: boolean;
  restaurantId: string;
}

export function MenuItemCard({
  id, name, description, price, compareAtPrice, image,
  calories, prepTime, isFeatured, isActive, restaurantId,
}: MenuItemCardProps) {
  const { add, items, increment, decrement } = useCartStore();
  const cartItem = items.find((i) => i.id === id);
  const qty = cartItem?.quantity ?? 0;

  if (!isActive) return null;

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View style={styles.info}>
          {isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>⭐ Populaire</Text>
            </View>
          )}
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.description} numberOfLines={2}>{description}</Text>

          <View style={styles.meta}>
            <Text style={styles.metaText}>🕐 {prepTime} min</Text>
            {calories != null && <Text style={styles.metaText}>🔥 {calories} kcal</Text>}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{price.toFixed(2)}€</Text>
            {compareAtPrice != null && (
              <Text style={styles.comparePrice}>{compareAtPrice.toFixed(2)}€</Text>
            )}
          </View>
        </View>

        {/* Image + qty controls */}
        <View style={styles.right}>
          <View style={styles.imageContainer}>
            {image
              ? <Image source={{ uri: image }} style={styles.image} />
              : <View style={[styles.image, styles.imagePlaceholder]}>
                  <Text style={styles.imagePlaceholderText}>🍽️</Text>
                </View>
            }
          </View>

          {qty === 0 ? (
            <TouchableOpacity
              onPress={() => add({ id, name, price, image }, restaurantId)}
              style={styles.addBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyControls}>
              <TouchableOpacity onPress={() => decrement(id)} style={styles.qtyBtn} activeOpacity={0.7}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{qty}</Text>
              <TouchableOpacity onPress={() => increment(id)} style={styles.qtyBtn} activeOpacity={0.7}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  content:     { flexDirection: 'row', gap: 12 },
  info:        { flex: 1 },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.brand[50],
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  featuredText: { fontSize: 11, color: Colors.brand[600], fontWeight: '600' },
  name:        { fontSize: 15, fontWeight: '700', color: Colors.surface[900], marginBottom: 3 },
  description: { fontSize: 13, color: Colors.surface[500], lineHeight: 18, marginBottom: 6 },
  meta:        { flexDirection: 'row', gap: 8, marginBottom: 6 },
  metaText:    { fontSize: 12, color: Colors.surface[400] },
  priceRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price:       { fontSize: 16, fontWeight: '800', color: Colors.brand[600] },
  comparePrice:{ fontSize: 13, color: Colors.surface[400], textDecorationLine: 'line-through' },

  right: { alignItems: 'center', gap: 8 },
  imageContainer: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden' },
  image:          { width: 80, height: 80 },
  imagePlaceholder: { backgroundColor: Colors.surface[100], alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { fontSize: 28 },

  addBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.brand[500],
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 24 },

  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.surface[100],
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, color: Colors.surface[900], fontWeight: '700', lineHeight: 22 },
  qtyValue:   { fontSize: 15, fontWeight: '700', color: Colors.surface[900], minWidth: 18, textAlign: 'center' },
});
