/**
 * Unit tests for the rewritten Apple IAP service.
 * Mocks the custom Capacitor plugin so no native code is invoked.
 *
 * Mock state is stored on globalThis because jest.mock() factories run at
 * hoist time (before module locals are initialized), so we cannot reference
 * outer variables directly. Using globals keeps the wiring lint-clean.
 */

// eslint-disable-next-line no-underscore-dangle
globalThis.__iapMockState = globalThis.__iapMockState || {
  platform: 'web',
  isNative: false,
  plugin: {
    loadProduct: jest.fn(),
    purchase: jest.fn(),
    finishTransaction: jest.fn(),
    restore: jest.fn(),
    addListener: jest.fn(),
  },
  axios: { post: jest.fn() },
};

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    // eslint-disable-next-line no-underscore-dangle
    isNativePlatform: () => globalThis.__iapMockState.isNative,
    // eslint-disable-next-line no-underscore-dangle
    getPlatform: () => globalThis.__iapMockState.platform,
  },
  // eslint-disable-next-line no-underscore-dangle
  registerPlugin: () => globalThis.__iapMockState.plugin,
}));

jest.mock('axios', () => ({
  __esModule: true,
  // eslint-disable-next-line no-underscore-dangle
  default: globalThis.__iapMockState.axios,
}));

// eslint-disable-next-line import/first, no-underscore-dangle
const S = globalThis.__iapMockState;
// eslint-disable-next-line import/first
const svc = require('../appleIap');

function setIOS() { S.platform = 'ios'; S.isNative = true; }
function setWeb() { S.platform = 'web'; S.isNative = false; }
function setAndroid() { S.platform = 'android'; S.isNative = true; }

beforeEach(() => {
  svc.__test.reset();
  S.plugin.loadProduct.mockReset();
  S.plugin.purchase.mockReset();
  S.plugin.finishTransaction.mockReset();
  S.plugin.restore.mockReset();
  S.plugin.addListener.mockReset();
  S.plugin.addListener.mockResolvedValue({ remove: jest.fn() });
  S.axios.post.mockReset();
  setWeb();
});

describe('platform gate', () => {
  test('does not initialize on web', async () => {
    setWeb();
    await svc.initAppleIap();
    expect(S.plugin.loadProduct).not.toHaveBeenCalled();
  });

  test('does not initialize on Android', async () => {
    setAndroid();
    await svc.initAppleIap();
    expect(S.plugin.loadProduct).not.toHaveBeenCalled();
  });

  test('initializes only once on iOS', async () => {
    setIOS();
    const p1 = svc.initAppleIap();
    const p2 = svc.initAppleIap();
    expect(p1).toBe(p2);
    await Promise.all([p1, p2]);
  });

  test('purchase throws PLUGIN_MISSING on non-iOS', async () => {
    setWeb();
    await expect(svc.purchase()).rejects.toMatchObject({ code: 'PLUGIN_MISSING' });
  });

  test('restore is a no-op on non-iOS', async () => {
    setWeb();
    const r = await svc.restore();
    expect(r).toEqual({ restored: false, count: 0 });
    expect(S.plugin.restore).not.toHaveBeenCalled();
  });
});

describe('loadProduct', () => {
  test('rejects with PRODUCT_UNAVAILABLE when plugin errors', async () => {
    setIOS();
    S.plugin.loadProduct.mockRejectedValueOnce({ code: 'PRODUCT_UNAVAILABLE', message: 'x' });
    await expect(svc.loadProduct()).rejects.toMatchObject({ code: 'PRODUCT_UNAVAILABLE' });
  });

  test('returns product info on success', async () => {
    setIOS();
    S.plugin.loadProduct.mockResolvedValueOnce({
      productId: svc.PRODUCT_ID,
      displayName: 'Premium',
      displayPrice: '4,99 €',
    });
    const p = await svc.loadProduct();
    expect(p.productId).toBe(svc.PRODUCT_ID);
    expect(p.displayPrice).toBe('4,99 €');
  });
});

describe('purchase', () => {
  const validPurchase = {
    status: 'verified',
    productId: 'hr.solvix.fiksiraj.premium.monthly',
    transactionId: '2000000000001',
    originalTransactionId: '2000000000001',
    environment: 'Sandbox',
    jwsRepresentation: 'header.payload.signature',
  };
  const validProduct = {
    productId: 'hr.solvix.fiksiraj.premium.monthly',
    displayPrice: '4,99 €',
  };

  test('sends ONLY jwsRepresentation as signed_transaction', async () => {
    setIOS();
    S.plugin.loadProduct.mockResolvedValue(validProduct);
    S.plugin.purchase.mockResolvedValueOnce(validPurchase);
    S.axios.post.mockResolvedValueOnce({
      data: { verified: true, active: true, has_subscription: true, status: 'active' },
    });
    S.plugin.finishTransaction.mockResolvedValueOnce({ finished: true });

    await svc.purchase();

    expect(S.axios.post).toHaveBeenCalledTimes(1);
    const [url, body] = S.axios.post.mock.calls[0];
    expect(url).toMatch(/\/api\/apple-iap\/verify$/);
    expect(Object.keys(body)).toEqual(['signed_transaction']);
    expect(body.signed_transaction).toBe('header.payload.signature');
  });

  test('never sends transactionId or receipt as signed_transaction', async () => {
    setIOS();
    S.plugin.loadProduct.mockResolvedValue(validProduct);
    S.plugin.purchase.mockResolvedValueOnce(validPurchase);
    S.axios.post.mockResolvedValueOnce({ data: { verified: true, has_subscription: true } });
    S.plugin.finishTransaction.mockResolvedValueOnce({ finished: true });

    await svc.purchase();
    const [, body] = S.axios.post.mock.calls[0];
    expect(body.signed_transaction).not.toBe(validPurchase.transactionId);
    expect(body.signed_transaction).not.toBe(validPurchase.originalTransactionId);
    expect(body).not.toHaveProperty('appStoreReceipt');
    expect(body).not.toHaveProperty('transactionReceipt');
    expect(body).not.toHaveProperty('signed_renewal_info');
  });

  test('backend failure does NOT finish the transaction', async () => {
    setIOS();
    S.plugin.loadProduct.mockResolvedValue(validProduct);
    S.plugin.purchase.mockResolvedValueOnce(validPurchase);
    S.axios.post.mockRejectedValueOnce({ response: { status: 400, data: { detail: 'x' } } });

    await expect(svc.purchase()).rejects.toMatchObject({ code: 'BACKEND_VERIFY_FAILED' });
    expect(S.plugin.finishTransaction).not.toHaveBeenCalled();
  });

  test('backend success calls finishTransaction exactly once', async () => {
    setIOS();
    S.plugin.loadProduct.mockResolvedValue(validProduct);
    S.plugin.purchase.mockResolvedValueOnce(validPurchase);
    S.axios.post.mockResolvedValueOnce({ data: { has_subscription: true } });
    S.plugin.finishTransaction.mockResolvedValueOnce({ finished: true });

    await svc.purchase();
    expect(S.plugin.finishTransaction).toHaveBeenCalledTimes(1);
    expect(S.plugin.finishTransaction).toHaveBeenCalledWith({ transactionId: '2000000000001' });
  });

  test('duplicate purchase() calls are rejected while one is in flight', async () => {
    setIOS();
    S.plugin.loadProduct.mockResolvedValue(validProduct);
    S.plugin.purchase.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve(validPurchase), 30))
    );
    S.axios.post.mockResolvedValue({ data: { has_subscription: true } });
    S.plugin.finishTransaction.mockResolvedValue({ finished: true });

    const p1 = svc.purchase();
    await expect(svc.purchase()).rejects.toMatchObject({ code: 'PURCHASE_IN_FLIGHT' });
    await p1;
  });

  test('user cancellation surfaces as USER_CANCELLED (not a failure)', async () => {
    setIOS();
    S.plugin.loadProduct.mockResolvedValue(validProduct);
    S.plugin.purchase.mockRejectedValueOnce({ code: 'USER_CANCELLED', message: 'cancelled' });
    await expect(svc.purchase()).rejects.toMatchObject({ code: 'USER_CANCELLED' });
  });

  test('pending transactions surface as PENDING', async () => {
    setIOS();
    S.plugin.loadProduct.mockResolvedValue(validProduct);
    S.plugin.purchase.mockResolvedValueOnce({ status: 'pending' });
    await expect(svc.purchase()).rejects.toMatchObject({ code: 'PENDING' });
  });
});

describe('restore', () => {
  test('empty entitlements returns clean empty result', async () => {
    setIOS();
    S.plugin.restore.mockResolvedValueOnce({ entitlements: [] });
    const r = await svc.restore();
    expect(r).toEqual({ restored: false, count: 0, subscription_status: null });
    expect(S.axios.post).not.toHaveBeenCalled();
    expect(S.plugin.finishTransaction).not.toHaveBeenCalled();
  });

  test('sends every genuine JWS to backend and finishes only verified ones', async () => {
    setIOS();
    S.plugin.restore.mockResolvedValueOnce({
      entitlements: [
        { verified: true, jwsRepresentation: 'jws1', transactionId: '1' },
        { verified: true, jwsRepresentation: 'jws2', transactionId: '2' },
      ],
    });
    S.axios.post
      .mockResolvedValueOnce({ data: { has_subscription: true, status: 'active' } })
      .mockRejectedValueOnce({ response: { status: 400 } });
    S.plugin.finishTransaction.mockResolvedValueOnce({ finished: true });

    const r = await svc.restore();
    expect(r.count).toBe(1);
    expect(S.axios.post).toHaveBeenCalledTimes(2);
    expect(S.axios.post.mock.calls[0][1]).toEqual({ signed_transaction: 'jws1' });
    expect(S.axios.post.mock.calls[1][1]).toEqual({ signed_transaction: 'jws2' });
    expect(S.plugin.finishTransaction).toHaveBeenCalledTimes(1);
    expect(S.plugin.finishTransaction).toHaveBeenCalledWith({ transactionId: '1' });
  });

  test('skips unverified entitlements', async () => {
    setIOS();
    S.plugin.restore.mockResolvedValueOnce({
      entitlements: [{ verified: false, jwsRepresentation: 'x', transactionId: '9' }],
    });
    const r = await svc.restore();
    expect(r).toEqual({ restored: false, count: 0, subscription_status: null });
    expect(S.axios.post).not.toHaveBeenCalled();
  });
});

describe('logs', () => {
  test('never contain a full JWS string', async () => {
    setIOS();
    S.plugin.loadProduct.mockResolvedValue({ productId: svc.PRODUCT_ID, displayPrice: '' });
    S.plugin.purchase.mockResolvedValueOnce({
      status: 'verified',
      productId: svc.PRODUCT_ID,
      transactionId: 't1',
      originalTransactionId: 't1',
      jwsRepresentation: 'AAA.BBB.CCC-secret',
    });
    S.axios.post.mockResolvedValueOnce({ data: { has_subscription: true } });
    S.plugin.finishTransaction.mockResolvedValueOnce({ finished: true });
    await svc.purchase();

    const asText = JSON.stringify(svc.getIapLogs());
    expect(asText).not.toContain('AAA.BBB.CCC-secret');
  });
});

describe('transactionUpdate listener', () => {
  const VALID_EVENT = Object.freeze({
    verified: true,
    productId: 'hr.solvix.fiksiraj.premium.monthly',
    transactionId: '3000000000001',
    originalTransactionId: '3000000000001',
    jwsRepresentation: 'listener.jws.value',
  });

  test('registers exactly once even across many init calls', async () => {
    setIOS();
    // Fire many concurrent inits — the second and later calls must return
    // the same cached promise and MUST NOT re-register.
    await Promise.all([
      svc.initAppleIap(),
      svc.initAppleIap(),
      svc.initAppleIap(),
      svc.initAppleIap(),
    ]);
    await svc.initAppleIap();
    expect(S.plugin.addListener).toHaveBeenCalledTimes(1);
    expect(S.plugin.addListener).toHaveBeenCalledWith('transactionUpdate', expect.any(Function));
    expect(svc.__test.hasListener()).toBe(true);
  });

  test('unverified update is ignored', async () => {
    setIOS();
    await svc.initAppleIap();
    await svc.__test.handleTransactionUpdate({
      verified: false,
      productId: svc.PRODUCT_ID,
      transactionId: 'u1',
      jwsRepresentation: 'x',
      errorMessage: 'invalidSignature',
    });
    expect(S.axios.post).not.toHaveBeenCalled();
    expect(S.plugin.finishTransaction).not.toHaveBeenCalled();
  });

  test('wrong product is ignored', async () => {
    setIOS();
    await svc.initAppleIap();
    await svc.__test.handleTransactionUpdate({
      ...VALID_EVENT,
      productId: 'com.other.product',
    });
    expect(S.axios.post).not.toHaveBeenCalled();
    expect(S.plugin.finishTransaction).not.toHaveBeenCalled();
  });

  test('missing JWS is ignored', async () => {
    setIOS();
    await svc.initAppleIap();
    await svc.__test.handleTransactionUpdate({
      ...VALID_EVENT,
      jwsRepresentation: '',
    });
    expect(S.axios.post).not.toHaveBeenCalled();
    expect(S.plugin.finishTransaction).not.toHaveBeenCalled();
  });

  test('missing transactionId is ignored', async () => {
    setIOS();
    await svc.initAppleIap();
    await svc.__test.handleTransactionUpdate({
      ...VALID_EVENT,
      transactionId: '',
    });
    expect(S.axios.post).not.toHaveBeenCalled();
    expect(S.plugin.finishTransaction).not.toHaveBeenCalled();
  });

  test('valid update posts jwsRepresentation as signed_transaction', async () => {
    setIOS();
    await svc.initAppleIap();
    S.axios.post.mockResolvedValueOnce({ data: { has_subscription: true, status: 'active' } });
    S.plugin.finishTransaction.mockResolvedValueOnce({ finished: true });

    await svc.__test.handleTransactionUpdate({ ...VALID_EVENT });

    expect(S.axios.post).toHaveBeenCalledTimes(1);
    const [url, body] = S.axios.post.mock.calls[0];
    expect(url).toMatch(/\/api\/apple-iap\/verify$/);
    expect(Object.keys(body)).toEqual(['signed_transaction']);
    expect(body.signed_transaction).toBe('listener.jws.value');
  });

  test('backend failure does NOT finish and does NOT throw', async () => {
    setIOS();
    await svc.initAppleIap();
    S.axios.post.mockRejectedValueOnce({ response: { status: 500 } });
    // Must not throw.
    await expect(
      svc.__test.handleTransactionUpdate({ ...VALID_EVENT })
    ).resolves.toBeUndefined();
    expect(S.plugin.finishTransaction).not.toHaveBeenCalled();
    // Because we did not finish, the txId must NOT be marked completed
    // (i.e. StoreKit redelivery / restore can still retry it).
    expect(svc.__test.completedSize()).toBe(0);
    expect(svc.__test.processingSize()).toBe(0);
  });

  test('backend success finishes exactly once', async () => {
    setIOS();
    await svc.initAppleIap();
    S.axios.post.mockResolvedValueOnce({ data: { has_subscription: true } });
    S.plugin.finishTransaction.mockResolvedValueOnce({ finished: true });

    await svc.__test.handleTransactionUpdate({ ...VALID_EVENT });

    expect(S.plugin.finishTransaction).toHaveBeenCalledTimes(1);
    expect(S.plugin.finishTransaction).toHaveBeenCalledWith({
      transactionId: '3000000000001',
    });
    expect(svc.__test.completedSize()).toBe(1);
  });

  test('duplicate transactionUpdate events for the same txId process only once', async () => {
    setIOS();
    await svc.initAppleIap();
    S.axios.post.mockResolvedValueOnce({ data: { has_subscription: true } });
    S.plugin.finishTransaction.mockResolvedValueOnce({ finished: true });

    // Sequential duplicates (first completes -> second sees completed set).
    await svc.__test.handleTransactionUpdate({ ...VALID_EVENT });
    await svc.__test.handleTransactionUpdate({ ...VALID_EVENT });
    await svc.__test.handleTransactionUpdate({ ...VALID_EVENT });

    expect(S.axios.post).toHaveBeenCalledTimes(1);
    expect(S.plugin.finishTransaction).toHaveBeenCalledTimes(1);
  });

  test('concurrent updates for the same txId collapse via in-flight guard', async () => {
    setIOS();
    await svc.initAppleIap();
    // Backend takes 30 ms — a second event fires while the first is in flight.
    S.axios.post.mockImplementationOnce(
      () => new Promise((resolve) =>
        setTimeout(() => resolve({ data: { has_subscription: true } }), 30)
      )
    );
    S.plugin.finishTransaction.mockResolvedValueOnce({ finished: true });

    const a = svc.__test.handleTransactionUpdate({ ...VALID_EVENT });
    const b = svc.__test.handleTransactionUpdate({ ...VALID_EVENT });
    await Promise.all([a, b]);

    expect(S.axios.post).toHaveBeenCalledTimes(1);
    expect(S.plugin.finishTransaction).toHaveBeenCalledTimes(1);
  });

  test('listener errors never propagate to the caller', async () => {
    setIOS();
    await svc.initAppleIap();
    // A malformed event object with a getter that throws — reading it
    // could crash a naive handler. We must still resolve, not reject.
    const bomb = {};
    Object.defineProperty(bomb, 'verified', {
      get() { throw new Error('boom'); },
    });
    await expect(svc.__test.handleTransactionUpdate(bomb)).resolves.toBeUndefined();
    expect(S.axios.post).not.toHaveBeenCalled();
    expect(S.plugin.finishTransaction).not.toHaveBeenCalled();
  });

  test('purchase() and listener race for the same txId finishes only once', async () => {
    setIOS();
    S.plugin.loadProduct.mockResolvedValue({
      productId: svc.PRODUCT_ID,
      displayPrice: '4,99 €',
    });
    // Same transactionId returned by both the purchase() call and the
    // transactionUpdate event — the shared dedup set must prevent a
    // double verify + double finish.
    const sharedTx = {
      status: 'verified',
      productId: svc.PRODUCT_ID,
      transactionId: '4000000000001',
      originalTransactionId: '4000000000001',
      jwsRepresentation: 'shared.jws',
    };
    S.plugin.purchase.mockResolvedValueOnce(sharedTx);
    S.axios.post.mockResolvedValueOnce({ data: { has_subscription: true, status: 'active' } });
    S.plugin.finishTransaction.mockResolvedValue({ finished: true });

    // Kick off purchase(); before it awaits the backend, dispatch the
    // duplicate listener event.
    const purchasePromise = svc.purchase();
    await Promise.resolve(); // yield
    await svc.__test.handleTransactionUpdate({
      verified: true,
      productId: svc.PRODUCT_ID,
      transactionId: '4000000000001',
      jwsRepresentation: 'shared.jws',
    });
    await purchasePromise;

    // Exactly one backend verify and one finish across both sources.
    expect(S.axios.post).toHaveBeenCalledTimes(1);
    expect(S.plugin.finishTransaction).toHaveBeenCalledTimes(1);
  });
});
