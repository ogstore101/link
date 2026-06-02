import { Platform } from 'react-native';

const RETRY_DELAYS = [1000, 2000, 3000, 5000, 8000];
const OFFLINE_TEST_MODE = true;

const MOCK_USER_DATA = {
  balance: '50.00',
  usage: {
    total_used: '1.2 GB',
    session_time: '00:18:42',
    last_bundle: 'Student Lite'
  }
};

const MOCK_OFFERS = {
  offers: [
    { id: 'o1', title: 'Purple Rewards', desc: 'Get 500MB for every 5 referrals' },
    { id: 'o2', title: 'Night Shift', desc: 'Free data from 12AM - 4AM' }
  ]
};

const MOCK_AD_DATA = {
  _id: 'mock-ad-1',
  ad_duration: '10',
  ad_title: 'Mock Trial Ad',
  ad_description: 'Watch this ad to get free trial access.'
};

const MOCK_PACKAGES = require('./data/packages.json');

export const getApiBase = () => {
  if ((globalThis as any).API_BASE) {
    return (globalThis as any).API_BASE;
  }

  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
    const hostname = window.location.hostname || 'localhost';
    return `${protocol}://${hostname}:5000`;
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  if (Platform.OS === 'ios') {
    return 'http://localhost:5000';
  }

  return 'http://172.17.0.2:5000';
};

export async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 5): Promise<any | null> {
  if (OFFLINE_TEST_MODE) {
    return null;
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return await response.json();
    } catch (error: any) {
      if (attempt === retries - 1) {
        console.error(`fetchWithRetry failed for ${url}:`, error);
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt] || 8000));
    }
  }
}

export async function checkNetState(mac: string): Promise<boolean> {
  if (OFFLINE_TEST_MODE) {
    return true;
  }

  try {
    try {
      const data = await fetchWithRetry(`${getApiBase()}/balance?mac=${encodeURIComponent(mac)}`);
      return data && (data.status === 'ok' || data.status === 'success');
    } catch (error) {
      console.warn('checkNetState API failed:', error);
    }
  } catch (error) {
    console.error('checkNetState failed', error);
  }
  return false;
}

export async function getBundlesData(): Promise<{ packages: any[] }> {
  if (OFFLINE_TEST_MODE) {
    return {
      packages: Array.isArray(MOCK_PACKAGES?.packages) ? MOCK_PACKAGES.packages : []
    };
  }

  try {
    try {
      const data = await fetchWithRetry(`${getApiBase()}/get-packages`);
      const packages = Array.isArray(data && data.packages ? data.packages : []) ? data.packages : [];
      if (packages.length) {
        return { packages };
      }
    } catch (error) {
      console.warn('Package API unavailable, trying fallback:', error);
    }
  } catch (error) {
    console.error('getBundlesData outer error:', error);
  }

  try {
    const fallback = require('./data/packages.json');
    return {
      packages: Array.isArray(fallback.packages) ? fallback.packages : []
    };
  } catch (fallbackError) {
    console.warn('Fallback packages fetch failed:', fallbackError);
    return { packages: [] };
  }
}

export async function fetchAndRenderUserData(mac: string): Promise<any> {
  if (OFFLINE_TEST_MODE) {
    return MOCK_USER_DATA;
  }

  try {
    try {
      const data = await fetchWithRetry(`${getApiBase()}/userdata?mac=${encodeURIComponent(mac)}`);
      if (!data) {
        return {};
      }

      const result: any = {};
      if (data.balance !== undefined) {
        result.balance = Number(data.balance).toFixed(2);
      }
      if (data.usage) {
        result.usage = {
          total_used: data.usage.total_used || '0 KB',
          session_time: data.usage.session_time || '00:00:00',
          last_bundle: data.usage.last_bundle || 'None'
        };
      }

      return result;
    } catch (error) {
      console.warn('fetchAndRenderUserData API call failed:', error);
    }
  } catch (error) {
    console.error('fetchAndRenderUserData outer error:', error);
  }
  return {};
}

export async function fetchUserOffers(mac: string): Promise<any> {
  if (OFFLINE_TEST_MODE) {
    return MOCK_OFFERS;
  }

  try {
    try {
      const data = await fetchWithRetry(`${getApiBase()}/useroffers?mac=${encodeURIComponent(mac)}`);
      return data || {};
    } catch (error) {
      console.warn('fetchUserOffers API call failed:', error);
    }
  } catch (error) {
    console.error('fetchUserOffers outer error:', error);
  }
  return {};
}

export async function handleVoucher(mac: string, pin: string): Promise<any> {
  if (OFFLINE_TEST_MODE) {
    if (!pin || pin.trim().length < 4) {
      return { status: 'invalid', message: 'Invalid voucher code' };
    }
    return { status: 'success', message: 'Voucher redeemed successfully' };
  }

  try {
    const payload = { mac, pin };
    return await fetchWithRetry(`${getApiBase()}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('handleVoucher failed:', error);
    return { status: 'error', message: String(error) };
  }
}

export async function startTrialAd(mac: string): Promise<any> {
  if (OFFLINE_TEST_MODE) {
    return MOCK_AD_DATA;
  }

  try {
    const result = await fetchWithRetry(`${getApiBase()}/get-ad`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac })
    });
    const ads = Array.isArray(result.ads) ? result.ads : [result.ads];
    const adData = ads && ads[0];

    if (!adData || result.status !== 'success') {
      throw new Error('No ad available');
    }

    return adData;
  } catch (error) {
    console.error('startTrialAd failed:', error);
    return { status: 'error', message: String(error) };
  }
}

export async function connectTrial(ad_id: string, mac: string): Promise<any> {
  if (OFFLINE_TEST_MODE) {
    return { status: 'success', message: 'Trial connected' };
  }

  try {
    const result = await fetchWithRetry(`${getApiBase()}/log-ad-view/${encodeURIComponent(ad_id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac, type: 'ad_completed' })
    });
    return result;
  } catch (error) {
    console.error('connectTrial failed:', error);
    return { status: 'error', message: String(error) };
  }
}

export async function confirmPurchase(mac: string, packageName: string, packages: any[]): Promise<any> {
  if (OFFLINE_TEST_MODE) {
    const pkg = packages.find((item) => item.name === packageName);
    if (!pkg) {
      return { status: 'error', message: 'Package not found' };
    }
    return { status: 'success', message: 'Package activated successfully' };
  }

  try {
    const pkg = packages.find((item) => item.name === packageName);
    if (!pkg) {
      return { status: 'error', message: 'Package not found' };
    }

    return await fetchWithRetry(`${getApiBase()}/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac, package: pkg.name })
    });
  } catch (error) {
    console.error('confirmPurchase failed:', error);
    return { status: 'error', message: String(error) };
  }
}
