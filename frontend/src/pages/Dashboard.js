import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import OnboardingTour from '@/components/OnboardingTour';
import UserAvatar from '@/components/UserAvatar';
import { Calendar, Clock, CheckCircle, User, CreditCard, Loader2, AlertTriangle, Link as LinkIcon, Copy } from 'lucide-react';
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
  const [profile, setProfile] = useState(null);
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
    fetchProfile();
    checkOnboardingStatus();
    
    const subscriptionParam = searchParams.get('subscription');
    const sessionId = searchParams.get('session_id');
    
    if (subscriptionParam === 'success' && sessionId) {
      pollPaymentStatus(sessionId);
    } else if (subscriptionParam === 'cancelled') {
      toast.info('Pretplata je otkazana');
    }
  }, [searchParams]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/professional-profile`);
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

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

  const isSubscriptionBlocked = subscriptionStatus?.subscription_status && 
    ['past_due', 'unpaid', 'canceled'].includes(subscriptionStatus.subscription_status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {showOnboarding && (
        <OnboardingTour onComplete={handleOnboardingComplete} />
      )}
      
      {/* Subscription Blocked Overlay */}
      {isSubscriptionBlocked && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{fontFamily: "'Sora', sans-serif"}}>
              {subscriptionStatus.subscription_status === 'past_due' && 'Plaćanje kasni'}
              {subscriptionStatus.subscription_status === 'unpaid' && 'Vaš probni period je istekao'}
              {subscriptionStatus.subscription_status === 'canceled' && 'Pretplata otkazana'}
            </h2>
            <p className="text-base text-gray-600 mb-6">
              {subscriptionStatus.subscription_status === 'unpaid' 
                ? 'Za nastavak korištenja potrebno je aktivirati pretplatu.'
                : 'Za nastavak korištenja Fiksiraj platforme potrebno je obnoviti pretplatu.'}
            </p>
            <button
              onClick={handleActivateSubscription}
              disabled={subscriptionLoading}
              className="mp-btn-primary w-full"
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
      
      <div className="pt-20 sm:pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {/* Premium Hero Card */}
          <div className="mp-hero-card mb-8">
            <div className="flex items-center gap-4 sm:gap-5 relative z-10">
              <div className="relative flex-shrink-0">
                {profile?.profile_image_id ? (
                  <img 
                    src={`${API}/images/${profile.profile_image_id}`}
                    alt={user?.name}
                    className="block w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-xl border-2 border-white/20"
                  />
                ) : (
                  <UserAvatar name={user?.name} size="xl" className="shadow-xl border-2 border-white/20" />
                )}
                {profile?.company_logo_id && (
                  <img
                    src={`${API}/images/${profile.company_logo_id}`}
                    alt="Logo tvrtke"
                    className="absolute -bottom-1.5 -right-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain bg-white p-0.5 shadow-lg border border-gray-200"
                    data-testid="dashboard-company-logo-badge"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/60 mb-1">Dobrodošli natrag</p>
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate" style={{fontFamily: "'Sora', sans-serif"}}>
                  {user?.name}
                </h1>
                <p className="text-sm text-white/50 mt-1 hidden sm:block">
                  {user?.profession} • {user?.city}
                </p>
              </div>
            </div>
            
            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-3 mt-6 relative z-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{stats.today}</p>
                <p className="text-xs text-white/60 font-medium mt-1">Danas</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
                <p className="text-xs text-white/60 font-medium mt-1">Na čekanju</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{stats.confirmed}</p>
                <p className="text-xs text-white/60 font-medium mt-1">Potvrđeno</p>
              </div>
            </div>
          </div>

          {/* Quick Link Card */}
          <div className="mp-quick-link-card">
            <div className="mp-quick-link-header">
              <div className="mp-quick-link-icon">
                <LinkIcon />
              </div>
              <div>
                <p className="mp-quick-link-title">Vaš javni link</p>
                <p className="mp-quick-link-subtitle">Podijelite s klijentima za direktne rezervacije</p>
              </div>
            </div>
            <div className="mp-quick-link-input-wrapper">
              <input
                type="text"
                value={publicLink}
                readOnly
                className="mp-quick-link-input"
                data-testid="public-link-input"
              />
              <button
                onClick={handleCopyLink}
                className="mp-quick-link-btn flex items-center gap-2"
                data-testid="copy-link-button"
              >
                <Copy className="w-4 h-4" />
                Kopiraj link
              </button>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="mp-subscription-card">
            <div className="mp-subscription-header">
              <div className={`mp-subscription-icon ${
                subscriptionStatus?.has_subscription 
                  ? 'mp-subscription-icon-active' 
                  : subscriptionStatus?.subscription_status 
                    ? 'mp-subscription-icon-warning' 
                    : 'mp-subscription-icon-inactive'
              }`}>
                <CreditCard />
              </div>
              <div>
                <p className="mp-subscription-title">Premium pretplata</p>
                <p className="mp-subscription-subtitle">
                  {subscriptionStatus?.subscription_status === 'trialing' 
                    ? '30 dana besplatnog probnog perioda' 
                    : 'Aktivirajte sve premium značajke'}
                </p>
              </div>
            </div>
            
            {subscriptionStatus?.has_subscription ? (
              <div className={`mp-subscription-status ${
                subscriptionStatus?.subscription_status === 'trialing'
                  ? 'mp-subscription-status-trial'
                  : 'mp-subscription-status-active'
              }`}>
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="font-semibold">
                    {subscriptionStatus?.subscription_status === 'trialing' 
                      ? 'Probni period aktivan' 
                      : 'Pretplata aktivna'}
                  </p>
                  <p className="text-sm mt-0.5">
                    {subscriptionStatus?.subscription_status === 'trialing'
                      ? 'Imate pristup svim značajkama tijekom probnog perioda'
                      : 'Uživate u svim premium značajkama'}
                  </p>
                </div>
              </div>
            ) : subscriptionStatus?.subscription_status && !['trialing', 'active'].includes(subscriptionStatus.subscription_status) ? (
              <div className="space-y-4">
                <div className="mp-subscription-status mp-subscription-status-warning">
                  <CreditCard className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">
                      {subscriptionStatus.subscription_status === 'past_due' && 'Plaćanje kasni'}
                      {subscriptionStatus.subscription_status === 'unpaid' && 'Neplaćeno'}
                      {subscriptionStatus.subscription_status === 'canceled' && 'Pretplata otkazana'}
                    </p>
                    <p className="text-sm">Molimo obnovite pretplatu za pristup svim značajkama</p>
                  </div>
                </div>
                <div className="mp-subscription-price">
                  <div>
                    <p className="mp-subscription-price-value">€10<span className="mp-subscription-price-period">/mjesečno</span></p>
                    <p className="mp-subscription-price-trial">30 dana besplatnog probnog perioda</p>
                  </div>
                  <button
                    onClick={handleActivateSubscription}
                    disabled={subscriptionLoading}
                    className="mp-btn-primary"
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
              <div className="mp-subscription-price">
                <div>
                  <p className="mp-subscription-price-value">€10<span className="mp-subscription-price-period">/mjesečno</span></p>
                  <p className="mp-subscription-price-trial">30 dana besplatnog probnog perioda</p>
                </div>
                <button
                  onClick={handleActivateSubscription}
                  disabled={subscriptionLoading}
                  className="mp-btn-primary"
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

          {/* Stats Grid - Modern Product Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Danas</span>
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              </div>
              <p className="text-4xl font-bold text-gray-900 tracking-tight" data-testid="stat-today" style={{fontFamily: "'Sora', sans-serif"}}>{stats.today}</p>
              <p className="text-sm text-gray-400 mt-1">rezervacija</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Na čekanju</span>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              </div>
              <p className="text-4xl font-bold text-gray-900 tracking-tight" data-testid="stat-pending" style={{fontFamily: "'Sora', sans-serif"}}>{stats.pending}</p>
              <p className="text-sm text-gray-400 mt-1">za potvrdu</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Potvrđene</span>
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
              </div>
              <p className="text-4xl font-bold text-gray-900 tracking-tight" data-testid="stat-confirmed" style={{fontFamily: "'Sora', sans-serif"}}>{stats.confirmed}</p>
              <p className="text-sm text-gray-400 mt-1">aktivnih</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ukupno</span>
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              </div>
              <p className="text-4xl font-bold text-gray-900 tracking-tight" data-testid="stat-total" style={{fontFamily: "'Sora', sans-serif"}}>{stats.total}</p>
              <p className="text-sm text-gray-400 mt-1">svih vremena</p>
            </div>
          </div>

          {/* Upcoming Reservations */}
          <div className="mp-info-card" style={{ padding: '28px' }}>
            <div className="mp-section-header mb-6">
              <div>
                <h2 className="mp-section-title">Nadolazeće rezervacije</h2>
                <p className="mp-section-subtitle">Sljedećih 5 rezervacija</p>
              </div>
            </div>

            {bookings.length === 0 ? (
              <div className="mp-empty-state" style={{ padding: '48px 24px' }}>
                <div className="mp-empty-icon" style={{ width: '80px', height: '80px', marginBottom: '20px' }}>
                  <Calendar style={{ width: '36px', height: '36px' }} />
                </div>
                <h3 className="mp-empty-title" style={{ fontSize: '20px' }} data-testid="no-bookings-message">
                  Nemate nijednu rezervaciju
                </h3>
                <p className="mp-empty-text" style={{ fontSize: '14px', marginBottom: '0' }}>
                  Podijelite svoj link da biste dobili prve klijente!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                    data-testid="booking-item"
                  >
                    <UserAvatar name={booking.client_name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{booking.client_name}</p>
                      <p className="text-sm text-blue-600 font-semibold">{booking.service_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(booking.booking_datetime), 'PPP p', { locale: hr })}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`mp-booking-status ${
                        booking.status === 'pending' ? 'mp-booking-status-pending' :
                        booking.status === 'confirmed' ? 'mp-booking-status-confirmed' :
                        booking.status === 'cancelled' ? 'mp-booking-status-cancelled' :
                        'mp-booking-status-completed'
                      }`}>
                        {booking.status === 'pending' && 'Na čekanju'}
                        {booking.status === 'confirmed' && 'Potvrđeno'}
                        {booking.status === 'cancelled' && 'Otkazano'}
                        {booking.status === 'completed' && 'Završeno'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default Dashboard;
