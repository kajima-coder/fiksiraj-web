/**
 * Apple In-App Purchase service (Fiksiraj, iOS-only).
 *
 * Contract with the backend (deployed on Railway):
 *
 *   POST /api/apple-iap/verify
 *   Authorization: Bearer <JWT>
 *   Body: { "signed_transaction": "<StoreKit 2 JWS>" }
 *
 * The value sent as `signed_transaction` is ALWAYS the genuine
 *   VerificationResult<Transaction>.jwsRepresentation
 * produced by our custom Swift Capacitor plugin `FiksirajIAP`.
 *
 * NEVER send: transactionId, originalTransactionId, Transaction.jsonRepresentation,
 * appStoreReceipt, transactionReceipt, base64 receipts, decoded JSON, or any
 * reconstructed value. The old cordova-plugin-purchase code path has been
 * removed entirely.
 *
 * Transaction sources:
 *  - purchase()               — user tapped "Aktiviraj pretplatu"
 *  - restore()                — user tapped "Obnovi kupnju"
 *  - transactionUpdate event  — StoreKit renewals, external state changes,
 *                               previously-unfinished transactions redelivered
 *                               on next app launch
 *
 * All three paths funnel into `_processVerifiedTransaction()` which enforces
 * a single-flight guarantee per transactionId and finishes ONLY after the
 * backend accepts the JWS.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';
import axios from 'axios';

// Product must match backend PRODUCT_ID exactly.
export const PRODUCT_ID = 'hr.solvix.fiksiraj.premium.monthly';

// ---------------- Platform gate ---------------------------------------

export const isIOSPlatform = () =>
  typeof window !== 'undefined'
    && Capacitor?.isNativePlatform?.() === true
    && Capacitor?.getPlatform?.() === 'ios';

// ---------------- Native plugin bridge --------------------------------
//
// registerPlugin returns a JS proxy. On non-iOS the proxy still resolves
// on `getPlatform()` — but we NEVER invoke a native method unless
// `isIOSPlatform()` is true, so on web / Android the plugin is dormant.
const FiksirajIAP = registerPlugin('FiksirajIAP');

// ---------------- Diagnostic log ring buffer --------------------------

const _logs = [];
const MAX_LOGS = 200;

function log(line, extra) {
  const entry = { t: Date.now(), line, extra: extra || null };
  _logs.push(entry);
  if (_logs.length > MAX_LOGS) _logs.shift();
  try { console.log(`[IAP] ${line}`, extra || ''); } catch (_e) { /* noop */ }
}

export function getIapLogs() {
  // Return a shallow copy so callers cannot mutate our buffer.
  return _logs.slice();
}

// Redact any accidentally-forwarded sensitive value before it reaches the
// log buffer. We keep just an "isPresent" flag for JWS + error codes.
function sanitizeForLog(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = { ...obj };
  if ('jwsRepresentation' in out) out.jwsRepresentation = out.jwsRepresentation ? '<present>' : '<absent>';
  if ('signed_transaction' in out) out.signed_transaction = '<redacted>';
  if ('Authorization' in out) out.Authorization = '<redacted>';
  return out;
}

// ---------------- Service state ---------------------------------------

let _initPromise = null;
let _cachedProduct = null;
let _purchaseInFlight = false;
let _restoreInFlight = false;

// Single native listener handle. Registered exactly once for the app
// lifecycle by initAppleIap(). React components MUST NOT register their
// own transactionUpdate listener.
let _pluginListenerHandle = null;

// Dedup sets shared by purchase(), restore(), and the transactionUpdate
// listener so all three sources cannot double-verify or double-finish the
// same transactionId.
const _processingTxIds = new Set();
const _completedTxIds = new Set();
const COMPLETED_TX_CAP = 200;

function _markCompleted(transactionId) {
  _completedTxIds.add(transactionId);
  // Bound the completed set so long-lived sessions never leak memory.
  if (_completedTxIds.size > COMPLETED_TX_CAP) {
    const first = _completedTxIds.values().next().value;
    _completedTxIds.delete(first);
  }
}

// API root used by backend calls. The Vercel-hosted frontend passes
// REACT_APP_BACKEND_URL at build time.
const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

// ---------------- Shared verify + finish helper -----------------------
//
// Every verified StoreKit transaction — from purchase(), restore(), or a
// transactionUpdate event — flows through this function. It:
//   1. Rejects invalid inputs (never posts).
//   2. Skips txIds already in-flight or completed (idempotent).
//   3. Sends ONLY jwsRepresentation to /api/apple-iap/verify.
//   4. Calls finishTransaction ONLY on backend success.
//   5. On backend failure leaves the transaction unfinished so StoreKit
//      redelivers via Transaction.updates.
//
// Return shape:
//   { ok: true, data }                    backend accepted + finish attempted
//   { ok: false, reason, error? }         see reason codes below
//
async function _processVerifiedTransaction({ transactionId, jwsRepresentation, productId, source }) {
  if (!transactionId || !jwsRepresentation) {
    log('Transaction ignored: missing fields', {
      source,
      hasTransactionId: !!transactionId,
      hasJws: !!jwsRepresentation,
    });
    return { ok: false, reason: 'INVALID_INPUT' };
  }
  if (productId && productId !== PRODUCT_ID) {
    log('Transaction ignored: wrong product', { source, productId });
    return { ok: false, reason: 'WRONG_PRODUCT' };
  }
  if (_completedTxIds.has(transactionId)) {
    log('Transaction ignored: already completed', { source, transactionId });
    return { ok: false, reason: 'ALREADY_COMPLETED' };
  }
  if (_processingTxIds.has(transactionId)) {
    log('Transaction ignored: in-flight', { source, transactionId });
    return { ok: false, reason: 'IN_FLIGHT' };
  }

  _processingTxIds.add(transactionId);
  try {
    log('Backend verification started', { source, transactionId });
    let data;
    try {
      const r = await axios.post(`${API}/apple-iap/verify`, {
        signed_transaction: jwsRepresentation,
      });
      data = r.data;
    } catch (e) {
      log('Backend verification failed', { source, status: e?.response?.status });
      // IMPORTANT: do NOT finish. Leave for StoreKit redelivery / manual restore.
      return { ok: false, reason: 'BACKEND_VERIFY_FAILED', error: e };
    }
    log('Backend verification succeeded', {
      source,
      status: data?.status,
      active: data?.active,
      has_subscription: data?.has_subscription,
    });

    // Finish only after backend accepts.
    try {
      await FiksirajIAP.finishTransaction({ transactionId });
      log('Transaction finished', { source, transactionId });
    } catch (fe) {
      // Non-fatal — backend already trusts the JWS. finishTransaction is
      // idempotent on the native side so a stray failure is safe to log.
      log('Transaction finish error (non-fatal)', { source, message: fe?.message });
    }
    _markCompleted(transactionId);
    return { ok: true, data };
  } finally {
    _processingTxIds.delete(transactionId);
  }
}

// ---------------- transactionUpdate listener --------------------------
//
// Registered exactly once per native iOS app lifecycle by initAppleIap().
// Fires whenever StoreKit re-emits a transaction (renewals, external
// changes, previously-unfinished transactions on next launch, etc.).
async function _handleTransactionUpdate(event) {
  try {
    if (!event || event.verified !== true) {
      log('transactionUpdate ignored: unverified', sanitizeForLog({
        verified: event?.verified,
        errorMessage: event?.errorMessage,
      }));
      return;
    }
    if (event.productId !== PRODUCT_ID) {
      log('transactionUpdate ignored: wrong product', { productId: event.productId });
      return;
    }
    if (!event.transactionId || !event.jwsRepresentation) {
      log('transactionUpdate ignored: missing fields', sanitizeForLog({
        hasTransactionId: !!event.transactionId,
        jwsRepresentation: event.jwsRepresentation,
      }));
      return;
    }
    await _processVerifiedTransaction({
      transactionId: event.transactionId,
      jwsRepresentation: event.jwsRepresentation,
      productId: event.productId,
      source: 'listener',
    });
  } catch (e) {
    // Never let a listener error propagate back into StoreKit / React.
    log('transactionUpdate handler error', { message: e?.message });
  }
}

// ---------------- Public API ------------------------------------------

/**
 * Initialize the IAP service. Idempotent — the second call returns the
 * same promise as the first. On non-iOS the promise resolves to null
 * without ever touching StoreKit.
 *
 * Registers the singleton transactionUpdate listener EXACTLY ONCE per
 * app lifecycle. Duplicate calls (e.g. React StrictMode double-mount)
 * are no-ops because `_pluginListenerHandle` is guarded.
 */
export function initAppleIap() {
  if (!isIOSPlatform()) {
    log('Non-iOS platform — StoreKit init skipped');
    return Promise.resolve(null);
  }
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    log('Native iOS platform confirmed');
    log('Custom StoreKit 2 plugin available');
    log('Initializing StoreKit');
    if (_pluginListenerHandle === null) {
      try {
        // Assign SYNCHRONOUSLY (before awaiting the returned promise)
        // so a concurrent second init call cannot race and register a
        // second listener.
        _pluginListenerHandle = FiksirajIAP.addListener(
          'transactionUpdate',
          _handleTransactionUpdate,
        );
        // Capacitor 6 returns a promise; await it so subsequent removal
        // works. Non-thenable returns (older shims) are harmless here.
        if (_pluginListenerHandle && typeof _pluginListenerHandle.then === 'function') {
          _pluginListenerHandle = await _pluginListenerHandle;
        }
        log('transactionUpdate listener registered');
      } catch (e) {
        log('transactionUpdate listener registration failed', { message: e?.message });
        _pluginListenerHandle = null;
      }
    }
    return true;
  })();

  return _initPromise;
}

/**
 * Load the subscription product. On success returns a UI-friendly
 * product object. Rejects with a typed error if the product cannot
 * be loaded (e.g. App Store Connect not configured, no network).
 *
 * On non-iOS returns null.
 */
export async function loadProduct({ force = false } = {}) {
  if (!isIOSPlatform()) return null;
  await initAppleIap();
  if (_cachedProduct && !force) return _cachedProduct;
  log('Loading product');
  try {
    const product = await FiksirajIAP.loadProduct({ productId: PRODUCT_ID });
    if (!product || product.productId !== PRODUCT_ID) {
      log('Product unavailable', { returned: product?.productId || null });
      const err = new Error('Apple pretplata trenutno nije dostupna.');
      err.code = 'PRODUCT_UNAVAILABLE';
      throw err;
    }
    _cachedProduct = product;
    log('Product loaded', { productId: product.productId, price: product.displayPrice });
    return _cachedProduct;
  } catch (e) {
    if (e?.code === 'PRODUCT_UNAVAILABLE') throw e;
    log('Product unavailable', { error: e?.message });
    const err = new Error('Apple pretplata trenutno nije dostupna.');
    err.code = 'PRODUCT_UNAVAILABLE';
    err.cause = e;
    throw err;
  }
}

/**
 * Start a purchase for PRODUCT_ID.
 *
 * Return shape on success:
 *   { verified: true, transactionId, subscription_status, backend: <verify response> }
 *
 * Errors are typed via `error.code`:
 *   USER_CANCELLED       — user tapped Cancel in the Apple sheet
 *   PRODUCT_UNAVAILABLE  — cannot obtain the product
 *   PLUGIN_MISSING       — running on a platform that lacks the native plugin
 *   PENDING              — Apple returned .pending (Ask To Buy etc.)
 *   BACKEND_VERIFY_FAILED— our backend rejected the JWS
 *   PURCHASE_FAILED      — anything else, .cause holds the raw StoreKit error
 */
export async function purchase() {
  if (!isIOSPlatform()) {
    const err = new Error('Apple pretplata je dostupna samo u iOS aplikaciji.');
    err.code = 'PLUGIN_MISSING';
    throw err;
  }
  if (_purchaseInFlight) {
    const err = new Error('Kupnja je već u tijeku.');
    err.code = 'PURCHASE_IN_FLIGHT';
    throw err;
  }
  _purchaseInFlight = true;
  try {
    await initAppleIap();
    // Ensure product is loaded; propagates PRODUCT_UNAVAILABLE.
    await loadProduct();

    log('Starting purchase', { productId: PRODUCT_ID });

    let result;
    try {
      result = await FiksirajIAP.purchase({ productId: PRODUCT_ID });
    } catch (e) {
      const code = e?.code;
      if (code === 'USER_CANCELLED') {
        log('Purchase cancelled');
        const err = new Error('cancelled');
        err.code = 'USER_CANCELLED';
        throw err;
      }
      log('Error code', { code });
      log('Error message', { message: e?.message });
      const err = new Error(e?.message || 'Kupnja nije uspjela.');
      err.code = code || 'PURCHASE_FAILED';
      err.cause = e;
      throw err;
    }

    if (result?.status === 'pending') {
      log('Purchase pending');
      const err = new Error('Kupnja čeka odobrenje.');
      err.code = 'PENDING';
      throw err;
    }
    if (result?.status !== 'verified' || !result?.jwsRepresentation) {
      log('Purchase result missing JWS', sanitizeForLog(result));
      const err = new Error('Nedostaje ovjerena Apple transakcija.');
      err.code = 'PURCHASE_FAILED';
      throw err;
    }

    log('Verified StoreKit transaction received', {
      transactionId: result.transactionId,
      environment: result.environment,
    });
    log('Signed transaction JWS available');

    // Shared verify+finish path — dedup with the transactionUpdate
    // listener so a race can only run one verify per transactionId.
    const outcome = await _processVerifiedTransaction({
      transactionId: result.transactionId,
      jwsRepresentation: result.jwsRepresentation,
      productId: result.productId,
      source: 'purchase',
    });

    if (!outcome.ok) {
      if (outcome.reason === 'BACKEND_VERIFY_FAILED') {
        const err = new Error(
          outcome.error?.response?.data?.detail || 'Provjera pretplate nije uspjela.',
        );
        err.code = 'BACKEND_VERIFY_FAILED';
        err.cause = outcome.error;
        err.transactionId = result.transactionId;
        throw err;
      }
      if (outcome.reason === 'ALREADY_COMPLETED' || outcome.reason === 'IN_FLIGHT') {
        // The transactionUpdate listener beat us to it. Report success —
        // the entitlement is already recorded on the backend.
        return {
          verified: true,
          transactionId: result.transactionId,
          subscription_status: 'active',
          backend: { has_subscription: true, status: 'active', deduplicated: true },
        };
      }
      const err = new Error('Kupnja nije uspjela.');
      err.code = 'PURCHASE_FAILED';
      throw err;
    }

    return {
      verified: true,
      transactionId: result.transactionId,
      subscription_status: outcome.data?.has_subscription ? 'active' : outcome.data?.status,
      backend: outcome.data,
    };
  } finally {
    _purchaseInFlight = false;
  }
}

/**
 * Restore purchases. Iterates current entitlements returned by the
 * native plugin, sends every genuine JWS to the backend (via the shared
 * dedup helper), and finishes only entitlements the backend accepts.
 *
 * Return shape:
 *   { restored: boolean, count: number, subscription_status: string|null }
 *
 * On non-iOS returns { restored: false, count: 0 } without side-effects.
 */
export async function restore() {
  if (!isIOSPlatform()) return { restored: false, count: 0 };
  if (_restoreInFlight) {
    const err = new Error('Vraćanje kupnje je već u tijeku.');
    err.code = 'RESTORE_IN_FLIGHT';
    throw err;
  }
  _restoreInFlight = true;
  try {
    await initAppleIap();
    log('Restore started');
    const { entitlements = [] } = await FiksirajIAP.restore();
    log('AppStore sync completed');
    log('Current entitlements loaded', { count: entitlements.length });

    if (entitlements.length === 0) {
      log('Restore completed', { restored: false });
      return { restored: false, count: 0, subscription_status: null };
    }

    let lastBackendStatus = null;
    let successCount = 0;
    for (const ent of entitlements) {
      if (!ent?.jwsRepresentation || !ent?.verified) continue;
      const outcome = await _processVerifiedTransaction({
        transactionId: ent.transactionId,
        jwsRepresentation: ent.jwsRepresentation,
        productId: ent.productId,
        source: 'restore',
      });
      if (outcome.ok) {
        lastBackendStatus = outcome.data?.has_subscription ? 'active' : outcome.data?.status;
        successCount += 1;
      } else if (outcome.reason === 'ALREADY_COMPLETED') {
        // Listener already handled this txId in this session — still
        // counts as restored from the UX perspective.
        lastBackendStatus = lastBackendStatus || 'active';
        successCount += 1;
      }
      // BACKEND_VERIFY_FAILED / IN_FLIGHT / INVALID_INPUT → skip this
      // entitlement; do NOT finish; leave for next restore.
    }
    log('Restore completed', { restored: successCount > 0, count: successCount });
    return {
      restored: successCount > 0,
      count: successCount,
      subscription_status: lastBackendStatus,
    };
  } finally {
    _restoreInFlight = false;
  }
}

// ---- Internal: only for tests. Not part of the public contract. ------
export const __test = {
  reset() {
    _initPromise = null;
    _cachedProduct = null;
    _purchaseInFlight = false;
    _restoreInFlight = false;
    _pluginListenerHandle = null;
    _processingTxIds.clear();
    _completedTxIds.clear();
    _logs.length = 0;
  },
  // Exposed so the listener test can invoke the handler directly with
  // controlled payloads without going through the native bridge.
  handleTransactionUpdate: _handleTransactionUpdate,
  hasListener() { return _pluginListenerHandle !== null; },
  processingSize() { return _processingTxIds.size; },
  completedSize() { return _completedTxIds.size; },
};
