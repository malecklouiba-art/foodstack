import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!email.trim()) {
      setError('Veuillez saisir votre adresse email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Adresse email invalide.');
      return;
    }
    setError(null);
    // No real API call — show generic success message
    setSubmitted(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Logo */}
          <LinearGradient
            colors={[Colors.brand[500], Colors.brand[700]]}
            style={styles.logoContainer}
          >
            <Text style={styles.logoEmoji}>🍽️</Text>
          </LinearGradient>

          <Text style={styles.title}>Mot de passe oublié</Text>
          <Text style={styles.subtitle}>
            Saisissez votre email et nous vous enverrons un lien de réinitialisation.
          </Text>

          {submitted ? (
            <View style={styles.successBox}>
              <Text style={styles.successEmoji}>📬</Text>
              <Text style={styles.successTitle}>Vérifiez votre boîte mail</Text>
              <Text style={styles.successMessage}>
                Si cet email existe, vous recevrez un lien dans quelques minutes.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>✉️</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="votre@email.com"
                      placeholderTextColor={Colors.surface[400]}
                      value={email}
                      onChangeText={(v) => {
                        setEmail(v);
                        if (error) setError(null);
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoFocus
                    />
                  </View>
                </View>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                activeOpacity={0.88}
              >
                <Text style={styles.submitBtnText}>Envoyer le lien de réinitialisation</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backLinkText}>← Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.surface[50] },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 32, alignItems: 'center' },

  logoContainer: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  logoEmoji: { fontSize: 36 },

  title:    { fontSize: 26, fontWeight: '900', color: Colors.surface[900], marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.surface[400], marginBottom: 28, textAlign: 'center', lineHeight: 20 },

  form: { width: '100%', marginBottom: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.surface[700] },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, height: 50,
    borderWidth: 1, borderColor: Colors.surface[200],
  },
  inputIcon: { fontSize: 16 },
  input:     { flex: 1, fontSize: 15, color: Colors.surface[900] },

  errorText: {
    color: Colors.danger, fontSize: 13, fontWeight: '500',
    width: '100%', marginBottom: 12, textAlign: 'center',
  },

  submitBtn: {
    width: '100%', backgroundColor: Colors.brand[500], borderRadius: 16,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: Colors.brand[500], shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  successBox: {
    width: '100%', backgroundColor: '#fff', borderRadius: 20,
    padding: 24, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.surface[200],
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
    marginBottom: 24,
  },
  successEmoji:   { fontSize: 48, marginBottom: 4 },
  successTitle:   { fontSize: 18, fontWeight: '800', color: Colors.surface[900], textAlign: 'center' },
  successMessage: { fontSize: 14, color: Colors.surface[500], textAlign: 'center', lineHeight: 20 },

  backLink:     { marginTop: 24 },
  backLinkText: { fontSize: 14, color: Colors.brand[500], fontWeight: '600' },
});
