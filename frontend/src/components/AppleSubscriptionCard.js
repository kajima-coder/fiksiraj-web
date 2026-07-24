/**
 * AppleSubscriptionCard
 *
 * The single source of truth for the native-iOS subscription UI.
 * Owns the full StoreKit 2 purchase / restore state machine so
 * SettingsPage stays a thin renderer.
 *
 * NEVER shows Stripe checkout or portal UI. If the caller passes
 * `existingStripeActive`, we show the fixed neutral message only.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CreditCard, RefreshCw, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  PRODUCT_ID,
  initAppleIap,
  loadProduct,
  purchase as appleBuy,
  restore as appleRestore,
  getIapLogs,
} from '../lib/appleIap';

const STATES = Object.freeze({
  INITIALIZING: 'initializing',
  LOADING_PRODUCT: 'loading_product',
  READY: 'ready',
  PRODUCT_UNAVAILABLE: 'product_unavailable',
  PURCHASING: 'purchasing',
  PENDING: 'pending',
  VERIFYING: 'verifying',
  VERIFICATION_FAILED: 'verification_failed',
  SUCCESS: 'success',
  RESTORING: 'restoring',
  RESTORE_SUCCESS: 'restore_success',
  RESTORE_EMPTY: 'restore_empty',
  RESTORE_FAILED: 'restore_failed',
});

export default function AppleSubscriptionCard({
  existingStripeActive = false,
  appleActive = false,
  onStatusChange,
}) {
  const [state, setState] = useState(STATES.INITIALIZING);
  const [product, setProduct] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [showDiag, setShowDiag] = useState(false);
  const [diagText, setDiagText] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // One-shot init + product load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initAppleIap();
        if (cancelled || !mountedRef.current) return;
        setState(STATES.LOADING_PRODUCT);
        const p = await loadProduct();
        if (cancelled || !mountedRef.current) return;
        setProduct(p);
        setState(STATES.READY);
      } catch (e) {
        if (cancelled || !mountedRef.current) return;
        setLastError({ code: e?.code, message: e?.message });
        setState(STATES.PRODUCT_UNAVAILABLE);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handlePurchase = useCallback(async () => {
    if (state === STATES.PURCHASING || state === STATES.VERIFYING) return;
    setLastError(null);
    setState(STATES.PURCHASING);
    try {
      const result = await appleBuy();
      if (!mountedRef.current) return;
      // Between order and backend verify our internal flow is atomic — we
      // still expose an interim "verifying" UI in case the backend is slow
      // and the user triggers renders.
      setState(STATES.VERIFYING);
      // At this point appleBuy already awaited the backend; just reflect UX.
      setState(STATES.SUCCESS);
      toast.success('Pretplata aktivirana!');
      onStatusChange?.(result?.backend || { has_subscription: true });
    } catch (e) {
      if (!mountedRef.current) return;
      const code = e?.code;
      setLastError({ code, message: e?.message });
      if (code === 'USER_CANCELLED') {
        setState(STATES.READY);
        return; // cancel is not an error
      }
      if (code === 'PENDING') {
        setState(STATES.PENDING);
        toast.info('Kupnja čeka odobrenje.');
        return;
      }
      if (code === 'BACKEND_VERIFY_FAILED') {
        setState(STATES.VERIFICATION_FAILED);
        toast.error(e?.message || 'Provjera pretplate nije uspjela.');
        return;
      }
      if (code === 'PRODUCT_UNAVAILABLE') {
        setState(STATES.PRODUCT_UNAVAILABLE);
        return;
      }
      setState(STATES.READY);
      toast.error(e?.message || 'Kupnja nije uspjela.');
    }
  }, [state, onStatusChange]);

  const handleRestore = useCallback(async () => {
    if (state === STATES.RESTORING) return;
    setState(STATES.RESTORING);
    setLastError(null);
    try {
      const result = await appleRestore();
      if (!mountedRef.current) return;
      if (result?.restored) {
        setState(STATES.RESTORE_SUCCESS);
        toast.success('Pretplata vraćena!');
        onStatusChange?.({ has_subscription: true, status: result.subscription_status });
      } else {
        setState(STATES.RESTORE_EMPTY);
        toast.info('Nema pretplate za vraćanje.');
      }
    } catch (e) {
      if (!mountedRef.current) return;
      setLastError({ code: e?.code, message: e?.message });
      setState(STATES.RESTORE_FAILED);
      toast.error(e?.message || 'Vraćanje kupnje nije uspjelo.');
    }
  }, [state, onStatusChange]);

  const handleShowDiag = useCallback(() => {
    const logs = getIapLogs();
    const text = logs.length
      ? logs.map((l) => `${new Date(l.t).toLocaleTimeString()} ${l.line}${l.extra ? ' ' + JSON.stringify(l.extra) : ''}`).join('\n')
      : 'Nema zapisa.';
    setDiagText(text);
    setShowDiag(true);
  }, []);

  // ---- Existing Stripe user on iOS: show ONLY neutral message --------
  if (existingStripeActive) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center" data-testid="apple-subscription-stripe-active">
        <p className="text-sm text-blue-900 font-semibold mb-1">
          Pretplata aktivna preko web platforme.
        </p>
      </div>
    );
  }

  // ---- Active Apple subscription: show restore + management -----------
  if (appleActive) {
    return (
      <div className="space-y-4" data-testid="apple-subscription-active">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-700">Pretplatom upravljate kroz Apple račun.</p>
        </div>
        <button
          onClick={handleRestore}
          disabled={state === STATES.RESTORING}
          className="mp-btn-secondary w-full"
          data-testid="apple-restore-button"
        >
          {state === STATES.RESTORING ? (
            <><Loader2 className="w-5 h-5 animate-spin" />Učitavanje...</>
          ) : (
            <><RefreshCw className="w-5 h-5" />Obnovi kupnju</>
          )}
        </button>
      </div>
    );
  }

  // ---- Not-yet-purchased flow -----------------------------------------
  const priceLabel = product?.displayPrice;
  const isBusy = state === STATES.PURCHASING || state === STATES.VERIFYING;
  const isRestoring = state === STATES.RESTORING;

  return (
    <div className="text-center py-4" data-testid="apple-subscription-card">
      <p className="text-gray-500 text-sm mb-4" data-testid="apple-subscription-state">
        {state === STATES.INITIALIZING && 'Priprema pretplate...'}
        {state === STATES.LOADING_PRODUCT && 'Učitavanje proizvoda...'}
        {state === STATES.READY && (
          <>Aktivirajte mjesečnu pretplatu putem Apple računa.{priceLabel ? ` (${priceLabel} / mjesečno)` : ''}</>
        )}
        {state === STATES.PRODUCT_UNAVAILABLE && 'Apple pretplata trenutno nije dostupna. Pokušajte ponovno kasnije.'}
        {state === STATES.PURCHASING && 'Kupnja u tijeku...'}
        {state === STATES.PENDING && 'Kupnja čeka odobrenje.'}
        {state === STATES.VERIFYING && 'Provjera pretplate...'}
        {state === STATES.VERIFICATION_FAILED && 'Provjera pretplate nije uspjela. Pokušajte ponovno.'}
        {state === STATES.SUCCESS && 'Pretplata je aktivna.'}
        {state === STATES.RESTORING && 'Vraćanje kupnje...'}
        {state === STATES.RESTORE_SUCCESS && 'Pretplata vraćena.'}
        {state === STATES.RESTORE_EMPTY && 'Nema pretplate za vraćanje.'}
        {state === STATES.RESTORE_FAILED && 'Vraćanje kupnje nije uspjelo.'}
      </p>

      <div className="space-y-3">
        <button
          onClick={handlePurchase}
          disabled={
            isBusy ||
            state === STATES.INITIALIZING ||
            state === STATES.LOADING_PRODUCT ||
            state === STATES.PRODUCT_UNAVAILABLE
          }
          className="mp-btn-primary w-full"
          data-testid="apple-purchase-button"
        >
          {isBusy ? (
            <><Loader2 className="w-5 h-5 animate-spin" />Učitavanje...</>
          ) : (
            <><CreditCard className="w-5 h-5" />Aktiviraj pretplatu</>
          )}
        </button>
        <button
          onClick={handleRestore}
          disabled={isRestoring}
          className="mp-btn-secondary w-full"
          data-testid="apple-restore-button"
        >
          {isRestoring ? (
            <><Loader2 className="w-5 h-5 animate-spin" />Učitavanje...</>
          ) : (
            <><RefreshCw className="w-5 h-5" />Obnovi kupnju</>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-3">Pretplatom upravljate kroz Apple račun.</p>

      <button
        type="button"
        onClick={handleShowDiag}
        className="text-xs text-gray-400 underline mt-2"
        data-testid="apple-iap-diagnostics-button"
      >
        IAP dijagnostika
      </button>

      {showDiag && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          data-testid="apple-iap-diagnostics-modal"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">IAP dijagnostika</h3>
              <button onClick={() => setShowDiag(false)} className="p-1" aria-label="Zatvori">
                <X className="w-5 h-5" />
              </button>
            </div>
            <pre className="p-4 overflow-auto text-xs text-left whitespace-pre-wrap flex-1">
              {diagText}
            </pre>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard?.writeText(diagText);
                    toast.success('Zapisi kopirani.');
                  } catch (_e) { /* noop */ }
                }}
                className="mp-btn-secondary"
              >
                Kopiraj
              </button>
              <button
                type="button"
                onClick={() => setShowDiag(false)}
                className="mp-btn-primary"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export state constants for unit tests
AppleSubscriptionCard.STATES = STATES;
