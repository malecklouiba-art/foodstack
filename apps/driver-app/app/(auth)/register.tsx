import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/auth';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

type VehicleType = 'scooter' | 'bike' | 'car';

const VEHICLE_OPTIONS: { type: VehicleType; label: string; emoji: string }[] = [
  { type: 'scooter', label: 'Scooter', emoji: '🛵' },
  { type: 'bike',    label: 'Vélo',    emoji: '🚲' },
  { type: 'car',     label: 'Voiture', emoji: '🚗' },
];

export default function DriverRegisterScreen() {
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [phone, setPhone]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [vehicle, setVehicle]         = useState<VehicleType>('scooter');
  const [isLoading, setIsLoading]     = useState(false);

  const { login } = useAuthStore();

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !confirmPwd) {
      Alert.alert('Champs manquants', 'Veuillez remplir tous les champs.');
      return;
    }
    if (password !== confirmPwd) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    try {
      // Step 1 — create user account
      const registerRes = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'driver', phone }),
      });

      if (!registerRes.ok) {
        const errBody = await registerRes.json().catch(() => ({}));
        const message: string =
          typeof errBody === 'object' && errBody !== null && 'message' in errBody
            ? String((errBody as { message: unknown }).message)
            : 'Erreur lors de la création du compte.';
        throw new Error(message);
      }

      const registerData = (await registerRes.json()) as { user: { id: string } };
      const userId = registerData.user.id;

      // Step 2 — create driver profile (best-effort, non-blocking on failure)
      try {
        await fetch(`${API_BASE}/api/v1/drivers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            restaurantId: '',
            vehicleType: vehicle,
            vehiclePlate: '',
          }),
        });
      } catch {
        // Driver profile creation failed — account still created, continue
      }

      // Step 3 — log in and redirect
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Une erreur est survenue. Vérifiez votre connexion.';
      Alert.alert('Erreur d\'inscription', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[Colors.brand[600], Colors.brand[500]]}
            style={styles.logo}
          >
            <Text style={styles.logoEmoji}>🛵</Text>
          </LinearGradient>

          <Text style={styles.title}>Devenir livreur</Text>
          <Text style={styles.subtitle}>Créez votre compte pour commencer à livrer</Text>

          <View style={styles.form}>
            {/* Nom complet */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom complet"
                placeholderTextColor={Colors.surface[400]}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.surface[400]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Téléphone */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={styles.input}
                placeholder="Téléphone"
                placeholderTextColor={Colors.surface[400]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            {/* Mot de passe */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor={Colors.surface[400]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Confirmer mot de passe */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor={Colors.surface[400]}
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                secureTextEntry
              />
            </View>

            {/* Type de véhicule */}
            <View style={styles.vehicleSection}>
              <Text style={styles.vehicleLabel}>Type de véhicule</Text>
              <View style={styles.vehicleRow}>
                {VEHICLE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.type}
                    style={[styles.vehicleBtn, vehicle === opt.type && styles.vehicleBtnActive]}
                    onPress={() => setVehicle(opt.type)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.vehicleBtnEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.vehicleBtnText, vehicle === opt.type && styles.vehicleBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, isLoading && { opacity: 0.7 }]}
            onPress={handleRegister}
            activeOpacity={0.88}
            disabled={isLoading}
          >
            <Text style={styles.registerBtnText}>{isLoading ? 'Inscription…' : 'Créer mon compte'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.loginLinkWrapper}>
            <Text style={styles.loginLink}>Déjà livreur ? <Text style={styles.loginLinkBold}>Se connecter</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.surface[50] },
  container: { paddingHorizontal: 28, paddingTop: 48, paddingBottom: 32, alignItems: 'center' },

  logo:      { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  logoEmoji: { fontSize: 40 },
  title:     { fontSize: 28, fontWeight: '900', color: Colors.surface[900], marginBottom: 6 },
  subtitle:  { fontSize: 14, color: Colors.surface[400], marginBottom: 36, textAlign: 'center' },

  form: { width: '100%', gap: 14, marginBottom: 22 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, height: 52,
    borderWidth: 1, borderColor: Colors.surface[200],
  },
  inputIcon: { fontSize: 17 },
  input:     { flex: 1, fontSize: 15, color: Colors.surface[900] },

  vehicleSection: { gap: 10 },
  vehicleLabel:   { fontSize: 13, fontWeight: '700', color: Colors.surface[600] },
  vehicleRow:     { flexDirection: 'row', gap: 10 },
  vehicleBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.surface[200], backgroundColor: '#fff', gap: 4,
  },
  vehicleBtnActive: {
    borderColor: Colors.brand[500], backgroundColor: Colors.brand[50],
  },
  vehicleBtnEmoji:    { fontSize: 20 },
  vehicleBtnText:     { fontSize: 12, fontWeight: '600', color: Colors.surface[500] },
  vehicleBtnTextActive: { color: Colors.brand[600] },

  registerBtn: {
    width: '100%', backgroundColor: Colors.brand[500], borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: Colors.brand[600], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  loginLinkWrapper: { marginTop: 20 },
  loginLink:        { fontSize: 13, color: Colors.surface[400], textAlign: 'center' },
  loginLinkBold:    { color: Colors.brand[500], fontWeight: '700' },
});
