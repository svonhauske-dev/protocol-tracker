import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Paywall from '../components/Paywall';
import {
  configurePro, fetchProStatus, getOfferings, purchasePackage, restorePurchases,
  getDevPro, setDevPro,
} from '../lib/pro';

// Pro gating context. `isPro` is the single source of truth; `requirePro(feature)`
// is the gate — returns true (allow) or opens the paywall and returns false.
const ProContext = createContext(null);

// Safe default so components work outside the provider (e.g. tests): treat as free
// but never block (requirePro allows) — the provider is what enforces.
export function useProGate() {
  return useContext(ProContext) || { isPro: false, requirePro: () => true, openPaywall: () => {} };
}

export function ProProvider({ userId, children }) {
  const [isPro, setIsPro] = useState(getDevPro());
  const [packages, setPackages] = useState([]);
  const [paywall, setPaywall] = useState(null); // null | { feature }
  const [purchasing, setPurchasing] = useState(false);

  const refresh = useCallback(async () => {
    const dev = getDevPro();
    const { isPro: rc, available } = await fetchProStatus();
    setIsPro(dev || (available && rc));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (userId) await configurePro(userId);
      const pkgs = await getOfferings().catch(() => []);
      if (!alive) return;
      setPackages(pkgs);
      await refresh();
    })();
    return () => { alive = false; };
  }, [userId, refresh]);

  // The gate. Call before a Pro-only action; if free, the paywall opens.
  const requirePro = useCallback((feature) => {
    if (isPro) return true;
    setPaywall({ feature });
    return false;
  }, [isPro]);

  const openPaywall = useCallback((feature) => setPaywall({ feature: feature || null }), []);

  const handlePurchase = async (planId) => {
    const pkg = packages.find((p) =>
      (p.identifier || '').toLowerCase().includes(planId) || (p.packageType || '').toLowerCase().includes(planId));
    if (!pkg) { setPaywall(null); return; } // no SDK/offering (dev) — nothing to buy
    setPurchasing(true);
    try {
      const { isPro: nowPro } = await purchasePackage(pkg);
      setIsPro(nowPro);
      setPaywall(null);
    } catch { /* cancelled / error — keep paywall open */ }
    finally { setPurchasing(false); }
  };

  const handleRestore = async () => {
    const { isPro: nowPro } = await restorePurchases();
    setIsPro(nowPro || getDevPro());
    if (nowPro) setPaywall(null);
  };

  // __DEV__-only: flip Pro locally to exercise gates in the Simulator.
  const toggleDevPro = useCallback(() => { setDevPro(!getDevPro()); refresh(); }, [refresh]);

  return (
    <ProContext.Provider value={{ isPro, requirePro, openPaywall, refresh, toggleDevPro }}>
      {children}
      <Paywall
        visible={!!paywall}
        feature={paywall?.feature}
        packages={packages}
        purchasing={purchasing}
        onClose={() => setPaywall(null)}
        onPurchase={handlePurchase}
        onRestore={handleRestore}
      />
    </ProContext.Provider>
  );
}
