import { useState, useEffect } from 'react';

export default function useNetwork(mac = null) {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Placeholder for API call - implement based on your API
        // const ok = await apiCheckNetState(mac);
        // if (mounted) setOnline(Boolean(ok));
        if (mounted) setOnline(true);
      } catch (_error) {
        if (mounted) setOnline(false);
      }
    })();
    return () => { mounted = false; };
  }, [mac]);
  return { online };
}
