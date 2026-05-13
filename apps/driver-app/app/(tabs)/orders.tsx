import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

interface DeliveryRecord {
  id: string;
  number: string;
  date: string;
  restaurantName: string;
  customerAddress: string;
  earnings: number;
  distanceKm: number;
  durationMin: number;
  rating?: number;
}

const HISTORY: DeliveryRecord[] = [
  { id: 'd1', number: '#3011', date: '13 mai 2026, 11:42', restaurantName: 'FoodStack Paris 1', customerAddress: '5 rue Montmartre, Paris', earnings: 6.20, distanceKm: 1.8, durationMin: 11, rating: 5 },
  { id: 'd2', number: '#3009', date: '13 mai 2026, 10:05', restaurantName: 'FoodStack Paris 1', customerAddress: '18 avenue Opéra, Paris', earnings: 5.50, distanceKm: 1.2, durationMin: 7, rating: 5 },
  { id: 'd3', number: '#2998', date: '12 mai 2026, 19:33', restaurantName: 'FoodStack Paris 2', customerAddress: '33 rue Beaubourg, Paris', earnings: 8.30, distanceKm: 2.6, durationMin: 18, rating: 4 },
  { id: 'd4', number: '#2991', date: '12 mai 2026, 18:01', restaurantName: 'FoodStack Paris 2', customerAddress: '9 rue de Bretagne, Paris', earnings: 6.80, distanceKm: 1.9, durationMin: 12, rating: 5 },
  { id: 'd5', number: '#2985', date: '12 mai 2026, 12:44', restaurantName: 'FoodStack Paris 1', customerAddress: '27 bd des Capucines, Paris', earnings: 7.70, distanceKm: 2.3, durationMin: 15, rating: 4 },
];

export default function OrdersScreen() {
  const [selected, setSelected] = useState<DeliveryRecord | null>(null);

  const totalEarnings = HISTORY.reduce((s, d) => s + d.earnings, 0);
  const avgRating = (HISTORY.filter((d) => d.rating).reduce((s, d) => s + (d.rating ?? 0), 0) / HISTORY.filter((d) => d.rating).length).toFixed(1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{HISTORY.length}</Text>
            <Text style={styles.summaryLabel}>livraisons</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalEarnings.toFixed(2)}€</Text>
            <Text style={styles.summaryLabel}>gagnés</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>⭐ {avgRating}</Text>
            <Text style={styles.summaryLabel}>note moy.</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={HISTORY}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelected(item)} activeOpacity={0.8}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardNum}>{item.number}</Text>
              <Text style={styles.cardRestaurant}>{item.restaurantName}</Text>
              <Text style={styles.cardAddress} numberOfLines={1}>{item.customerAddress}</Text>
              <Text style={styles.cardDate}>{item.date}</Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.cardEarnings}>{item.earnings.toFixed(2)}€</Text>
              <Text style={styles.cardMeta}>{item.distanceKm} km</Text>
              {item.rating && <Text style={styles.cardRating}>{'⭐'.repeat(item.rating)}</Text>}
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <SafeAreaView style={styles.modalSafe} edges={['top']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Livraison {selected.number}</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Restaurant</Text><Text style={styles.detailValue}>{selected.restaurantName}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Destination</Text><Text style={styles.detailValue}>{selected.customerAddress}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Distance</Text><Text style={styles.detailValue}>{selected.distanceKm} km</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Durée</Text><Text style={styles.detailValue}>{selected.durationMin} min</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Date</Text><Text style={styles.detailValue}>{selected.date}</Text></View>
              {selected.rating && <View style={styles.detailRow}><Text style={styles.detailLabel}>Note client</Text><Text style={styles.detailValue}>{'⭐'.repeat(selected.rating)} ({selected.rating}/5)</Text></View>}
              <View style={[styles.detailRow, styles.earningsRow]}>
                <Text style={styles.detailLabel}>Gains</Text>
                <Text style={styles.earningsValue}>{selected.earnings.toFixed(2)}€</Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.surface[50] },

  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  title:  { fontSize: 26, fontWeight: '800', color: Colors.surface[900], marginBottom: 14 },
  summaryRow:  { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue:{ fontSize: 16, fontWeight: '800', color: Colors.surface[900] },
  summaryLabel:{ fontSize: 11, color: Colors.surface[400], marginTop: 2 },
  divider:     { width: 1, backgroundColor: Colors.surface[100] },

  list: { paddingHorizontal: 16, paddingBottom: 100 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  cardLeft:       { flex: 1 },
  cardNum:        { fontSize: 15, fontWeight: '800', color: Colors.surface[900], marginBottom: 2 },
  cardRestaurant: { fontSize: 13, color: Colors.brand[600], fontWeight: '600', marginBottom: 2 },
  cardAddress:    { fontSize: 13, color: Colors.surface[500], marginBottom: 4 },
  cardDate:       { fontSize: 11, color: Colors.surface[400] },
  cardRight:      { alignItems: 'flex-end', gap: 3 },
  cardEarnings:   { fontSize: 18, fontWeight: '900', color: Colors.brand[600] },
  cardMeta:       { fontSize: 12, color: Colors.surface[400] },
  cardRating:     { fontSize: 11 },

  modalSafe:   { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.surface[100] },
  modalTitle:  { fontSize: 20, fontWeight: '800', color: Colors.surface[900] },
  modalClose:  { fontSize: 18, color: Colors.surface[400], padding: 4 },
  modalBody:   { padding: 20, gap: 4 },
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.surface[50] },
  detailLabel: { fontSize: 14, color: Colors.surface[500] },
  detailValue: { fontSize: 14, fontWeight: '600', color: Colors.surface[900], flex: 1, textAlign: 'right' },
  earningsRow: { borderBottomWidth: 0, marginTop: 8 },
  earningsValue:{ fontSize: 24, fontWeight: '900', color: Colors.brand[600] },
});
