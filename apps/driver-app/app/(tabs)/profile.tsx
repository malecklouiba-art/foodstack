import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useDriverStore } from '@/store/driver';

export default function DriverProfileScreen() {
  const { todayEarnings, todayDeliveries, rating } = useDriverStore();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile hero */}
        <LinearGradient
          colors={[Colors.brand[700], Colors.brand[500]]}
          style={styles.hero}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>MA</Text>
          </View>
          <Text style={styles.heroName}>Mohammed Alami</Text>
          <Text style={styles.heroSub}>Livreur · Depuis mars 2025</Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>247</Text>
              <Text style={styles.heroStatLabel}>livraisons</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{rating}</Text>
              <Text style={styles.heroStatLabel}>note</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>1 847€</Text>
              <Text style={styles.heroStatLabel}>total</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Vehicle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Véhicule</Text>
          <View style={styles.menuCard}>
            <View style={styles.vehicleRow}>
              <Text style={styles.vehicleEmoji}>🛵</Text>
              <View>
                <Text style={styles.vehicleName}>Yamaha NMAX 125</Text>
                <Text style={styles.vehiclePlate}>AB-123-CD</Text>
              </View>
              <TouchableOpacity style={styles.editChip}>
                <Text style={styles.editChipText}>Modifier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents</Text>
          <View style={styles.menuCard}>
            {[
              { label: "Permis de conduire", status: '✅ Validé' },
              { label: "Assurance véhicule", status: '✅ Valide jusqu\'au 03/2027' },
              { label: "Carte d'identité", status: '✅ Validée' },
              { label: "KBIS / Statut", status: '✅ Auto-entrepreneur' },
            ].map((doc, idx, arr) => (
              <View key={doc.label} style={[styles.docRow, idx < arr.length - 1 && styles.docRowBorder]}>
                <Text style={styles.docLabel}>{doc.label}</Text>
                <Text style={styles.docStatus}>{doc.status}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          <View style={styles.menuCard}>
            {[
              { icon: '🔔', label: 'Notifications' },
              { icon: '🌍', label: 'Zone de livraison' },
              { icon: '💳', label: 'Virement bancaire' },
              { icon: '❓', label: 'Aide & Support' },
            ].map((item, idx, arr) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuRow, idx < arr.length - 1 && styles.menuRowBorder]}
                activeOpacity={0.7}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.signOutBtn}
            activeOpacity={0.85}
            onPress={() =>
              Alert.alert('Déconnexion', 'Vous serez déconnecté.', [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Se déconnecter', style: 'destructive', onPress: () => router.replace('/(auth)/login') },
              ])
            }
          >
            <Text style={styles.signOutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface[50] },

  hero:       { paddingTop: 28, paddingBottom: 24, alignItems: 'center', gap: 4 },
  avatar:     { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '900' },
  heroName:   { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroSub:    { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500', marginBottom: 16 },
  heroStats:  { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12 },
  heroStat:   { alignItems: 'center', paddingHorizontal: 16 },
  heroStatValue:{ color: '#fff', fontSize: 18, fontWeight: '800' },
  heroStatLabel:{ color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
  heroStatDivider:{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' },

  section:      { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.surface[400], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },

  menuCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },

  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  vehicleEmoji:{ fontSize: 28 },
  vehicleName: { fontSize: 15, fontWeight: '700', color: Colors.surface[900] },
  vehiclePlate:{ fontSize: 13, color: Colors.surface[500], marginTop: 2 },
  editChip:    { marginLeft: 'auto', borderWidth: 1, borderColor: Colors.surface[200], borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  editChipText:{ fontSize: 12, color: Colors.surface[600], fontWeight: '600' },

  docRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  docRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.surface[100] },
  docLabel:     { fontSize: 14, color: Colors.surface[700] },
  docStatus:    { fontSize: 12, color: Colors.brand[600], fontWeight: '600', flex: 1, textAlign: 'right' },

  menuRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.surface[100] },
  menuIcon:      { fontSize: 18 },
  menuLabel:     { flex: 1, fontSize: 15, color: Colors.surface[900], fontWeight: '500' },
  menuChevron:   { fontSize: 20, color: Colors.surface[300] },

  signOutBtn:  { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2' },
  signOutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
});
