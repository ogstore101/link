import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Activity,
  Award,
  ChevronRight,
  Clock,
  Gift,
  HelpCircle,
  History,
  Grid as LayoutGrid,
  Languages,
  Package,
  Phone,
  RefreshCcw,
  Settings,
  Sparkles,
  Star,
  User,
  Wifi,
  X,
  Zap
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
import NotificationToast from './components/NotificationToast';

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

const formatActivePeriod = (text) => {
  if (typeof text !== 'string') return text;
  if (text.includes('in')) return `${text.slice(0, -1)} ${Number(text.slice(0, -1)) > 1 ? 'minutes' : 'minute'}`;
  if (text.includes('h')) return `${text.slice(0, -1)} ${Number(text.slice(0, -1)) > 1 ? 'hours' : 'hour'}`;
  if (text.includes('d')) return `${text.slice(0, -1)} ${Number(text.slice(0, -1)) > 1 ? 'days' : 'day'}`;
  if (text.includes('w')) return `${text.slice(0, -1)} ${Number(text.slice(0, -1)) > 1 ? 'Weeks' : 'Week'}`;
  if (text.includes('m')) return `${text.slice(0, -1)} ${Number(text.slice(0, -1)) > 1 ? 'Months' : 'Month'}`;
  return text;
};

export default function App() {
  const [voucherCode, setVoucherCode] = useState('');
  const [tokenIconColor, setTokenIconColor] = useState('#94a3b8');
  const [balance, setBalance] = useState('0.00');
  const [packages, setPackages] = useState([]);
  const [offers, setOffers] = useState([]);
  const [stats, setStats] = useState({ totalUsed: '0 KB', sessionTime: '00:00:00', lastBundle: 'None' });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalKind, setModalKind] = useState('');
  const [bundleCategory, setBundleCategory] = useState('all');
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [dataSaver, setDataSaver] = useState(false);
  const [autoConnect, setAutoConnect] = useState(false);
  const [particles, setParticles] = useState(true);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [user, setUser] = useState(null);
  const [trialActive, setTrialActive] = useState(false);
  const [trialTimer, setTrialTimer] = useState(0);
  const [trialAdData, setTrialAdData] = useState(null);
  const isMounted = useRef(true);

  const t = useMemo(() => translations[language] || translations.en, [language]);

  const loadAppSettings = async () => {
    try {
      const entries = await AsyncStorage.multiGet(['dataSaver', 'auto_connect', 'particles', 'language']);
      const stored = Object.fromEntries(entries) as Record<string, string | null>;
      setDataSaver(stored.dataSaver !== 'false');
      setAutoConnect(stored.auto_connect === 'true');
      setParticles(stored.particles !== 'false');
      if (stored.language) setLanguage(stored.language);
    } catch (_error) {
      console.error('Failed to load settings', _error);
    }
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
    setLoading(true);
    try {
      const userData: any = await fetchAndRenderUserData(DEFAULT_MAC);
      if (userData.balance !== undefined) setBalance(userData.balance);
      if (userData.usage) {
        setStats((prevStats) => ({
          totalUsed: userData.usage.total_used || prevStats.totalUsed,
          sessionTime: userData.usage.session_time || prevStats.sessionTime,
          lastBundle: userData.usage.last_bundle || prevStats.lastBundle
        }));
      }
      const bundles = await getBundlesData();
      setPackages(bundles.packages || []);
      const offersData = await fetchUserOffers(DEFAULT_MAC);
      setOffers(Array.isArray(offersData.offers) ? offersData.offers : []);
    } catch (_error) {
      notify('Unable to refresh data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  

  

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    loadAppSettings();
    refreshData();
    const interval = setInterval(refreshData, 20000);
    return () => clearInterval(interval);
  }, [refreshData]);

  

  

  const openModal = async (kind) => {
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

  const renderBundles = (category) => {
    setBundleCategory(category);
    setSelectedBundle(null);
  };

  const viewBundleDetails = (bundle) => {
    setSelectedBundle(bundle);
  };

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

  const updateLang = async (value) => {
    setLanguage(value);
    await savePref('language', value);
    notify(`Language: ${value.toUpperCase()}`, 'success');
  };

  const togglePref = async (key) => {
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

  const renderSoonModal = () => (
    <View className="items-center justify-center py-12">
      <View className="rounded-full border border-slate-200 p-5">
        <ActivityIndicator size="large" color="#a78bfa" />
      </View>
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
        <View className="space-y-6">
          <View className="rounded-[32px] bg-slate-50 border border-slate-100 p-6 relative overflow-hidden">
            <View className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl" />
            <Text className="text-[9px] font-black uppercase tracking-widest text-purple-600 mb-1">Selected Package</Text>
            <Text className="text-2xl font-black uppercase text-slate-900 mb-1">{formatActivePeriod(selectedBundle.name)}</Text>
            <View className="mt-3 flex-row justify-center gap-4 text-xs font-bold text-slate-400">
              <Text>{selectedBundle.duration} Days</Text>
              <Text>{formatActivePeriod(selectedBundle.activePeriod)}</Text>
            </View>
          </View>

          <View className="space-y-3">
            <View className="flex-row justify-between border-b border-slate-100 py-3">
              <Text className="text-xs font-black uppercase tracking-wide text-slate-400">Package Price</Text>
              <Text className="text-sm font-black text-slate-900">R{selectedBundle.price}</Text>
            </View>
            <View className="flex-row justify-between border-b border-slate-100 py-3">
              <Text className="text-xs font-black uppercase tracking-wide text-slate-400">Available Balance</Text>
              <Text className={`text-sm font-black ${hasFunds ? 'text-emerald-600' : 'text-rose-500'}`}>R{balance}</Text>
            </View>
          </View>

          {!hasFunds ? (
            <View className="rounded-2xl bg-red-50 border border-red-100 p-4 flex-row gap-3">
              <View>
                <Text className="text-[10px] font-black uppercase tracking-widest text-red-800">Insufficient Balance</Text>
                <Text className="text-[9px] font-bold leading-tight text-red-600">Please redeem a voucher pin to top up your balance before purchasing.</Text>
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            className="rounded-full bg-purple-500 py-4 items-center justify-center"
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
            <Text className="text-sm font-bold uppercase text-white">Confirm & Pay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-full bg-slate-200 py-3 items-center justify-center"
            activeOpacity={0.8}
            onPress={() => renderBundles('all')}
          >
            <Text className="text-sm font-bold uppercase text-slate-800">Back to Bundles</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View>
        <View className="flex-row gap-2 mb-6 p-1 bg-slate-100 rounded-2xl">
          {['all', 'weekly', 'monthly'].map((category) => (
            <TouchableOpacity
              key={category}
              activeOpacity={0.8}
              className={`flex-1 rounded-xl py-2 ${bundleCategory === category ? 'bg-purple-100' : 'bg-transparent'}`}
              onPress={() => renderBundles(category)}
            >
              <Text className={`text-[10px] font-black uppercase text-center ${bundleCategory === category ? 'text-purple-500' : 'text-slate-400'}`}>
                {category === 'all' ? 'All' : category === 'weekly' ? 'Weekly' : 'Monthly'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#a78bfa" />
          </View>
        ) : (
          filtered.map((pkg) => (
            <TouchableOpacity
              key={pkg.name}
              className="rounded-[32px] border-2 border-slate-50 bg-slate-50/50 p-6 mb-3 flex-row items-center justify-between"
              activeOpacity={0.8}
              onPress={() => viewBundleDetails(pkg)}
            >
              <View className="flex-row items-center gap-4">
                <View className="h-10 w-10 rounded-xl bg-white shadow-sm items-center justify-center flex">
                  <Zap color="#a855f7" size={20} />
                </View>
                <View>
                  <Text className="font-black text-slate-900 text-sm">{pkg.duration} Days</Text>
                  <Text className="text-[12px] font-bold text-slate-400 tracking-tight">Uncapped • {formatActivePeriod(pkg.activePeriod)}</Text>
                </View>
              </View>
              <Text className="text-xl font-black text-purple-500">R{pkg.price}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  const renderFreeModal = () => (
    <View className="items-center py-6">
      <View className="mb-6 h-20 w-20 rounded-[32px] bg-purple-50 items-center justify-center flex">
        <Gift color="#a855f7" size={40} />
      </View>
      <Text className="text-slate-500 font-bold text-sm px-6 leading-relaxed mb-8 text-center">
        Watch a 15-second sponsored video to unlock 30 minutes of free surfing.
      </Text>
      <TouchableOpacity className="rounded-2xl bg-purple-500 py-4 items-center justify-center w-full" activeOpacity={0.8} onPress={onStartTrialAd}>
        <Text className="text-sm font-black uppercase text-white">Connect Free Session</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHelpModal = () => (
    <View className="space-y-4">
      <View className="space-y-2 mb-8">
        {[
          { question: 'Voucher not working?', answer: `Ensure you have entered all characters correctly. Avoid spaces at the start or end. If it still fails, contact support with your MAC ID: ${DEFAULT_MAC}.` },
          { question: 'Slow connection?', answer: 'Try moving closer to the nearest wifi antenna. Walls and buildings can reduce signal strength. Restart your WiFi and reconnect.' },
          { question: 'How to check balance?', answer: "Your balance is displayed on the main dashboard. Click the refresh icon next to the balance if it hasn't updated after a recharge." }
        ].map((item) => (
          <View key={item.question} className="border-b border-slate-200 pb-3 mb-3">
            <TouchableOpacity activeOpacity={0.8} className="flex-row justify-between items-center">
              <Text className="text-sm font-bold text-slate-900">{item.question}</Text>
              <ChevronRight color="#64748b" size={18} />
            </TouchableOpacity>
            <Text className="text-xs text-slate-500 mt-2">{item.answer}</Text>
          </View>
        ))}
      </View>
      <View className="flex-row flex-wrap justify-between gap-3">
        <TouchableOpacity
          className="w-[48%] rounded-3xl bg-emerald-50 p-4 items-center"
          activeOpacity={0.8}
          onPress={() => Linking.openURL('tel:0695060875')}
        >
          <Phone color="#15803d" size={22} />
          <Text className="mt-2 text-[10px] font-black uppercase text-emerald-700">Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-[48%] rounded-3xl bg-slate-900 p-4 items-center"
          activeOpacity={0.8}
          onPress={() => Linking.openURL('http://wa.me/27695060875')}
        >
          <Zap color="#a855f7" size={22} />
          <Text className="mt-2 text-[10px] font-black uppercase text-white">WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUsageModal = () => (
    <View className="space-y-6">
      <View className="flex-row flex-wrap gap-4">
        <View className="w-[48%] rounded-[40px] bg-slate-50 border border-slate-100 p-6">
          <Text className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Used</Text>
          <Text className="text-2xl font-black text-slate-900">{stats.totalUsed}</Text>
        </View>
        <View className="w-[48%] rounded-[40px] bg-slate-50 border border-slate-100 p-6">
          <Text className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Time</Text>
          <Text className="text-2xl font-black text-slate-900">{stats.sessionTime}</Text>
        </View>
      </View>
      <View className="rounded-[40px] bg-purple-50/50 border border-purple-100 p-6 flex-row items-center justify-between">
        <View>
          <Text className="text-[9px] font-black uppercase tracking-widest text-purple-600 mb-1">Last Bundle</Text>
          <Text className="text-sm font-black uppercase text-slate-900">{stats.lastBundle}</Text>
        </View>
        <View className="h-12 w-12 rounded-2xl bg-white items-center justify-center flex shadow-sm">
          <History color="#a855f7" size={24} />
        </View>
      </View>
      {user ? (
        <View className="rounded-3xl bg-slate-900 p-5 text-white flex-row items-center justify-between">
          <View>
            <Text className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-1">User Level</Text>
            <Text className="text-xs font-black uppercase text-white">{user.plan} Member</Text>
          </View>
          <Award color="#a855f7" size={24} />
        </View>
      ) : null}
    </View>
  );

  const renderSettingsModal = () => (
    <View className="space-y-4">
      {[
        { icon: 'zap', label: t.dataSaver, key: 'dataSaver', enabled: dataSaver },
        { icon: 'wifi', label: 'Auto-Connect', key: 'auto_connect', enabled: autoConnect },
        { icon: 'sparkles', label: 'Theme Particles', key: 'particles', enabled: particles }
      ].map((item) => (
        <View key={item.key} className="rounded-3xl bg-slate-50 p-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="rounded-xl bg-white p-2">
              {item.icon === 'zap' && <Zap color="#64748b" size={16} />}
              {item.icon === 'wifi' && <Wifi color="#64748b" size={16} />}
              {item.icon === 'sparkles' && <Sparkles color="#64748b" size={16} />}
            </View>
            <Text className="text-[10px] font-black uppercase text-slate-400">{item.label}</Text>
          </View>
          <TouchableOpacity
            className={`h-6 w-10 rounded-full p-1 ${item.enabled ? 'bg-purple-500' : 'bg-slate-300'}`}
            activeOpacity={0.8}
            onPress={() => togglePref(item.key)}
          >
            <View className={`h-4 w-4 rounded-full bg-white ${item.enabled ? 'ml-5' : 'ml-1'}`} />
          </TouchableOpacity>
        </View>
      ))}
      <View className="rounded-3xl bg-slate-50 p-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="rounded-xl bg-white p-2">
            <Languages color="#64748b" size={16} />
          </View>
          <Text className="text-[10px] font-black uppercase text-slate-400">{t.lang}</Text>
        </View>
        <View className="flex-row gap-2">
          {['en', 'sotho'].map((value) => (
            <TouchableOpacity
              key={value}
              className={`rounded-full px-3 py-2 ${language === value ? 'bg-purple-500' : 'bg-slate-300'}`}
              activeOpacity={0.8}
              onPress={() => updateLang(value)}
            >
              <Text className="text-[10px] font-black uppercase text-white">{value === 'en' ? 'English' : 'Sesotho'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View className="h-px bg-slate-100 my-2" />
      <TouchableOpacity className="rounded-3xl bg-slate-50 p-4 flex-row items-center justify-between" activeOpacity={0.8} onPress={() => notify('Encryption key changed', 'success')}>
        <View className="flex-row items-center gap-3">
          <RefreshCcw color="#64748b" size={16} />
          <Text className="text-[10px] font-black uppercase">Security Key</Text>
        </View>
        <Text className="text-[9px] font-black uppercase text-purple-500">Update Key</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="rounded-3xl bg-red-50 p-4 flex-row items-center justify-between"
        activeOpacity={0.8}
        onPress={async () => {
          await AsyncStorage.clear();
          setDataSaver(false);
          setAutoConnect(false);
          setParticles(true);
          setLanguage(DEFAULT_LANGUAGE);
          notify('Cache cleared', 'success');
        }}
      >
        <View className="flex-row items-center gap-3">
          <X color="#f87171" size={16} />
          <Text className="text-[10px] font-black uppercase">Clear Cache</Text>
        </View>
        <ChevronRight color="#fca5a5" size={16} />
      </TouchableOpacity>
    </View>
  );

  const renderMenuModal = () => (
    <View>
      <View className="flex-row flex-wrap justify-between gap-3 mb-6">
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
            className="w-[48%] rounded-3xl border border-slate-50 bg-slate-50/50 p-6 items-center"
            onPress={item.action}
          >
            <item.icon color="#a855f7" size={24} />
            <Text className="mt-3 text-[10px] font-black uppercase text-slate-900">{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View className="mb-4 flex-row items-center justify-between px-2">
        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Exclusive Offers</Text>
        <Text className="text-[10px] font-black uppercase text-blue-400">More Offers</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-4 pb-2">
        {offers.length ? offers.map((offer, index) => (
          <View key={`${offer.title || 'offer'}-${index}`} className="min-w-[240px] rounded-[40px] bg-slate-900 p-5 overflow-hidden">
            <View className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-purple-500/20 blur-2xl" />
            <View className="relative z-10">
              <View className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-500 text-[8px] font-black uppercase tracking-wider mb-3 text-white flex-row">
                <Star color="#ffffff" size={10} />
                <Text className="text-[8px] font-black uppercase text-white">Offer</Text>
              </View>
              <Text className="text-sm font-black uppercase text-white mb-1">{offer.title || offer.name || 'Offer'}</Text>
              <Text className="text-[10px] font-bold uppercase tracking-tight text-slate-400 mb-4">{offer.description || ''}</Text>
              <TouchableOpacity
                className="rounded-xl bg-purple-500 py-3 items-center"
                activeOpacity={0.8}
                onPress={() => {
                  if (offer.link) {
                    Linking.openURL(offer.link);
                  } else {
                    openModal('bundles');
                  }
                }}
              >
                <Text className="text-[9px] font-black uppercase tracking-widest text-white">{offer.cta || 'View'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )) : (
          <View className="rounded-3xl bg-slate-950 p-4">
            <Text className="text-sm text-slate-400">No offers available right now.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderLoginModal = () => {
    if (user) {
      return (
        <View className="space-y-6">
          <View className="rounded-[40px] bg-slate-50 p-5 flex-row items-center gap-4">
            <View className="h-16 w-16 rounded-[24px] bg-purple-500 items-center justify-center flex">
              <Text className="text-2xl font-black text-white">{user.name.charAt(0)}</Text>
            </View>
            <View>
              <Text className="text-base font-black uppercase text-slate-900">{user.name}</Text>
              <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{user.id}</Text>
            </View>
          </View>
          <View className="space-y-3">
            <View className="rounded-2xl bg-white border border-slate-100 p-4 flex-row justify-between">
              <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">Joined</Text>
              <Text className="text-[10px] font-bold text-slate-900">{user.joined}</Text>
            </View>
            <View className="rounded-2xl bg-white border border-slate-100 p-4 flex-row justify-between">
              <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</Text>
              <Text className="text-[10px] font-bold text-slate-900">{user.phone}</Text>
            </View>
          </View>
          <TouchableOpacity
            className="rounded-2xl bg-red-50 py-4 items-center"
            activeOpacity={0.8}
            onPress={simulateLogout}
          >
            <Text className="text-[10px] font-black uppercase tracking-widest text-red-500">Sign Out</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="space-y-4">
        <View>
          <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Username / Phone</Text>
          <TextInput placeholder="username" placeholderTextColor="#64748b" className="rounded-full bg-slate-50 border border-transparent p-3 font-black text-slate-900" />
        </View>
        <View>
          <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Password</Text>
          <TextInput placeholder="••••••••" placeholderTextColor="#64748b" secureTextEntry className="rounded-full bg-slate-50 border border-transparent p-3 font-black text-slate-900" />
        </View>
        <TouchableOpacity className="rounded-full bg-purple-500 py-4 items-center" activeOpacity={0.8} onPress={simulateLogin}>
          <Text className="text-sm font-bold uppercase text-white">Sign In</Text>
        </TouchableOpacity>
        <Text className="text-center text-[10px] font-bold uppercase text-slate-400">
          No account? <Text className="text-purple-500">Register on our Website.</Text>
        </Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }} className="flex-1">
      <StatusBar style="light" />
      <View className="fixed w-full text-white">
        <View className="pb-2 mx-auto max-w-app-margin-12">
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
      </View>
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
