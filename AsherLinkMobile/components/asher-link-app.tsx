import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Platform,
  Image,
  ImageBackground,
  Animated,
} from 'react-native';
import {
  Wifi,
  Plus,
  Activity,
  Zap,
  Unlock,
  ChevronRight,
  History,
  Home,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  User,
  Lock,
  UserPlus,
  ArrowRight,
} from 'lucide-react-native';

const BUNDLES = [
  { id: 'p1', name: 'Student Lite', volume: '1GB', price: 10, validity: '24 Hours' },
  { id: 'p2', name: 'Community Plus', volume: '5GB', price: 45, validity: '7 Days' },
  { id: 'p3', name: 'Asher Max', volume: '15GB', price: 120, validity: '30 Days' },
  { id: 'p4', name: 'Unlimited Home', volume: 'Uncapped', price: 399, validity: '30 Days' },
];

const OFFERS = [
  { id: 'o1', title: 'Purple Rewards', desc: 'Get 500MB for every 5 referrals' },
  { id: 'o2', title: 'Night Shift', desc: 'Free data from 12AM - 4AM' },
  { id: 'o3', title: 'Trial Connect', desc: '30 mins daily free access' },
];

export default function AsherLinkApp() {
  const [view, setView] = useState<'gateway' | 'dashboard'>('gateway');
  const [activeTab, setActiveTab] = useState<'home' | 'bundles' | 'settings'>('home');
  const [modal, setModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [balance, setBalance] = useState(50.0);
  const [adCountdown, setAdCountdown] = useState(5);
  const [stats, setStats] = useState({
    remaining: '1.8 GB',
    used: '1.2 GB',
    daysLeft: '3 Days',
    isConnected: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (modal === 'adTimer') {
      if (adCountdown > 0) {
        timer = setTimeout(() => setAdCountdown(prev => prev - 1), 1000);
      } else if (adCountdown === 0) {
        setStats(prev => ({ ...prev, remaining: '1.9 GB', isConnected: true }));
        setModal(null);
        setAdCountdown(5);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [modal, adCountdown]);

  const handleConnect = () => {
    setLoading(true);
    setTimeout(() => {
      setView('dashboard');
      setLoading(false);
    }, 1000);
  };

  const handleAuth = () => {
    if (!loginForm.identifier.trim() || !loginForm.password.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setView('dashboard');
      setLoginForm({ identifier: '', password: '' });
      setLoading(false);
    }, 1500);
  };

  const handleGuestAccess = () => {
    setLoading(true);
    setTimeout(() => {
      setView('dashboard');
      setLoading(false);
    }, 1000);
  };

  const handleRecharge = () => {
    if (!voucherCode.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setBalance(prev => prev + 25);
      setVoucherCode('');
      setModal(null);
      setLoading(false);
    }, 1200);
  };

  const handleBuyBundle = (bundle: typeof BUNDLES[0]) => {
    if (balance < bundle.price) return;
    setBalance(prev => prev - bundle.price);
    setModal(null);
  };

  const renderGateway = () => (
    <View style={styles.gatewayContainer}>
      {/* Header Section */}
      <View style={styles.gatewayHeader}>
        <View style={styles.heroBadge}>
          <Wifi size={32} color="#fff" />
        </View>
        <Text style={styles.gatewayTitle}>ASHER-LINK</Text>
        <Text style={styles.gatewaySubtitle}>Connectivity Reimagined</Text>
      </View>

      {/* Login Form Section */}
      <View style={styles.loginForm}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Welcome</Text>
          <Text style={styles.formSubtitle}>Login to your account or continue as guest</Text>
        </View>

        {/* Username/Phone Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Username / Phone</Text>
          <View style={styles.inputWrapper}>
            <User size={18} color="#cbd5e1" style={styles.inputIcon} />
            <TextInput
              placeholder="Enter details"
              value={loginForm.identifier}
              onChangeText={(text) => setLoginForm({ ...loginForm, identifier: text })}
              style={styles.textInput}
              placeholderTextColor="#cbd5e1"
            />
          </View>
        </View>

        {/* Password Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={18} color="#cbd5e1" style={styles.inputIcon} />
            <TextInput
              placeholder="••••••••"
              value={loginForm.password}
              onChangeText={(text) => setLoginForm({ ...loginForm, password: text })}
              secureTextEntry={!showPassword}
              style={styles.textInput}
              placeholderTextColor="#cbd5e1"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.togglePassword}
            >
              {showPassword ? (
                <EyeOff size={18} color="#cbd5e1" />
              ) : (
                <Eye size={18} color="#cbd5e1" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Logging in...' : 'Log In'}
          </Text>
          {!loading && <ArrowRight size={16} color="#fff" />}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Guest Button */}
        <TouchableOpacity
          style={styles.guestButton}
          onPress={handleGuestAccess}
          disabled={loading}
        >
          <UserPlus size={16} color="#64748b" />
          <Text style={styles.guestButtonText}>Continue as Guest</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>© 2024 Asher-Link Systems</Text>
    </View>
  );

  const renderHome = () => (
    <ScrollView
      style={styles.tabContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.tabContentPadding}
    >
      {/* Header with Image and Gradient */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800' }}
        style={styles.headerImage}
        resizeMode="cover"
      >
        <View style={styles.headerGradientOverlay} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Asher Link</Text>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, stats.isConnected && styles.statusDotActive]} />
            <Text style={styles.statusLabel}>
              Status: {stats.isConnected ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </ImageBackground>

      {/* Main Stats Card */}
      <View style={styles.mainStatsCard}>
        <View style={styles.statsCardTop}>
          <View>
            <Text style={styles.statsLabel}>Data Available</Text>
            <Text style={styles.statsValue}>{stats.remaining}</Text>
          </View>
          <View style={styles.balanceBox}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balanceValue}>R{balance.toFixed(2)}</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '64%' }]} />
        </View>
        <View style={styles.statsCardBottom}>
          <View style={styles.statsCardItem}>
            <Text style={styles.statsCardItemLabel}>Used</Text>
            <Text style={styles.statsCardItemValue}>{stats.used}</Text>
          </View>
          <View style={styles.statsCardItem}>
            <Text style={styles.statsCardItemLabel}>Expiry</Text>
            <Text style={styles.statsCardItemValue}>{stats.daysLeft}</Text>
          </View>
        </View>
      </View>

      {/* Action Grid */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setModal('adTimer')}
        >
          <Unlock size={18} color="#7c3aed" />
          <Text style={styles.actionLabel}>Free Trial</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setModal('recharge')}
        >
          <Plus size={18} color="#7c3aed" />
          <Text style={styles.actionLabel}>Add Funds</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <History size={18} color="#7c3aed" />
          <Text style={styles.actionLabel}>Logs</Text>
        </TouchableOpacity>
      </View>

      {/* Special Offers */}
      <View style={styles.offersSection}>
        <View style={styles.sectionHeader}>
          <Zap size={14} color="#dc2626" />
          <Text style={styles.sectionTitle}>Special Offers</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.offersScroll}
        >
          {OFFERS.map(offer => (
            <View key={offer.id} style={styles.offerCard}>
              <Text style={styles.offerTitle}>{offer.title}</Text>
              <Text style={styles.offerDesc}>{offer.desc}</Text>
              <TouchableOpacity
                style={styles.offerCTA}
                onPress={() => setActiveTab('bundles')}
              >
                <Text style={styles.offerCTAText}>Activate Now</Text>
                <ChevronRight size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );

  const renderBundles = () => (
    <ScrollView
      style={styles.tabContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.tabContentPadding}
    >
      <Text style={styles.pageTitle}>Top Bundles</Text>
      {BUNDLES.map(bundle => (
        <View key={bundle.id} style={styles.bundleItem}>
          <View style={styles.bundleInfo}>
            <Text style={styles.bundleName}>{bundle.name}</Text>
            <Text style={styles.bundleMeta}>
              {bundle.volume} • {bundle.validity}
            </Text>
          </View>
          <View style={styles.bundleAction}>
            <Text style={styles.bundlePrice}>R{bundle.price}</Text>
            <TouchableOpacity
              style={styles.buyBtn}
              onPress={() => handleBuyBundle(bundle)}
            >
              <Text style={styles.buyBtnText}>Buy</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderSettings = () => (
    <ScrollView
      style={styles.tabContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.tabContentPadding}
    >
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.accountText}>Device MAC: 00:0C:29:43:FC:12</Text>
      </View>

      <View style={styles.settingsGrid}>
        <TouchableOpacity
          style={styles.settingOption}
          onPress={() => setActiveTab('home')}
        >
          <Home size={20} color="#7c3aed" />
          <Text style={styles.settingLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingOption}
          onPress={() => setActiveTab('bundles')}
        >
          <Zap size={20} color="#7c3aed" />
          <Text style={styles.settingLabel}>Bundles</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingOption}>
          <Activity size={20} color="#7c3aed" />
          <Text style={styles.settingLabel}>Rewards</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingOption}>
          <Plus size={20} color="#7c3aed" />
          <Text style={styles.settingLabel}>Support</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {view === 'gateway' ? (
        renderGateway()
      ) : (
        <View style={styles.dashboardContainer}>
          
          {activeTab === 'home' && renderHome()}
          {activeTab === 'bundles' && renderBundles()}
          {activeTab === 'settings' && renderSettings()}

          <View style={styles.bottomNav}>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => setActiveTab('home')}
            >
              <Home
                size={20}
                color={activeTab === 'home' ? '#7c3aed' : '#94a3b8'}
              />
              <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => setActiveTab('bundles')}
            >
              <Zap
                size={20}
                color={activeTab === 'bundles' ? '#7c3aed' : '#94a3b8'}
              />
              <Text style={[styles.navLabel, activeTab === 'bundles' && styles.navLabelActive]}>
                Bundles
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => setActiveTab('settings')}
            >
              <SettingsIcon
                size={20}
                color={activeTab === 'settings' ? '#7c3aed' : '#94a3b8'}
              />
              <Text style={[styles.navLabel, activeTab === 'settings' && styles.navLabelActive]}>
                Menu
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={modal === 'recharge'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Redeem Voucher</Text>
              <TouchableOpacity onPress={() => setModal(null)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Enter voucher code"
              value={voucherCode}
              onChangeText={setVoucherCode}
              style={styles.input}
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={handleRecharge}
              disabled={loading}
            >
              <Text style={styles.modalBtnText}>
                {loading ? 'Processing...' : 'Redeem Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modal === 'adTimer'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.timerModal}>
            <Text style={styles.modalTitle}>Free Trial Reward</Text>
            <Text style={styles.timerSubtitle}>Watch the countdown</Text>
            <View style={styles.timerCircle}>
              <Text style={styles.timerNumber}>{adCountdown}</Text>
            </View>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setModal(null)}
            >
              <Text style={styles.modalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerImage: {
    width: '100%',
    height: 160,
    marginBottom: 0,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  headerGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  headerTitle: {
    color: '#3d2667',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc2626',
  },
  statusDotActive: {
    backgroundColor: '#22c55e',
  },
  statusLabel: {
    color: '#4c1d95',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  mainStatsCard: {
    backgroundColor: '#581c87',
    borderRadius: 32,
    padding: 20,
    marginHorizontal: 0,
    marginTop: -15,
    marginBottom: 18,
    zIndex: 5,
  },
  statsCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statsLabel: {
    color: '#d8b4fe',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statsValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },
  balanceBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  balanceLabel: {
    color: '#d8b4fe',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  balanceValue: {
    color: '#f472b6',
    fontWeight: '900',
    fontSize: 14,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 999,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f472b6',
    borderRadius: 999,
  },
  statsCardBottom: {
    flexDirection: 'row',
    gap: 10,
  },
  statsCardItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  statsCardItemLabel: {
    color: '#d8b4fe',
    fontSize: 6,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statsCardItemValue: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },
  gatewayContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'android' ? 20 : 0,
  },
  gatewayHeader: {
    backgroundColor: '#312e81',
    
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    zIndex: 10,
  },
  heroBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gatewayTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  gatewaySubtitle: {
    color: '#c7d2fe',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginForm: {
    marginHorizontal: 20,
    marginTop: -20,
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  formHeader: {
    marginBottom: 24,
  },
  formTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  formSubtitle: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 14,
  },
  togglePassword: {
    padding: 8,
    marginLeft: 8,
  },
  loginButton: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    color: '#cbd5e1',
    fontSize: 9,
    fontWeight: '900',
    marginHorizontal: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  guestButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  guestButtonText: {
    color: '#64748b',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  footer: {
    color: '#cbd5e1',
    fontSize: 8,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginVertical: 16,
  },
  dashboardContainer: {
    flex: 1,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dashboardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  dashboardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  topUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  topUpText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  tabContainer: {
    flex: 1,
  },
  tabContentPadding: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: {
    color: '#111827',
    fontSize: 9,
    fontWeight: '800',
  },
  offersSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '900',
  },
  offersScroll: {
    marginLeft: -16,
    paddingLeft: 16,
  },
  offerCard: {
    width: 220,
    backgroundColor: '#7c3aed',
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
  },
  offerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
  },
  offerDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginBottom: 12,
  },
  offerCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offerCTAText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 12,
    marginTop: 12,
  },
  bundleItem: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bundleInfo: {
    flex: 1,
  },
  bundleName: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
  },
  bundleMeta: {
    color: '#64748b',
    fontSize: 10,
  },
  bundleAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bundlePrice: {
    color: '#111827',
    fontWeight: '800',
  },
  buyBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  buyBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 10,
  },
  settingsSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    marginBottom: 14,
  },
  accountText: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 6,
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  settingOption: {
    width: '48%',
    backgroundColor: '#eef2ff',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  settingLabel: {
    color: '#4f46e5',
    fontWeight: '800',
    fontSize: 10,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  navBtn: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  navLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
  },
  navLabelActive: {
    color: '#7c3aed',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
  },
  timerModal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  closeBtn: {
    fontSize: 20,
    color: '#94a3b8',
  },
  input: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    color: '#111827',
  },
  timerSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginVertical: 12,
  },
  timerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#4f46e5',
  },
  modalBtn: {
    width: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
});

