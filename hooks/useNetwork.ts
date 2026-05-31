import { useState, useEffect } from 'react';
import { checkNetState as apiCheckNetState } from '../api';

export default function useNetwork(mac = null) {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ok = await apiCheckNetState(mac);
        if (mounted) setOnline(Boolean(ok));
      } catch (_error) {
        if (mounted) setOnline(false);
      }
    })();
    return () => { mounted = false; };
  }, [mac]);
  return { online };
}
