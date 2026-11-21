import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ActionButton, Card, Screen } from '@/components/sakhi-ui';
import { MiraColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

type AuthMode = 'sign-in' | 'sign-up' | 'reset';

export default function AuthScreen() {
  const auth = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async () => {
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'sign-up') {
        const result = await auth.signUp(email.trim(), password);
        setMessage(result.needsEmailVerification
          ? 'Check your email to verify your account, then sign in.'
          : 'Account created. Continuing to onboarding.');
        if (!result.needsEmailVerification) router.replace('/onboarding');
      } else if (mode === 'reset') {
        await auth.resetPassword(email.trim());
        setMessage('If that email exists, a password reset link has been sent.');
      } else {
        await auth.signIn(email.trim(), password);
        router.replace('/');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to complete that request.');
    } finally {
      setBusy(false);
    }
  };

  if (!auth.configured) {
    return (
      <Screen>
        <Card tone="lilac" style={styles.card}>
          <Text style={styles.title}>Local mode</Text>
          <Text style={styles.copy}>Supabase is not configured. You can continue securely on this device.</Text>
          <ActionButton label="Continue" icon="→" onPress={() => router.replace('/onboarding')} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card tone="lilac" style={styles.card}>
        <Text style={styles.brand}>SAKHI</Text>
        <Text style={styles.title}>
          {mode === 'sign-up' ? 'Create your account' : mode === 'reset' ? 'Reset password' : 'Welcome back'}
        </Text>
        <Text style={styles.copy}>
          {mode === 'reset'
            ? 'Enter your email and we will send a secure reset link.'
            : 'Use email to protect your campus, wellbeing, and companion data.'}
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@campus.edu"
          style={styles.input}
        />

        {mode !== 'reset' && (
          <>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="At least 6 characters"
              style={styles.input}
            />
          </>
        )}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <ActionButton
          label={busy ? 'Please wait...' : mode === 'sign-up' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}
          icon="→"
          onPress={submit}
          style={{ marginTop: 16 }}
        />

        {mode !== 'sign-in' ? (
          <Pressable onPress={() => setMode('sign-in')} style={styles.linkButton}>
            <Text style={styles.link}>Back to sign in</Text>
          </Pressable>
        ) : (
          <View style={styles.linkRow}>
            <Pressable onPress={() => setMode('sign-up')} style={styles.linkButton}>
              <Text style={styles.link}>Create account</Text>
            </Pressable>
            <Pressable onPress={() => setMode('reset')} style={styles.linkButton}>
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>
          </View>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', maxWidth: 480, alignSelf: 'center', marginTop: 60, padding: 22 },
  brand: { color: MiraColors.rose, letterSpacing: 2, fontWeight: '900', textAlign: 'center' },
  title: { color: MiraColors.ink, fontSize: 24, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  copy: { color: MiraColors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginVertical: 10 },
  label: { color: MiraColors.muted, fontSize: 11, fontWeight: '800', marginTop: 12, marginBottom: 5 },
  input: {
    backgroundColor: MiraColors.white,
    borderWidth: 1,
    borderColor: MiraColors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: MiraColors.ink,
  },
  message: { color: MiraColors.rose, fontSize: 12, lineHeight: 18, marginTop: 12, textAlign: 'center' },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  linkButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  link: { color: MiraColors.rose, fontSize: 12, fontWeight: '800' },
});
