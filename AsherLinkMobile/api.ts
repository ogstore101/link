const RETRY_DELAYS = [1000, 2000, 3000, 5000, 8000];

export const getApiBase = () => ((globalThis as any).API_BASE || 'http://172.17.0.2:5000');

export async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 5): Promise<any> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (attempt === retries - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt] || 8000));
    }
  }
}

export async function checkNetState(mac: string): Promise<boolean> {
  try {
    const data = await fetchWithRetry(`${getApiBase()}/balance?mac=${encodeURIComponent(mac)}`);
    return data && (data.status === 'ok' || data.status === 'success');
  } catch (error) {
    console.error('checkNetState failed', error);
    return false;
  }
}

export async function getBundlesData(): Promise<{ packages: any[] }> {
  try {
    const data = await fetchWithRetry(`${getApiBase()}/get-packages`);
    const packages = Array.isArray(data && data.packages ? data.packages : []) ? data.packages : [];

    if (packages.length) {
      return { packages };
    }

    throw new Error('Invalid package response');
  } catch (error) {
    console.warn('Package API unavailable, using local fallback', error);
  }

  try {
    const fallback = require('./data/packages.json');
    return {
      packages: Array.isArray(fallback.packages) ? fallback.packages : []
    };
  } catch (fallbackError) {
    console.error('Fallback packages fetch failed', fallbackError);
    return { packages: [] };
  }
}

export async function fetchAndRenderUserData(mac: string): Promise<any> {
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
    console.error('fetchAndRenderUserData failed', error);
    return {};
  }
}

export async function fetchUserOffers(mac: string): Promise<any> {
  try {
    const data = await fetchWithRetry(`${getApiBase()}/useroffers?mac=${encodeURIComponent(mac)}`);
    return data || {};
  } catch (error) {
    console.error('fetchUserOffers failed', error);
    return {};
  }
}

export async function handleVoucher(mac: string, pin: string): Promise<any> {
  const payload = { mac, pin };
  return await fetchWithRetry(`${getApiBase()}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function startTrialAd(mac: string): Promise<any> {
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
}

export async function connectTrial(ad_id: string, mac: string): Promise<any> {
  const result = await fetchWithRetry(`${getApiBase()}/log-ad-view/${encodeURIComponent(ad_id)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mac, type: 'ad_completed' })
  });
  return result;
}

export async function confirmPurchase(mac: string, packageName: string, packages: any[]): Promise<any> {
  const pkg = packages.find((item) => item.name === packageName);
  if (!pkg) {
    return { status: 'error', message: 'Package not found' };
  }

  return await fetchWithRetry(`${getApiBase()}/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mac, package: pkg.name })
  });
}
