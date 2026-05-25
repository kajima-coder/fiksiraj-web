import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import OnboardingTour from '@/components/OnboardingTour';
import { Calendar, Clock, CheckCircle, User, CreditCard, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { getErrorMessage } from '@/utils/errorUtils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    confirmed: 0,
    total: 0,
  });

  useEffect(() => {
    fetchBookings();
    fetchSubscriptionStatus();
    checkOnboardingStatus();
    
    // Check if returning from Stripe
    const subscriptionParam = searchParams.get('subscription');
    const sessionId = searchParams.get('session_id');
    
    if (subscriptionParam === 'success' && sessionId) {
      pollPaymentStatus(sessionId);
    } else if (subscriptionParam === 'cancelled') {
      toast.info('Pretplata je otkazana');
    }
  }, [searchParams]);

  const checkOnboardingStatus = async () => {
    try {
      const response = await axios.get(`${API}/onboarding-status`);
      if (!response.data.onboarding_completed) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await axios.post(`${API}/onboarding-complete`);
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setShowOnboarding(false);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await axios.get(`${API}/subscription-status`);
      setSubscriptionStatus(response.data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      toast.error('Provjera statusa pretplate je istekla. Provjerite email za potvrdu.');
      fetchSubscriptionStatus();
      window.history.replaceState({}, '', '/dashboard');
      return;
    }

    try {
      const response = await axios.get(`${API}/checkout-status/${sessionId}`);
      
      // For trial: status will be 'complete' but payment_status may be 'no_payment_required'
      if (response.data.status === 'complete') {
        toast.success('Pretplata je uspješno aktivirana! Imate 30 dana besplatnog probnog perioda.');
        fetchSubscriptionStatus();
        window.history.replaceState({}, '', '/dashboard');
        return;
      } else if (response.data.status === 'expired') {
        toast.error('Sesija je istekla. Pokušajte ponovo.');
        window.history.replaceState({}, '', '/dashboard');
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error polling payment status:', error);
      toast.error('Greška pri provjeri statusa plaćanja');
    }
  };

  const handleActivateSubscription = async () => {
    setSubscriptionLoading(true);
    try {
      const originUrl = window.location.origin;
      const response = await axios.post(`${API}/create-checkout-session`, {
        plan_id: 'monthly',
        origin_url: originUrl
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Greška pri kreiranju sesije');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error(getErrorMessage(error, 'Greška pri aktivaciji pretplate'));
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings`);
      const bookingsData = response.data;
      setBookings(bookingsData);

      const today = new Date().toISOString().split('T')[0];
      const todayBookings = bookingsData.filter(
        (b) => b.booking_datetime.split('T')[0] === today && b.status !== 'cancelled'
      );
      const pendingBookings = bookingsData.filter((b) => b.status === 'pending');
      const confirmedBookings = bookingsData.filter((b) => b.status === 'confirmed');

      setStats({
        today: todayBookings.length,
        pending: pendingBookings.length,
        confirmed: confirmedBookings.length,
        total: bookingsData.length,
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const publicLink = `${window.location.origin}/majstor/${user?.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    toast.success('Link kopiran!');
  };

  // Check if subscription is blocked (past_due, unpaid, canceled)
  const isSubscriptionBlocked = subscriptionStatus?.subscription_status && 
    ['past_due', 'unpaid', 'canceled'].includes(subscriptionStatus.subscription_status);

  return (
    <div className="min-h-screen app-background">
      <Navbar />
      
      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour onComplete={handleOnboardingComplete} />
      )}
      
      {/* Subscription Blocked Overlay */}
      {isSubscriptionBlocked && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              {subscriptionStatus.subscription_status === 'past_due' && 'Plaćanje kasni'}
              {subscriptionStatus.subscription_status === 'unpaid' && 'Vaš probni period je istekao'}
              {subscriptionStatus.subscription_status === 'canceled' && 'Pretplata otkazana'}
            </h2>
            <p className="text-base text-slate-600 mb-6">
              {subscriptionStatus.subscription_status === 'unpaid' 
                ? 'Za nastavak korištenja potrebno je aktivirati pretplatu.'
                : 'Za nastavak korištenja Fiksiraj platforme potrebno je obnoviti pretplatu.'}
            </p>
            <button
              onClick={handleActivateSubscription}
              disabled={subscriptionLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
              data-testid="renew-subscription-button"
            >
              {subscriptionLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Učitavanje...
                </>
              ) : (
                subscriptionStatus.subscription_status === 'unpaid' ? 'Aktiviraj pretplatu' : 'Obnovi pretplatu'
              )}
            </button>
          </div>
        </div>
      )}
      
      <div className="page-container">
        <div className="mb-12 sm:mb-16">
          <h1 className="section-title mb-4" data-testid="dashboard-title">
            Dobro došli, {user?.name}
          </h1>
          <p className="section-subtitle">Pregled vaših rezervacija i statistika</p>
        </div>

        {/* Public Link Card */}
        <div className="card-elevated mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-700 uppercase tracking-wider">Vaš javni link</p>
              <p className="text-xs text-slate-400">Podijelite s klijentima za direktne rezervacije</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <input
              type="text"
              value={publicLink}
              readOnly
              className="flex-1 bg-slate-50/80 border-2 border-slate-200 rounded-2xl px-6 py-4 text-sm text-slate-700 font-medium"
              data-testid="public-link-input"
            />
            <button
              onClick={handleCopyLink}
              className="btn-primary whitespace-nowrap"
              data-testid="copy-link-button"
            >
              Kopiraj link
            </button>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="card-elevated mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              subscriptionStatus?.has_subscription 
                ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
                : subscriptionStatus?.subscription_status 
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600' 
                  : 'bg-gradient-to-br from-slate-400 to-slate-500'
            }`}>
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-700 uppercase tracking-wider">Premium pretplata</p>
              <p className="text-xs text-slate-400">
                {subscriptionStatus?.subscription_status === 'trialing' 
                  ? '30 dana besplatnog probnog perioda' 
                  : 'Aktivirajte sve premium značajke'}
              </p>
            </div>
          </div>
          
          {subscriptionStatus?.has_subscription ? (
            <div className={`flex items-center gap-3 p-4 rounded-2xl ${
              subscriptionStatus?.subscription_status === 'trialing'
                ? 'bg-blue-50 border-2 border-blue-200'
                : 'bg-emerald-50 border-2 border-emerald-200'
            }`}>
              <CheckCircle className={`w-6 h-6 ${
                subscriptionStatus?.subscription_status === 'trialing' ? 'text-blue-600' : 'text-emerald-600'
              }`} />
              <div>
                <p className={`font-semibold ${
                  subscriptionStatus?.subscription_status === 'trialing' ? 'text-blue-700' : 'text-emerald-700'
                }`}>
                  {subscriptionStatus?.subscription_status === 'trialing' 
                    ? 'Probni period aktivan' 
                    : 'Pretplata aktivna'}
                </p>
                <p className={`text-sm ${
                  subscriptionStatus?.subscription_status === 'trialing' ? 'text-blue-600' : 'text-emerald-600'
                }`}>
                  {subscriptionStatus?.subscription_status === 'trialing'
                    ? 'Imate pristup svim značajkama tijekom probnog perioda'
                    : 'Uživate u svim premium značajkama'}
                </p>
              </div>
            </div>
          ) : subscriptionStatus?.subscription_status && !['trialing', 'active'].includes(subscriptionStatus.subscription_status) ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                <CreditCard className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-700">
                    {subscriptionStatus.subscription_status === 'past_due' && 'Plaćanje kasni'}
                    {subscriptionStatus.subscription_status === 'unpaid' && 'Neplaćeno'}
                    {subscriptionStatus.subscription_status === 'canceled' && 'Pretplata otkazana'}
                  </p>
                  <p className="text-sm text-amber-600">Molimo obnovite pretplatu za pristup svim značajkama</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div>
                  <p className="text-2xl font-bold text-slate-800">€10<span className="text-base font-normal text-slate-500">/mjesečno</span></p>
                  <p className="text-sm text-slate-500">30 dana besplatnog probnog perioda</p>
                </div>
                <button
                  onClick={handleActivateSubscription}
                  disabled={subscriptionLoading}
                  className="btn-primary whitespace-nowrap flex items-center justify-center gap-2"
                  data-testid="activate-subscription-button"
                >
                  {subscriptionLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Učitavanje...
                    </>
                  ) : (
                    'Obnovi pretplatu'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-bold text-slate-800">€10<span className="text-base font-normal text-slate-500">/mjesečno</span></p>
                <p className="text-sm text-slate-500">30 dana besplatnog probnog perioda</p>
              </div>
              <button
                onClick={handleActivateSubscription}
                disabled={subscriptionLoading}
                className="btn-primary whitespace-nowrap flex items-center justify-center gap-2"
                data-testid="activate-subscription-button"
              >
                {subscriptionLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Učitavanje...
                  </>
                ) : (
                  'Aktiviraj pretplatu'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Stat Cards - Dramatic Visual Difference */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {/* Today - Blue */}
          <div className="stat-card stat-card-blue group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black text-blue-600 uppercase tracking-wider mb-1">Danas</p>
                <p className="text-xs text-slate-400 hidden sm:block">Današnje rezervacije</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-5xl sm:text-6xl font-bold text-blue-600 mt-auto" style={{fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em'}} data-testid="stat-today">{stats.today}</p>
          </div>

          {/* Pending - Amber - MORE PROMINENT */}
          <div className="stat-card stat-card-amber group relative">
            {stats.pending > 0 && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-xs font-black text-white">!</span>
              </div>
            )}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black text-amber-600 uppercase tracking-wider mb-1">Na čekanju</p>
                <p className="text-xs text-slate-400 hidden sm:block">Čekaju potvrdu</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-5xl sm:text-6xl font-bold text-amber-600 mt-auto" style={{fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em'}} data-testid="stat-pending">{stats.pending}</p>
          </div>

          {/* Confirmed - Emerald */}
          <div className="stat-card stat-card-emerald group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-1">Potvrđene</p>
                <p className="text-xs text-slate-400 hidden sm:block">Spremne za rad</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-5xl sm:text-6xl font-bold text-emerald-600 mt-auto" style={{fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em'}} data-testid="stat-confirmed">{stats.confirmed}</p>
          </div>

          {/* Total - Slate */}
          <div className="stat-card stat-card-slate group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Ukupno</p>
                <p className="text-xs text-slate-400 hidden sm:block">Sve rezervacije</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-slate-500 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-500/30 group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-5xl sm:text-6xl font-bold text-slate-800 mt-auto" style={{fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em'}} data-testid="stat-total">{stats.total}</p>
          </div>
        </div>

        {/* Upcoming Reservations */}
        <div className="card-elevated">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{fontFamily: "'Sora', sans-serif"}}>Nadolazeće rezervacije</h2>
              <p className="text-sm text-slate-400">Sljedećih 5 rezervacija</p>
            </div>
          </div>
          {bookings.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-xl text-slate-400 font-medium" data-testid="no-bookings-message">
                Nemate nijednu rezervaciju.
              </p>
              <p className="text-sm text-slate-300 mt-2">Podijelite svoj link da biste dobili prve klijente!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border-2 border-slate-100 hover:border-primary/20 hover:shadow-lg transition-all duration-300"
                  data-testid="booking-item"
                >
                  <div className="flex items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-primary flex-shrink-0" />
                        <p className="font-black text-lg sm:text-xl text-slate-900 truncate">{booking.client_name}</p>
                      </div>
                      <p className="text-base text-primary font-bold mb-2">{booking.service_name}</p>
                      <p className="text-sm text-slate-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{format(new Date(booking.booking_datetime), 'PPP p', { locale: hr })}</span>
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {booking.status === 'pending' && (
                        <span className="status-badge status-pending">Na čekanju</span>
                      )}
                      {booking.status === 'confirmed' && (
                        <span className="status-badge status-confirmed">Potvrđeno</span>
                      )}
                      {booking.status === 'cancelled' && (
                        <span className="status-badge status-cancelled">Otkazano</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
