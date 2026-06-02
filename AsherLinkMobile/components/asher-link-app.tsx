import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ActivityIndicator,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
  Phone,
  Package,
  HelpCircle,
  Star,
  Award,
} from 'lucide-react-native';
import {
  confirmPurchase as apiConfirmPurchase,
  connectTrial as apiConnectTrial,
  fetchAndRenderUserData,
  fetchUserOffers,
  getBundlesData,
  handleVoucher,
  startTrialAd as apiStartTrialAd
} from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationToast from './NotificationToast';

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

const DEFAULT_MAC = '00:11:22:33:44:55';
const DEFAULT_LANGUAGE = 'en';

const translations = {
  en: {
    welcome: 'Welcome Back',
    subtitle: 'Fast, reliable internet for your neighborhood.',
    settings: 'Settings',
    menu: 'Menu',
    dataSaver: 'Data Saver',
    lang: 'Language',
    history: 'Transaction History',
    status: 'Network Status',
    recharge: 'Recharge',
    balance: 'Balance',
    lastBundle: 'Last Bundle',
    totalUsed: 'Data Used',
    sessionTime: 'Session Time'
  },
  sotho: {
    welcome: 'Dumela',
    subtitle: 'Intanete e tshepahalang, e potlakileng ya setjhaba.',
    settings: 'Tukiso',
    menu: 'Menyu',
    dataSaver: 'Tshebediso e tlase ya data',
    lang: 'Puo',
    history: 'Hisitory',
    status: 'Isimo Senethiwekhi',
    recharge: 'Recharge',
    balance: 'Balance',
    lastBundle: 'Last Bundle',
    totalUsed: 'Data Used',
    sessionTime: 'Session Time'
  }
};

const formatActivePeriod = (text: string | string[]) => {
  if (typeof text !== 'string') return text;
  if (text.includes('in')) return `${text.slice(0, -1)} ${Number(text.slice(0, -1)) > 1 ? 'minutes' : 'minute'}`;
  if (text.includes('h')) return `${text.slice(0, -1)} ${Number(text.slice(0, -1)) > 1 ? 'hours' : 'hour'}`;
  if (text.includes('d')) return `${text.slice(0, -1)} ${Number(text.slice(0, -1)) > 1 ? 'days' : 'day'}`;
  if (text.includes('w')) return `${text.slice(0, -1)} ${Number(text.slice(0, -1)) > 1 ? 'Weeks' : 'Week'}`;
  if (text.includes('m')) return `${text.slice(0, -1)} ${Number(text.slice(0, -1)) > 1 ? 'Months' : 'Month'}`;
  return text;
};

export default function AsherLinkApp() {
  const [view, setView] = useState<'gateway' | 'dashboard'>('gateway');
  const [activeTab, setActiveTab] = useState<'home' | 'bundles' | 'settings'>('home');
  const [modal, setModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [balance, setBalance] = useState<number>(50.0);
  const [adCountdown, setAdCountdown] = useState(5);
  const [stats, setStats] = useState({
    remaining: '1.8 GB',
    used: '1.2 GB',
    daysLeft: '3 Days',
    isConnected: false,
    totalUsed: '0 KB',
    sessionTime: '00:00:00',
    lastBundle: 'None'
  });
  const [tokenIconColor, setTokenIconColor] = useState('#94a3b8');
  const [packages, setPackages] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalKind, setModalKind] = useState('');
  const [bundleCategory, setBundleCategory] = useState('all');
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [dataSaver, setDataSaver] = useState(false);
  const [autoConnect, setAutoConnect] = useState(false);
  const [particles, setParticles] = useState(true);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [user, setUser] = useState<{ id: string; name: string; joined: string; phone: string; plan: string; loggedin: boolean } | null>(null);
  const [trialActive, setTrialActive] = useState(false);
  const [trialTimer, setTrialTimer] = useState(0);
  const [trialAdData, setTrialAdData] = useState<any>(null);
  const isMounted = useRef(true);
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

  const notify = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  const savePref = async (key: string, value: unknown) => {
    if (!isMounted.current) return;
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch (_error) {
      console.error('Failed to save pref', _error);
    }
  };

  const refreshData = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      try {
        const userData: any = await fetchAndRenderUserData(DEFAULT_MAC);
        if (userData?.balance !== undefined) {
          setBalance(Number(userData.balance) || 0);
        }
        if (userData?.usage) {
          setStats((prevStats) => ({
            ...prevStats,
            totalUsed: userData.usage.total_used || prevStats.totalUsed,
            sessionTime: userData.usage.session_time || prevStats.sessionTime,
            lastBundle: userData.usage.last_bundle || prevStats.lastBundle
          }));
        }
      } catch (e) {
        console.warn('User data fetch failed:', e);
      }

      try {
        const bundles = await getBundlesData();
        if (isMounted.current) {
          setPackages(bundles.packages || []);
        }
      } catch (e) {
        console.warn('Bundles fetch failed:', e);
      }

      try {
        const offersData = await fetchUserOffers(DEFAULT_MAC);
        if (isMounted.current) {
          setOffers(Array.isArray(offersData.offers) ? offersData.offers : []);
        }
      } catch (e) {
        console.warn('Offers fetch failed:', e);
      }
    } catch (_error) {
      console.error('refreshData error:', _error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
    return undefined;
  }, []);

    useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    refreshData().catch((err) => {
      console.error('refreshData promise rejected:', err);
    });
    const interval = setInterval(() => {
      refreshData().catch((err) => {
        console.error('refreshData interval rejected:', err);
      });
    }, 20000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const simulateLogin = () => {
    const userId = `USR-${DEFAULT_MAC.replace(/:/g, '').slice(-6)}`;
    setUser({
      id: userId,
      name: 'Prepaid User',
      joined: new Date().toLocaleDateString('en-GB'),
      phone: '072-***-****',
      plan: 'Pro Tier',
      loggedin: true
    });
    notify('Logged In', 'success');
    closeModal();
  };

  const simulateLogout = () => {
    setUser(null);
    notify('Logged Out', 'success');
    closeModal();
  };

  const updateLang = async (value: string) => {
    setLanguage(value);
    await savePref('language', value);
    notify(`Language: ${value.toUpperCase()}`, 'success');
  };

  const togglePref = async (key: 'dataSaver' | 'auto_connect' | 'particles') => {
    if (key === 'dataSaver') {
      setDataSaver((prev) => {
        savePref('dataSaver', !prev);
        return !prev;
      });
    }
    if (key === 'auto_connect') {
      setAutoConnect((prev) => {
        savePref('auto_connect', !prev);
        return !prev;
      });
    }
    if (key === 'particles') {
      setParticles((prev) => {
        savePref('particles', !prev);
        return !prev;
      });
    }
  };

  const completeTrial = useCallback(async () => {
    if (!trialAdData) {
      setTrialActive(false);
      return;
    }
    setTrialActive(false);
    try {
      const result = await apiConnectTrial(trialAdData._id || 'default', DEFAULT_MAC);
      if (result && (result.status === 'success' || result.status === 'skipped')) {
        notify('Connecting Trial', 'success');
      } else {
        notify('Ad failed', 'error');
      }
    } catch (_error) {
      notify('Ad failed', 'error');
    }
  }, [trialAdData]);

  useEffect(() => {
    if (!trialActive || trialTimer <= 0) return;
    const timer = setInterval(() => {
      setTrialTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          completeTrial();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [trialActive, trialTimer, completeTrial]);

  const onPressRecharge = async () => {
    if (!voucherCode.trim()) {
      setTokenIconColor('#dc3545');
      notify('Enter a voucher code', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await handleVoucher(DEFAULT_MAC, voucherCode.trim());
      if (result && result.status === 'success') {
        notify('Successfully recharged', 'success');
        setVoucherCode('');
        await refreshData();
      } else if (result && result.status === 'invalid') {
        setTokenIconColor('#dc3545');
        notify('Invalid Voucher', 'error');
      } else {
        setTokenIconColor('#dc3545');
        notify('Unknown Error', 'error');
      }
    } catch (_error) {
      setTokenIconColor('#dc3545');
      notify('Network Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onStartTrialAd = async () => {
    setLoading(true);
    try {
      const adData = await apiStartTrialAd(DEFAULT_MAC);
      setTrialAdData(adData);
      const duration = Number(adData.ad_duration) || 10;
      setTrialTimer(duration);
      setTrialActive(true);
      notify('Trial ad loaded', 'success');
    } catch (_error) {
      notify('Ad failed', 'error');
    } finally {
      setLoading(false);
    }
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

  const openModal = async (kind: 'bundles' | 'recharge' | 'adTimer' | string) => {
    if (kind === 'bundles' && packages.length === 0) {
      const bundles = await getBundlesData();
      setPackages(bundles.packages || []);
    }
    setBundleCategory('all');
    setSelectedBundle(null);
    setModalKind(kind);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedBundle(null);
  };

  const loadUserPackages = async () => {
    await openModal('bundles');
  };

  const renderBundlesM = (category: string) => {
    setBundleCategory(category);
    setSelectedBundle(null);
  };

  const viewBundleDetails = (bundle: any) => {
    setSelectedBundle(bundle);
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
      <Text style={styles.footer}>© 2026 Asher. All rights reserved.</Text>
    </View>
  );

  const renderHome = () => (
    <ScrollView className="w-full mx-auto max-w-app-margin-16">
        <View className="relative flex flex-col items-center h-full mx-4 sm:justify-evenly sm:flex-row-reverse">
          <View className="w-full mt-[53%] px-6 sm:w-[45%] max-w-lg card sm:m-0 z-[2]">
            <View className="flex justify-between mb-6">
              <Text className="mx-2 items-left text-2xl bold-header font-bold md:text-3xl gradient-text">Prepaid Wifi</Text>
              <Text className="hidden text-[10px] uppercase tracking-wider text-slate-400 font-mono">00:00:00</Text>
            </View>

            <Text className="mx-[.5rem] mb-6 font-semibold">Balance: R <Text className="balance-el loader font-semibold">{balance}</Text></Text>

            <View className="relative block">
              <View className="input-label-user">
                <Text className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 -rotate-[30deg] text-slate-400"> </Text>
              </View>
              <TextInput
                value={voucherCode}
                onChangeText={setVoucherCode}
                placeholder="Recharge code"
                placeholderTextColor="#94a3b8"
                className="rounded-full pl-12 pr-4 py-2 block w-full"
                style={{ borderColor: tokenIconColor, borderWidth: 1 }}
                autoCapitalize="characters"
                keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'}
              />
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={onPressRecharge} disabled={loading} className="button py-2 w-full text-white justify-center rounded-full font-bold shadow-lg mt-[1.5rem]">
              <Text>{loading ? 'Processing...' : 'Recharge'}</Text>
            </TouchableOpacity>

            <View className="w-full ml-5 flex flex-col gap-3 z-50 mt-[1.5rem] h-[2.5rem]">
              <View className="flex gap-5 text-center">
                <TouchableOpacity activeOpacity={0.8} className="flex inline-flex items-center gap-2 text-sm bg-neutral-50 py-1 px-3 rounded-full border border-neutral-300 font-semibold" onPress={() => loadUserPackages()}>
                  <Text>WiFi Bundles</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} className="flex inline-flex items-center gap-2 text-sm bg-neutral-50 py-1 px-3 rounded-full border border-neutral-300 font-semibold" onPress={() => openModal('free')}>
                  <Text>Free wifi</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="mt-2 mx-2 mb-4 flex flex-col space-y-[1rem] text-base">
              <TouchableOpacity className="block text-slate-500 hover:text-slate-900 transition flex items-center gap-1" activeOpacity={0.8} onPress={() => openModal('login')}>
                <Text className="mr-2">Account Login</Text>
              </TouchableOpacity>
              <TouchableOpacity className="block text-slate-500 hover:text-slate-900 transition flex items-center gap-1" activeOpacity={0.8} onPress={() => openModal('menu')}>
                <Text>Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
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

  const renderHelpModal = () => (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 12, marginBottom: 24 }}>
        {[
          { question: 'Voucher not working?', answer: `Ensure you have entered all characters correctly. Avoid spaces at the start or end. If it still fails, contact support with your MAC ID: ${DEFAULT_MAC}.` },
          { question: 'Slow connection?', answer: 'Try moving closer to the nearest wifi antenna. Walls and buildings can reduce signal strength. Restart your WiFi and reconnect.' },
          { question: 'How to check balance?', answer: "Your balance is displayed on the main dashboard. Click the refresh icon next to the balance if it hasn't updated after a recharge." }
        ].map((item) => (
          <View key={item.question} style={{ borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 12, marginBottom: 12 }}>
            <TouchableOpacity activeOpacity={0.8} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#0f172a' }}>{item.question}</Text>
              <ChevronRight color="#64748b" size={18} />
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>{item.answer}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
        <TouchableOpacity
          style={{ width: '48%', borderRadius: 24, backgroundColor: '#ecfdf5', padding: 16, alignItems: 'center' }}
          activeOpacity={0.8}
          onPress={() => Linking.openURL('tel:0695060875')}
        >
          <Phone color="#15803d" size={22} />
          <Text style={{ marginTop: 8, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', color: '#047857' }}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ width: '48%', borderRadius: 24, backgroundColor: '#0f172a', padding: 16, alignItems: 'center' }}
          activeOpacity={0.8}
          onPress={() => Linking.openURL('http://wa.me/27695060875')}
        >
          <Zap color="#a855f7" size={22} />
          <Text style={{ marginTop: 8, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', color: '#fff' }}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUsageModal = () => (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ width: '48%', borderRadius: 40, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', padding: 24 }}>
          <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 8 }}>Total Used</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#0f172a' }}>{stats.totalUsed}</Text>
        </View>
        <View style={{ width: '48%', borderRadius: 40, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', padding: 24 }}>
          <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 8 }}>Active Time</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#0f172a' }}>{stats.sessionTime}</Text>
        </View>
      </View>
      <View style={{ borderRadius: 40, backgroundColor: 'rgba(245,237,255,0.8)', borderWidth: 1, borderColor: '#e9d5ff', padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed', marginBottom: 6 }}>Last Bundle</Text>
          <Text style={{ fontSize: 14, fontWeight: '900', textTransform: 'uppercase', color: '#0f172a' }}>{stats.lastBundle}</Text>
        </View>
        <View style={{ height: 48, width: 48, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <History color="#a855f7" size={24} />
        </View>
      </View>
      {user ? (
        <View style={{ borderRadius: 24, backgroundColor: '#0f172a', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', marginBottom: 6 }}>User Level</Text>
            <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', color: '#fff' }}>{user.plan} Member</Text>
          </View>
          <Award color="#a855f7" size={24} />
        </View>
      ) : null}
    </View>
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

  const renderMenuModal = () => (
      <View style={{ gap: 20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
          {[
            { icon: Package, label: 'Bundles', action: loadUserPackages },
            { icon: Activity, label: 'Usage', action: () => openModal('usage') },
            { icon: User, label: 'Account', action: () => openModal('login') },
            { icon: History, label: 'Transactions', action: () => openModal('soon') },
            { icon: Zap, label: 'Transfer', action: () => openModal('soon') },
            { icon: HelpCircle, label: 'Help', action: () => openModal('help') }
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              activeOpacity={0.8}
              style={{ width: '48%', borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: 'rgba(248,250,252,0.6)', padding: 24, alignItems: 'center' }}
              onPress={item.action}
            >
              <item.icon color="#a855f7" size={24} />
              <Text style={{ marginTop: 12, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', color: '#0f172a' }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#64748b' }}>Exclusive Offers</Text>
          <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', color: '#2563eb' }}>More Offers</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 12, paddingBottom: 8 }}>
          {offers.length ? offers.map((offer, index) => (
            <View key={`${offer.title || 'offer'}-${index}`} style={{ minWidth: 240, borderRadius: 40, backgroundColor: '#0f172a', padding: 20, overflow: 'hidden' }}>
              <View style={{ position: 'absolute', right: -16, top: -16, height: 96, width: 96, borderRadius: 48, backgroundColor: 'rgba(168,85,247,0.2)' }} />
              <View style={{ position: 'relative', zIndex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#a855f7', marginBottom: 12 }}>
                  <Star color="#ffffff" size={10} />
                  <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', color: '#fff' }}>Offer</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '900', textTransform: 'uppercase', color: '#fff', marginBottom: 8 }}>{offer.title || offer.name || 'Offer'}</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: '#cbd5e1', marginBottom: 16 }}>{offer.description || ''}</Text>
                <TouchableOpacity
                  style={{ borderRadius: 18, backgroundColor: '#a855f7', paddingVertical: 12, alignItems: 'center' }}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (offer.link) {
                      Linking.openURL(offer.link);
                    } else {
                      openModal('bundles');
                    }
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#fff' }}>{offer.cta || 'View'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )) : (
            <View style={{ borderRadius: 24, backgroundColor: '#0f172a', padding: 16 }}>
              <Text style={{ fontSize: 14, color: '#94a3b8' }}>No offers available right now.</Text>
            </View>
          )}
        </ScrollView>
      </View>
  );

  const renderSoonModal = () => (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>Coming soon</Text>
      <Text style={{ marginTop: 12, fontSize: 14, color: '#64748b' }}>This feature is not available yet.</Text>
    </View>
  );

  const renderFreeModal = () => (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>Free Trial</Text>
      <Text style={{ marginTop: 12, fontSize: 14, color: '#64748b' }}>Start a free trial from the dashboard.</Text>
    </View>
  );

  const renderSettingsModal = () => (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>Settings</Text>
      <Text style={{ marginTop: 12, fontSize: 14, color: '#64748b' }}>Manage your preferences from the settings tab.</Text>
    </View>
  );

  const renderLoginModal = () => (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>Login</Text>
      <Text style={{ marginTop: 12, fontSize: 14, color: '#64748b' }}>Use the login screen to access your account.</Text>
    </View>
  );

  const renderBundlesModal = () => {
    const filtered = packages.filter((pkg) => {
      const duration = Number(pkg.duration || 0);
      if (bundleCategory === 'weekly') return duration > 0 && duration <= 7;
      if (bundleCategory === 'monthly') return duration >= 8;
      return true;
    });

    if (selectedBundle) {
      const hasFunds = Number(balance) >= Number(selectedBundle.price || 0);
      return (
        <View style={{ gap: 24 }}>
          <View style={{ borderRadius: 32, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', padding: 24, overflow: 'hidden' }}>
            <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed', marginBottom: 6 }}>Selected Package</Text>
            <Text style={{ fontSize: 24, fontWeight: '900', textTransform: 'uppercase', color: '#0f172a', marginBottom: 6 }}>{formatActivePeriod(selectedBundle.name)}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', marginRight: 12 }}>{selectedBundle.duration} Days</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b' }}>{formatActivePeriod(selectedBundle.activePeriod)}</Text>
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', color: '#64748b' }}>Package Price</Text>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#0f172a' }}>R{selectedBundle.price}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingVertical: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', color: '#64748b' }}>Available Balance</Text>
              <Text style={{ fontSize: 14, fontWeight: '900', color: hasFunds ? '#16a34a' : '#dc2626' }}>R{balance}</Text>
            </View>
          </View>

          {!hasFunds ? (
            <View style={{ borderRadius: 18, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', padding: 16 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', color: '#991b1b', marginBottom: 4 }}>Insufficient Balance</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#b91c1c' }}>Please redeem a voucher pin to top up your balance before purchasing.</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={{ borderRadius: 999, backgroundColor: '#7c3aed', paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}
            activeOpacity={0.8}
            disabled={!hasFunds || loading}
            onPress={async () => {
              if (!selectedBundle) return;
              setLoading(true);
              try {
                const result = await apiConfirmPurchase(DEFAULT_MAC, selectedBundle.name, packages);
                if (result && (result.status === 'success' || result.status === 'ok')) {
                  notify('Package activated successfully', 'success');
                  await refreshData();
                  closeModal();
                } else {
                  notify('Purchase failed', 'error');
                }
              } catch (_error) {
                notify('Purchase failed', 'error');
              } finally {
                setLoading(false);
              }
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '900', textTransform: 'uppercase', color: '#ffffff' }}>Confirm & Pay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ borderRadius: 999, backgroundColor: '#e2e8f0', paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
            activeOpacity={0.8}
            onPress={() => renderBundlesM('all')}
          >
            <Text style={{ fontSize: 14, fontWeight: '900', textTransform: 'uppercase', color: '#0f172a' }}>Back to Bundles</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View>
        <View style={{ flexDirection: 'row', marginBottom: 24, padding: 4, backgroundColor: '#e2e8f0', borderRadius: 24 }}>
          {['all', 'weekly', 'monthly'].map((category) => (
            <TouchableOpacity
              key={category}
              activeOpacity={0.8}
              style={{ flex: 1, borderRadius: 16, paddingVertical: 10, backgroundColor: bundleCategory === category ? '#ede9fe' : 'transparent', alignItems: 'center' }}
              onPress={() => renderBundlesM(category)}
            >
              <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', color: bundleCategory === category ? '#7c3aed' : '#94a3b8' }}>
                {category === 'all' ? 'All' : category === 'weekly' ? 'Weekly' : 'Monthly'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <ActivityIndicator size="large" color="#a78bfa" />
          </View>
        ) : (
          filtered.map((pkg) => (
            <TouchableOpacity
              key={pkg.name}
              style={{ borderRadius: 32, borderWidth: 2, borderColor: '#f8fafc', backgroundColor: 'rgba(248,250,252,0.5)', padding: 24, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              activeOpacity={0.8}
              onPress={() => viewBundleDetails(pkg)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ height: 40, width: 40, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap color="#a855f7" size={20} />
                </View>
                <View style={{ marginLeft: 16 }}>
                  <Text style={{ fontWeight: '900', color: '#0f172a', fontSize: 14 }}>{pkg.duration} Days</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b' }}>Uncapped • {formatActivePeriod(pkg.activePeriod)}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#7c3aed' }}>R{pkg.price}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  const renderModalBody = () => {
    switch (modalKind) {
      case 'soon':
        return renderSoonModal();
      case 'bundles':
        return renderBundlesModal();
      case 'free':
        return renderFreeModal();
      case 'help':
        return renderHelpModal();
      case 'usage':
        return renderUsageModal();
      case 'settings':
        return renderSettingsModal();
      case 'menu':
        return renderMenuModal();
      case 'login':
        return renderLoginModal();
      default:
        return renderSoonModal();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {view === 'gateway' ? (
        renderGateway()
      ) : (
        
        <View style={styles.dashboardContainer}>
          
          {activeTab === 'home' && renderHome()}
          {activeTab === 'bundles' && renderBundles()}
          {activeTab === 'settings' && renderSettings()}

          <View className="pb-2 mx-auto max-w-app-margin-12 topNav">
          <View className="pt-2 mx-4 min-[480px]:mx-8 sm:mx-12">
            <View nativeID="navbar__top" className="flex items-center justify-between">
              <Text className="backdrop-blur rounded-xl p-2 text-2xl font-bold">Asher-link Kasi Wifi</Text>
              <View className="hidden gap-12 md:flex">
                <TouchableOpacity activeOpacity={0.8} className="flex items-center justify-center">
                  <Text className="hover:underline">Bundles</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} className="flex items-center justify-center">
                  <Text className="hover:underline">Packages</Text>
                </TouchableOpacity>
              </View>
              <View className="flex backdrop-blur items-center justify-center rounded-xl md:hidden">
                <View className="backdrop-blur rounded-xl py-1 px-2">
                  <Text>R </Text>
                  <Text className="font-bold balance-el loader">{balance}</Text>
                </View>
              </View>
              <TouchableOpacity activeOpacity={0.8} accessibilityLabel="data-contact-button" className="hidden py-4 px-7 button button-secondary md:block w-max">
                <Text>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

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

      <Modal visible={modal === 'modalBody'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalKind === 'usage' && 'Usage'}
                {modalKind === 'help' && 'Help'}
                {modalKind === 'menu' && 'Menu'}
                {modalKind === 'settings' && 'Settings'}
                {modalKind === 'login' && 'Account'}
                {modalKind === 'bundles' && 'Bundles'}
                {modalKind === 'free' && 'Free Trial'}
                {!['usage', 'help', 'menu', 'settings', 'login', 'bundles', 'free'].includes(modalKind) && 'Info'}
              </Text>
              <TouchableOpacity onPress={() => setModal(null)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            {renderModalBody()}
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
          <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end sm:justify-center items-center p-6">
          <View className="w-full sm:max-w-md max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl p-6 overflow-hidden">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3">
                <View className="bg-slate-100 rounded-xl p-3">
                  {modalKind === 'soon' && <Clock color="#0f172a" size={24} />}
                  {modalKind === 'bundles' && <Package color="#0f172a" size={24} />}
                  {modalKind === 'free' && <Gift color="#0f172a" size={24} />}
                  {modalKind === 'help' && <HelpCircle color="#0f172a" size={24} />}
                  {modalKind === 'usage' && <Activity color="#0f172a" size={24} />}
                  {modalKind === 'settings' && <Settings color="#0f172a" size={24} />}
                  {modalKind === 'menu' && <LayoutGrid color="#0f172a" size={24} />}
                  {modalKind === 'login' && <User color="#0f172a" size={24} />}
                </View>
                <Text className="text-lg font-black text-slate-900">
                  {modalKind === 'soon' ? 'Coming Soon' :
                   modalKind === 'bundles' ? 'WiFi Bundles' :
                   modalKind === 'free' ? 'Free WiFi' :
                   modalKind === 'help' ? 'Support & FAQ' :
                   modalKind === 'usage' ? 'WiFi Usage' :
                   modalKind === 'settings' ? t.settings :
                   modalKind === 'menu' ? 'Menu' :
                   modalKind === 'login' ? 'Account Login' : 'Coming Soon'}
                </Text>
              </View>
              <TouchableOpacity onPress={closeModal} activeOpacity={0.8}>
                <X color="#475569" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              {renderModalBody()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={trialActive} animationType="fade" transparent>
        <View className="flex-1 bg-black/60 justify-center items-center">
          <View className="w-full max-w-sm bg-slate-900 rounded-2xl p-6 items-center">
            <Text className="text-white font-black text-lg mb-4">Connecting in...</Text>
            <Text className="text-white font-black text-6xl mb-4">{trialTimer}</Text>
            <Text className="text-slate-400 text-sm text-center">Complete the ad watch to unlock your free session.</Text>
          </View>
        </View>
      </Modal>
      {toast ? <NotificationToast message={toast.message} type={toast.type} /> : null}
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
    paddingBottom: 100,
  },
  tabContentInnerPadding: {
    paddingHorizontal: 12,
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

