/**
 * Unit tests for AppleSubscriptionCard.
 * The component depends on lib/appleIap — we mock that module entirely so
 * we exercise the state machine without going near Capacitor or the backend.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

// The service mock is created inside the factory so it doesn't get
// captured before jest hoists jest.mock() to the top of the module.
jest.mock('../../lib/appleIap', () => {
  return {
    PRODUCT_ID: 'hr.solvix.fiksiraj.premium.monthly',
    initAppleIap: jest.fn(),
    loadProduct: jest.fn(),
    purchase: jest.fn(),
    restore: jest.fn(),
    getIapLogs: jest.fn(() => []),
  };
});

// eslint-disable-next-line import/first, import/order
import * as mockSvc from '../../lib/appleIap';
// eslint-disable-next-line import/first
import AppleSubscriptionCard from '../AppleSubscriptionCard';

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AppleSubscriptionCard', () => {
  test('renders initializing then transitions to ready with price', async () => {
    mockSvc.initAppleIap.mockResolvedValueOnce(true);
    mockSvc.loadProduct.mockResolvedValueOnce({
      productId: mockSvc.PRODUCT_ID,
      displayPrice: '4,99 €',
    });
    render(<AppleSubscriptionCard />);
    expect(screen.getByTestId('apple-subscription-state')).toHaveTextContent(/Priprema/);
    await waitFor(() =>
      expect(screen.getByTestId('apple-subscription-state')).toHaveTextContent(/4,99 €/)
    );
  });

  test('shows PRODUCT_UNAVAILABLE state when loadProduct fails', async () => {
    mockSvc.initAppleIap.mockResolvedValueOnce(true);
    mockSvc.loadProduct.mockRejectedValueOnce({ code: 'PRODUCT_UNAVAILABLE' });
    render(<AppleSubscriptionCard />);
    await waitFor(() =>
      expect(screen.getByTestId('apple-subscription-state')).toHaveTextContent(/nije dostupna/)
    );
    expect(screen.getByTestId('apple-purchase-button')).toBeDisabled();
  });

  test('purchase success → SUCCESS state + onStatusChange fired', async () => {
    mockSvc.initAppleIap.mockResolvedValueOnce(true);
    mockSvc.loadProduct.mockResolvedValueOnce({
      productId: mockSvc.PRODUCT_ID,
      displayPrice: '4,99 €',
    });
    const backend = { has_subscription: true, status: 'active' };
    mockSvc.purchase.mockResolvedValueOnce({ verified: true, backend });
    const onStatusChange = jest.fn();

    render(<AppleSubscriptionCard onStatusChange={onStatusChange} />);
    await waitFor(() => expect(screen.getByTestId('apple-purchase-button')).not.toBeDisabled());

    await act(async () => {
      fireEvent.click(screen.getByTestId('apple-purchase-button'));
      await flushMicrotasks();
    });

    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith(backend));
    expect(screen.getByTestId('apple-subscription-state')).toHaveTextContent(/aktivna/);
  });

  test('USER_CANCELLED returns to READY without error UI', async () => {
    mockSvc.initAppleIap.mockResolvedValueOnce(true);
    mockSvc.loadProduct.mockResolvedValueOnce({
      productId: mockSvc.PRODUCT_ID,
      displayPrice: '',
    });
    mockSvc.purchase.mockRejectedValueOnce(
      Object.assign(new Error('cancelled'), { code: 'USER_CANCELLED' })
    );
    render(<AppleSubscriptionCard />);
    await waitFor(() => expect(screen.getByTestId('apple-purchase-button')).not.toBeDisabled());
    await act(async () => {
      fireEvent.click(screen.getByTestId('apple-purchase-button'));
      await flushMicrotasks();
    });
    await waitFor(() =>
      expect(screen.getByTestId('apple-subscription-state')).toHaveTextContent(/Aktivirajte/)
    );
  });

  test('BACKEND_VERIFY_FAILED → VERIFICATION_FAILED state', async () => {
    mockSvc.initAppleIap.mockResolvedValueOnce(true);
    mockSvc.loadProduct.mockResolvedValueOnce({
      productId: mockSvc.PRODUCT_ID,
      displayPrice: '',
    });
    mockSvc.purchase.mockRejectedValueOnce(
      Object.assign(new Error('Provjera pretplate nije uspjela.'), {
        code: 'BACKEND_VERIFY_FAILED',
      })
    );
    render(<AppleSubscriptionCard />);
    await waitFor(() => expect(screen.getByTestId('apple-purchase-button')).not.toBeDisabled());
    await act(async () => {
      fireEvent.click(screen.getByTestId('apple-purchase-button'));
      await flushMicrotasks();
    });
    await waitFor(() =>
      expect(screen.getByTestId('apple-subscription-state')).toHaveTextContent(
        /Provjera pretplate nije uspjela/
      )
    );
  });

  test('restore empty → RESTORE_EMPTY', async () => {
    mockSvc.initAppleIap.mockResolvedValueOnce(true);
    mockSvc.loadProduct.mockResolvedValueOnce({
      productId: mockSvc.PRODUCT_ID,
      displayPrice: '',
    });
    mockSvc.restore.mockResolvedValueOnce({ restored: false, count: 0 });
    render(<AppleSubscriptionCard />);
    await waitFor(() => expect(screen.getByTestId('apple-restore-button')).not.toBeDisabled());
    await act(async () => {
      fireEvent.click(screen.getByTestId('apple-restore-button'));
      await flushMicrotasks();
    });
    await waitFor(() =>
      expect(screen.getByTestId('apple-subscription-state')).toHaveTextContent(/Nema pretplate/)
    );
  });

  test('restore success → RESTORE_SUCCESS + onStatusChange fired', async () => {
    mockSvc.initAppleIap.mockResolvedValueOnce(true);
    mockSvc.loadProduct.mockResolvedValueOnce({
      productId: mockSvc.PRODUCT_ID,
      displayPrice: '',
    });
    mockSvc.restore.mockResolvedValueOnce({
      restored: true,
      count: 1,
      subscription_status: 'active',
    });
    const onStatusChange = jest.fn();

    render(<AppleSubscriptionCard onStatusChange={onStatusChange} />);
    await waitFor(() => expect(screen.getByTestId('apple-restore-button')).not.toBeDisabled());
    await act(async () => {
      fireEvent.click(screen.getByTestId('apple-restore-button'));
      await flushMicrotasks();
    });
    await waitFor(() =>
      expect(onStatusChange).toHaveBeenCalledWith({
        has_subscription: true,
        status: 'active',
      })
    );
    expect(screen.getByTestId('apple-subscription-state')).toHaveTextContent(/vraćena/);
  });

  test('existingStripeActive shows ONLY the neutral message — no Stripe CTAs', () => {
    render(<AppleSubscriptionCard existingStripeActive />);
    const el = screen.getByTestId('apple-subscription-stripe-active');
    expect(el).toHaveTextContent('Pretplata aktivna preko web platforme.');
    expect(screen.queryByTestId('apple-purchase-button')).toBeNull();
    expect(screen.queryByTestId('apple-restore-button')).toBeNull();
  });

  test('active Apple subscription renders restore only', () => {
    render(<AppleSubscriptionCard appleActive />);
    expect(screen.getByTestId('apple-subscription-active')).toBeInTheDocument();
    expect(screen.getByTestId('apple-restore-button')).toBeInTheDocument();
    expect(screen.queryByTestId('apple-purchase-button')).toBeNull();
  });

  test('diagnostics modal opens with sanitized log lines', async () => {
    mockSvc.initAppleIap.mockResolvedValueOnce(true);
    mockSvc.loadProduct.mockResolvedValueOnce({
      productId: mockSvc.PRODUCT_ID,
      displayPrice: '',
    });
    mockSvc.getIapLogs.mockReturnValue([
      { t: Date.now(), line: 'Backend verification succeeded', extra: { status: 'active' } },
    ]);
    render(<AppleSubscriptionCard />);
    await waitFor(() =>
      expect(screen.getByTestId('apple-iap-diagnostics-button')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByTestId('apple-iap-diagnostics-button'));
    expect(screen.getByTestId('apple-iap-diagnostics-modal')).toBeInTheDocument();
    expect(screen.getByTestId('apple-iap-diagnostics-modal').textContent).toContain(
      'Backend verification succeeded'
    );
  });
});
