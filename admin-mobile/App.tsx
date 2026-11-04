import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db, ADMIN_UID } from './src/firebase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState({ orders: 0, pendingOrders: 0, orderValue: 0, products: 0, lowStock: 0, bookings: 0, pendingBookings: 0 });
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      if (nextUser && nextUser.uid !== ADMIN_UID) {
        await signOut(auth);
        setUser(null);
        setError('This account does not have CHITRANYA administrator access.');
      } else {
        setUser(nextUser);
      }
      setChecking(false);
    });
  }, []);

  useEffect(() => {
    if (!user || user.uid !== ADMIN_UID) return;

    let ordersData: Array<Record<string, unknown>> = [];
    let productsData: Array<Record<string, unknown>> = [];
    let bookingsData: Array<Record<string, unknown>> = [];
    const updateMetrics = () => {
      const activeOrders = ordersData.filter((order) => String(order.status ?? '').toLowerCase() !== 'cancelled');
      setMetrics({
        orders: ordersData.length,
        pendingOrders: ordersData.filter((order) => String(order.status ?? '').toLowerCase() === 'pending').length,
        orderValue: activeOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
        products: productsData.length,
        lowStock: productsData.filter((product) => Number(product.stock ?? 0) <= 5).length,
        bookings: bookingsData.length,
        pendingBookings: bookingsData.filter((booking) => String(booking.status ?? '').toLowerCase() === 'pending').length,
      });
    };
    const handleError = () => setDataError('Could not load live store data. Check your internet connection.');
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      ordersData = snapshot.docs.map((item) => item.data());
      setDataError('');
      updateMetrics();
    }, handleError);
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      productsData = snapshot.docs.map((item) => item.data());
      setDataError('');
      updateMetrics();
    }, handleError);
    const unsubBookings = onSnapshot(collection(db, 'serviceBookings'), (snapshot) => {
      bookingsData = snapshot.docs.map((item) => item.data());
      setDataError('');
      updateMetrics();
    }, handleError);

    return () => { unsubOrders(); unsubProducts(); unsubBookings(); };
  }, [user]);

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your admin email and password.');
      return;
    }

    setBusy(true);
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      if (credential.user.uid !== ADMIN_UID) {
        await signOut(auth);
        setError('Access denied. This account is not an authorized administrator.');
      }
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code: unknown }).code)
          : '';
      if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
        setError('Incorrect email or password.');
      } else if (code.includes('network-request-failed')) {
        setError('Network error. Check your internet connection and try again.');
      } else if (code.includes('too-many-requests')) {
        setError('Too many attempts. Please wait and try again later.');
      } else {
        setError('Unable to sign in. Please check your details and try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    try {
      await signOut(auth);
      setPassword('');
    } catch {
      setError('Could not sign out. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#F28C28" />
        <Text style={styles.loadingText}>Checking secure session...</Text>
      </SafeAreaView>
    );
  }

  if (user?.uid === ADMIN_UID) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.topLine} />
        <ScrollView contentContainerStyle={styles.dashboardContent}>
          <View style={styles.dashboardHeader}>
            <View>
              <Text style={styles.dashboardBrand}>CHITRANYA</Text>
              <Text style={styles.dashboardSubtitle}>ADMIN DASHBOARD</Text>
            </View>
            <TouchableOpacity style={styles.signOutButton} onPress={handleLogout} disabled={busy}>
              {busy ? <ActivityIndicator color="#102A43" /> : <Text style={styles.signOutText}>Sign out</Text>}
            </TouchableOpacity>
          </View>

          <Text style={styles.greeting}>Store overview</Text>
          <Text style={styles.dashboardHint}>Live information from your CHITRANYA store</Text>
          {!!dataError && <Text style={styles.dataError}>{dataError}</Text>}

          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TOTAL ORDERS</Text>
              <Text style={styles.metricValue}>{metrics.orders}</Text>
              <Text style={styles.metricFoot}>{metrics.pendingOrders} pending</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>ORDER VALUE</Text>
              <Text style={styles.metricValueSmall}>NPR {metrics.orderValue.toLocaleString('en-IN')}</Text>
              <Text style={styles.metricFoot}>Excludes cancelled orders</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>PRODUCTS</Text>
              <Text style={styles.metricValue}>{metrics.products}</Text>
              <Text style={styles.metricFoot}>{metrics.lowStock} low stock (5 or less)</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>SERVICE BOOKINGS</Text>
              <Text style={styles.metricValue}>{metrics.bookings}</Text>
              <Text style={styles.metricFoot}>{metrics.pendingBookings} pending</Text>
            </View>
          </View>

          <View style={styles.liveCard}>
            <View style={styles.liveDot} />
            <View style={styles.liveCopy}>
              <Text style={styles.liveTitle}>Firebase connected</Text>
              <Text style={styles.liveDescription}>Dashboard numbers update automatically when store data changes.</Text>
            </View>
          </View>
          <Text style={styles.accountLabel}>SIGNED IN AS</Text>
          <Text style={styles.accountEmail}>{user.email}</Text>
        </ScrollView>
        <Text style={styles.footer}>CHITRANYA · SHOP · SERVICES · SOLUTIONS</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topLine} />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.loginCard}>
          <View style={styles.logoMark}><Text style={styles.logoLetter}>C</Text></View>
          <Text style={styles.brand}>CHITRANYA</Text>
          <Text style={styles.brandSub}>ADMINISTRATION</Text>
          <View style={styles.headingBlock}>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to manage your store</Text>
          </View>

          <Text style={styles.fieldLabel}>ADMIN EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter admin email"
            placeholderTextColor="#98A2B3"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            editable={!busy}
          />

          <Text style={styles.fieldLabel}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor="#98A2B3"
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
            onSubmitEditing={handleLogin}
            editable={!busy}
          />

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, busy && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Sign in securely</Text>}
          </TouchableOpacity>
          <View style={styles.secureNote}>
            <Text style={styles.secureSymbol}>▣</Text>
            <Text style={styles.secureText}>Protected administrator access</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
      <Text style={styles.footer}>CHITRANYA · SHOP · SERVICES · SOLUTIONS</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F6FA' },
  topLine: { height: 5, backgroundColor: '#F28C28' },
  keyboard: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },
  loginCard: { width: '100%', maxWidth: 440, alignSelf: 'center', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28, shadowColor: '#14213D', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
  logoMark: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#102A43', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  logoLetter: { color: '#FFFFFF', fontSize: 31, fontWeight: '800' },
  brand: { color: '#102A43', fontSize: 23, fontWeight: '900', letterSpacing: 2.2, textAlign: 'center' },
  brandSub: { color: '#F28C28', fontSize: 10, fontWeight: '800', letterSpacing: 3, textAlign: 'center', marginTop: 5 },
  headingBlock: { marginTop: 34, marginBottom: 25 },
  heading: { color: '#14213D', fontSize: 27, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#667085', fontSize: 14, textAlign: 'center', marginTop: 7 },
  fieldLabel: { color: '#344054', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8, marginTop: 14 },
  input: { height: 52, borderWidth: 1, borderColor: '#D9E0E8', borderRadius: 12, paddingHorizontal: 15, color: '#14213D', fontSize: 15, backgroundColor: '#FFFFFF' },
  primaryButton: { height: 54, backgroundColor: '#F28C28', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
  buttonDisabled: { opacity: 0.65 },
  errorBox: { backgroundColor: '#FFF1F0', borderColor: '#FECACA', borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 16 },
  errorText: { color: '#B42318', fontSize: 13, lineHeight: 19 },
  secureNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 8 },
  secureSymbol: { color: '#16845B', fontSize: 14 },
  secureText: { color: '#667085', fontSize: 12 },
  footer: { color: '#98A2B3', fontSize: 9, fontWeight: '700', letterSpacing: 1.4, textAlign: 'center', paddingBottom: 18 },
  loadingScreen: { flex: 1, backgroundColor: '#F4F6FA', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#667085', fontSize: 13, marginTop: 14 },

  dashboardContent: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 28 },
  dashboardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 34 },
  dashboardBrand: { color: '#102A43', fontSize: 20, fontWeight: '900', letterSpacing: 1.8 },
  dashboardSubtitle: { color: '#F28C28', fontSize: 9, fontWeight: '800', letterSpacing: 2.4, marginTop: 4 },
  signOutButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D9E0E8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  signOutText: { color: '#102A43', fontSize: 12, fontWeight: '800' },
  greeting: { color: '#14213D', fontSize: 27, fontWeight: '900' },
  dashboardHint: { color: '#667085', fontSize: 13, marginTop: 6, marginBottom: 22 },
  dataError: { color: '#B42318', backgroundColor: '#FFF1F0', padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 12 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: { width: '48%', flexGrow: 1, minHeight: 132, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5EAF0' },
  metricLabel: { color: '#667085', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  metricValue: { color: '#102A43', fontSize: 32, fontWeight: '900', marginTop: 12 },
  metricValueSmall: { color: '#102A43', fontSize: 19, fontWeight: '900', marginTop: 18 },
  metricFoot: { color: '#667085', fontSize: 10, marginTop: 6 },
  liveCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF7F0', borderRadius: 14, padding: 16, marginTop: 20 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#16845B', marginRight: 12 },
  liveCopy: { flex: 1 },
  liveTitle: { color: '#126344', fontSize: 13, fontWeight: '800' },
  liveDescription: { color: '#477563', fontSize: 11, lineHeight: 16, marginTop: 4 },
  accountLabel: { color: '#98A2B3', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginTop: 28 },
  dashboard: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 },
  successIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#E7F6EF', alignItems: 'center', justifyContent: 'center', marginTop: 32, marginBottom: 16 },
  successCheck: { color: '#16845B', fontSize: 28, fontWeight: '800' },
  welcome: { color: '#14213D', fontSize: 25, fontWeight: '800' },
  signedInLabel: { color: '#667085', fontSize: 13, marginTop: 8 },
  accountEmail: { color: '#344054', fontSize: 14, fontWeight: '700', marginTop: 5 },
  infoCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginTop: 28, borderWidth: 1, borderColor: '#E5EAF0' },
  infoTitle: { color: '#14213D', fontSize: 15, fontWeight: '800' },
  infoText: { color: '#667085', fontSize: 13, lineHeight: 19, marginTop: 8 },
  infoNote: { color: '#F28C28', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 12 },
});
