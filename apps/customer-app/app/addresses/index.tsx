import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/hooks/useApi';

// ─── Types ────────────────────────────────────────────────────────────────────

type AddressLabel = 'Maison' | 'Bureau' | 'Autre';

interface Address {
  id: string;
  label: AddressLabel;
  address: string;
  isDefault: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_ADDRESSES: Address[] = [
  { id: 'a1', label: 'Maison', address: '12 rue de la Paix, 75001 Paris', isDefault: true },
  { id: 'a2', label: 'Bureau', address: '45 avenue des Champs, 75008 Paris', isDefault: false },
];

const LABEL_OPTIONS: AddressLabel[] = ['Maison', 'Bureau', 'Autre'];

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonLeft}>
        <View style={styles.skeletonLabel} />
        <View style={styles.skeletonText} />
      </View>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AddressesScreen() {
  const api = useApi();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formLabel, setFormLabel] = useState<AddressLabel>('Maison');
  const [formAddress, setFormAddress] = useState('');
  const [saving, setSaving] = useState(false);

  // ─── Data loading ───────────────────────────────────────────────────────────

  function mapAddr(a: any): Address {
    return {
      id: a.id,
      label: a.label as AddressLabel,
      address: a.address ?? [a.street, a.city, a.postalCode].filter(Boolean).join(', '),
      isDefault: a.isDefault,
    };
  }

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<any[]>('/api/v1/users/me/addresses');
      setAddresses(data.map(mapAddr));
    } catch {
      // API unavailable — fall back to mock data
      setAddresses(MOCK_ADDRESSES);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadAddresses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Retry after error ──────────────────────────────────────────────────────

  const handleRetry = () => {
    setError(null);
    loadAddresses();
  };

  // ─── Set default ────────────────────────────────────────────────────────────

  const handleSetDefault = (addr: Address) => {
    // Optimistic update
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === addr.id })),
    );
    api
      .patch<Address>(`/api/v1/users/me/addresses/${addr.id}`, { isDefault: true })
      .catch(() => {
        // Revert on failure
        setAddresses((prev) =>
          prev.map((a) => ({ ...a, isDefault: a.id === addr.id ? false : a.isDefault })),
        );
        Alert.alert('Erreur', 'Impossible de définir l\'adresse par défaut.');
      });
  };

  // ─── Delete (soft-delete via PATCH) ─────────────────────────────────────────

  const handleDelete = (addr: Address) => {
    Alert.alert(
      'Supprimer cette adresse',
      `Supprimer « ${addr.label} » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            // Optimistic update
            setAddresses((prev) => prev.filter((a) => a.id !== addr.id));
            api
              .patch<Address>(`/api/v1/users/me/addresses/${addr.id}`, { deleted: true })
              .catch(() => {
                // Revert on failure
                setAddresses((prev) => [...prev, addr].sort((a, b) => a.id.localeCompare(b.id)));
                Alert.alert('Erreur', 'Impossible de supprimer l\'adresse.');
              });
          },
        },
      ],
    );
  };

  // ─── Modal helpers ──────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingAddress(null);
    setFormLabel('Maison');
    setFormAddress('');
    setModalVisible(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setFormLabel(addr.label);
    setFormAddress(addr.address);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingAddress(null);
  };

  // ─── Save (create or update) ─────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formAddress.trim()) {
      Alert.alert('Adresse requise', 'Veuillez saisir une adresse.');
      return;
    }
    setSaving(true);
    try {
      if (editingAddress) {
        // Optimistic update
        const updated: Address = { ...editingAddress, label: formLabel, address: formAddress.trim() };
        setAddresses((prev) => prev.map((a) => (a.id === editingAddress.id ? updated : a)));
        closeModal();
        await api.patch<Address>(`/api/v1/users/me/addresses/${editingAddress.id}`, {
          label: formLabel,
          address: formAddress.trim(),
        });
      } else {
        // Optimistic: create temp entry
        const tempId = `temp-${Date.now()}`;
        const tempAddr: Address = {
          id: tempId,
          label: formLabel,
          address: formAddress.trim(),
          isDefault: addresses.length === 0,
        };
        setAddresses((prev) => [...prev, tempAddr]);
        closeModal();
        const created = await api.post<any>('/api/v1/users/me/addresses', {
          label: formLabel,
          address: formAddress.trim(),
        });
        // Replace temp with real
        setAddresses((prev) => prev.map((a) => (a.id === tempId ? mapAddr(created) : a)));
      }
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer l\'adresse.');
      if (!editingAddress) {
        // Remove optimistic temp entry
        setAddresses((prev) => prev.filter((a) => !a.id.startsWith('temp-')));
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes adresses</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Body */}
      {loading ? (
        <ScrollView contentContainerStyle={styles.list}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {addresses.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📍</Text>
              <Text style={styles.emptyText}>Aucune adresse enregistrée</Text>
            </View>
          )}

          {addresses.map((addr) => (
            <TouchableOpacity
              key={addr.id}
              activeOpacity={0.85}
              onLongPress={() => handleDelete(addr)}
              delayLongPress={400}
            >
              <View style={styles.addressCard}>
                {/* Left content */}
                <View style={styles.addressLeft}>
                  <View style={styles.addressLabelRow}>
                    <Text style={styles.addressLabel}>{addr.label}</Text>
                    {addr.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Par défaut</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.addressText}>{addr.address}</Text>

                  {/* Actions row */}
                  <View style={styles.addressActions}>
                    {!addr.isDefault && (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleSetDefault(addr)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.actionBtnText}>⭐ Définir par défaut</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.editActionBtn]}
                      onPress={() => openEditModal(addr)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.editActionBtnText}>✏️ Modifier</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Add address */}
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Ajouter une adresse</Text>
          </TouchableOpacity>

          <View style={styles.hint}>
            <Text style={styles.hintText}>💡 Appui long sur une carte pour la supprimer</Text>
          </View>
        </ScrollView>
      )}

      {/* Edit / Add Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalSafe} edges={['top']}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingAddress ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
            </Text>
            <TouchableOpacity onPress={closeModal} activeOpacity={0.7}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            {/* Label picker */}
            <Text style={styles.fieldLabel}>Type d'adresse</Text>
            <View style={styles.labelPicker}>
              {LABEL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.labelOption, formLabel === opt && styles.labelOptionSelected]}
                  onPress={() => setFormLabel(opt)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.labelOptionText, formLabel === opt && styles.labelOptionTextSelected]}>
                    {opt === 'Maison' ? '🏠' : opt === 'Bureau' ? '🏢' : '📍'} {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Address input */}
            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Adresse</Text>
            <TextInput
              style={styles.textInput}
              value={formAddress}
              onChangeText={setFormAddress}
              placeholder="ex: 12 rue de la Paix, 75001 Paris"
              placeholderTextColor={Colors.surface[300]}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {editingAddress ? 'Enregistrer les modifications' : 'Ajouter'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface[50] },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface[100],
    backgroundColor: Colors.surface[0],
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.surface[900] },
  backBtn: { minWidth: 60 },
  backBtnText: { fontSize: 15, color: Colors.brand[500], fontWeight: '600' },
  headerSpacer: { minWidth: 60 },

  // List
  list: { padding: 16, gap: 10 },

  // Address card
  addressCard: {
    backgroundColor: Colors.surface[0],
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  addressLeft: { flex: 1 },
  addressLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  addressLabel: { fontSize: 15, fontWeight: '700', color: Colors.surface[900] },
  defaultBadge: {
    backgroundColor: Colors.brand[50],
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  defaultBadgeText: { fontSize: 11, color: Colors.brand[600], fontWeight: '700' },
  addressText: { fontSize: 13, color: Colors.surface[500], lineHeight: 18, marginBottom: 12 },

  // Address action buttons
  addressActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.brand[300],
    backgroundColor: Colors.brand[50],
  },
  actionBtnText: { fontSize: 12, color: Colors.brand[600], fontWeight: '600' },
  editActionBtn: {
    borderColor: Colors.surface[200],
    backgroundColor: Colors.surface[50],
  },
  editActionBtnText: { fontSize: 12, color: Colors.surface[600], fontWeight: '600' },

  // Add button
  addBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.brand[300],
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  addBtnText: { fontSize: 14, color: Colors.brand[500], fontWeight: '700' },

  // Hint
  hint: { alignItems: 'center', paddingTop: 4 },
  hintText: { fontSize: 12, color: Colors.surface[400] },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 15, color: Colors.surface[400] },

  // Error state
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorEmoji: { fontSize: 48 },
  errorText: { fontSize: 15, color: Colors.surface[500], textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { backgroundColor: Colors.brand[500], borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Skeleton
  skeletonCard: {
    backgroundColor: Colors.surface[0],
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  skeletonLeft: { gap: 8 },
  skeletonLabel: { width: 80, height: 14, backgroundColor: Colors.surface[100], borderRadius: 6 },
  skeletonText: { width: '75%', height: 12, backgroundColor: Colors.surface[100], borderRadius: 6 },

  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.surface[0] },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface[100],
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.surface[900] },
  modalClose: { fontSize: 18, color: Colors.surface[400], fontWeight: '600', padding: 4 },
  modalBody: { padding: 20 },

  // Form
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.surface[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  labelPicker: { flexDirection: 'row', gap: 8 },
  labelOption: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.surface[200],
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.surface[50],
  },
  labelOptionSelected: {
    borderColor: Colors.brand[400],
    backgroundColor: Colors.brand[50],
  },
  labelOptionText: { fontSize: 13, color: Colors.surface[500], fontWeight: '600' },
  labelOptionTextSelected: { color: Colors.brand[600] },

  textInput: {
    borderWidth: 1.5,
    borderColor: Colors.surface[200],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.surface[900],
    backgroundColor: Colors.surface[50],
    minHeight: 80,
  },
  saveBtn: {
    marginTop: 28,
    backgroundColor: Colors.brand[500],
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: Colors.brand[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
