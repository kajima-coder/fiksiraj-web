import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import UserAvatar from '@/components/UserAvatar';
import { User, Building2, Mail, Phone, Link as LinkIcon, CreditCard, ExternalLink, Loader2, CheckCircle, AlertTriangle, Clock, Copy } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { getErrorMessage } from '@/utils/errorUtils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SettingsPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, subRes] = await Promise.all([
        axios.get(`${API}/professional-profile`),
        axios.get(`${API}/subscription-status`)
      ]);
      setProfile(profileRes.data);
      setSubscriptionStatus(subRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Greška pri učitavanju podataka');
    } finally {
      setLoading(false);
    }
  };

  const calculateTrialDaysRemaining = () => {
    if (!profile?.subscription_activated_at) return null;
    
    const activatedAt = new Date(profile.subscription_activated_at);
    const trialEndDate = new Date(activatedAt);
    trialEndDate.setDate(trialEndDate.getDate() + 30);
    
    const now = new Date();
    const diffTime = trialEndDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const returnUrl = `${window.location.origin}/postavke`;
      const response = await axios.post(`${API}/create-customer-portal-session`, {
        return_url: returnUrl
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Greška pri otvaranju portala');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error(getErrorMessage(error, 'Greška pri otvaranju portala za upravljanje pretplatom'));
    } finally {
      setPortalLoading(false);
    }
  };

  const handleActivateSubscription = async () => {
    setCheckoutLoading(true);
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
      setCheckoutLoading(false);
    }
  };

  const publicLink = `${window.location.origin}/majstor/${user?.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    toast.success('Link kopiran!');
  };

  const getSubscriptionStatusDisplay = () => {
    const status = subscriptionStatus?.subscription_status;
    const trialDays = calculateTrialDaysRemaining();

    if (status === 'trialing') {
      return {
        iconBg: 'bg-blue-600',
        statusClass: 'mp-subscription-status-trial',
        title: 'Probni period aktivan',
        subtitle: trialDays !== null ? `Preostalo ${trialDays} dana` : 'Probni period',
        description: 'Nakon isteka potrebna je pretplata za nastavak korištenja.'
      };
    }
    
    if (status === 'active') {
      return {
        iconBg: 'bg-green-600',
        statusClass: 'mp-subscription-status-active',
        title: 'Pretplata aktivna',
        subtitle: '€10/mjesečno',
        description: 'Uživate u svim premium značajkama.'
      };
    }
    
    if (status === 'past_due') {
      return {
        iconBg: 'bg-amber-500',
        statusClass: 'mp-subscription-status-warning',
        title: 'Plaćanje kasni',
        subtitle: 'Ažurirajte način plaćanja',
        description: 'Vaše plaćanje nije uspjelo. Molimo ažurirajte podatke za plaćanje.'
      };
    }
    
    if (status === 'unpaid') {
      return {
        iconBg: 'bg-red-500',
        statusClass: 'mp-subscription-status-warning',
        title: 'Neplaćeno',
        subtitle: 'Pretplata suspendirana',
        description: 'Vaš probni period je istekao. Za nastavak korištenja potrebno je aktivirati pretplatu.'
      };
    }
    
    if (status === 'canceled') {
      return {
        iconBg: 'bg-gray-500',
        statusClass: '',
        title: 'Pretplata otkazana',
        subtitle: 'Neaktivno',
        description: 'Vaša pretplata je otkazana. Aktivirajte novu pretplatu za pristup.'
      };
    }
    
    return {
      iconBg: 'bg-gray-400',
      statusClass: '',
      title: 'Bez pretplate',
      subtitle: 'Neaktivno',
      description: 'Pretplata još nije aktivirana. Aktivirajte pretplatu za pristup premium značajkama.'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-20 sm:pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Učitavanje postavki...</p>
          </div>
        </div>
      </div>
    );
  }

  const statusDisplay = getSubscriptionStatusDisplay();
  const hasStripeCustomer = !!subscriptionStatus?.stripe_customer_id;
  const canManageSubscription = hasStripeCustomer && ['trialing', 'active', 'past_due'].includes(subscriptionStatus?.subscription_status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 sm:pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {/* Page Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="mp-page-title" data-testid="settings-title">Postavke</h1>
            <p className="text-base text-gray-500">Upravljajte vašim profilom i pretplatom</p>
          </div>

          {/* Profile Hero Card */}
          <div className="mp-hero-card mb-8">
            <div className="flex items-center gap-4 sm:gap-5 relative z-10">
              <UserAvatar name={profile?.name} size="xl" className="shadow-xl border-2 border-white/20" />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-white truncate" style={{fontFamily: "'Sora', sans-serif"}}>
                  {profile?.name}
                </h2>
                <p className="text-sm text-white/70 mt-1">
                  {profile?.profession} • {profile?.city}
                </p>
                <p className="text-xs text-white/50 mt-1 truncate">
                  {profile?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Profile Information Card */}
            <div className="mp-info-card" style={{ padding: '28px' }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900" style={{fontFamily: "'Sora', sans-serif"}}>Profil</h3>
                  <p className="text-sm text-gray-500">Vaši podaci</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ime</p>
                    <p className="text-base font-semibold text-gray-800">{profile?.name || '-'}</p>
                  </div>
                </div>

                {profile?.company_name && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Naziv firme</p>
                      <p className="text-base font-semibold text-gray-800">{profile.company_name}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</p>
                    <p className="text-base font-semibold text-gray-800">{profile?.email || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Telefon</p>
                    <p className="text-base font-semibold text-gray-800">{profile?.phone || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Public Link */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <LinkIcon className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Javni link za rezervacije</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={publicLink}
                    readOnly
                    className="flex-1 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-3"
                    data-testid="settings-public-link-input"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="mp-btn-primary flex items-center justify-center gap-2"
                    data-testid="copy-link-button"
                  >
                    <Copy className="w-4 h-4" />
                    Kopiraj
                  </button>
                </div>
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
                  <p className="mp-subscription-title">Pretplata</p>
                  <p className="mp-subscription-subtitle">Upravljanje pretplatom</p>
                </div>
              </div>

              {/* Status Display */}
              <div className={`mp-subscription-status ${statusDisplay.statusClass}`} style={{ marginBottom: '20px' }}>
                {statusDisplay.statusClass.includes('trial') ? (
                  <Clock className="w-6 h-6 flex-shrink-0" />
                ) : statusDisplay.statusClass.includes('active') ? (
                  <CheckCircle className="w-6 h-6 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold">{statusDisplay.title}</p>
                  <p className="text-sm font-medium opacity-80">{statusDisplay.subtitle}</p>
                  <p className="text-sm mt-1 opacity-70">{statusDisplay.description}</p>
                </div>
              </div>

              {/* Trial Notice */}
              {subscriptionStatus?.subscription_status === 'trialing' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                  <p className="text-sm text-amber-800">
                    <strong>Napomena:</strong> Nakon probnog perioda potrebna je aktivna pretplata za nastavak korištenja platforme.
                  </p>
                </div>
              )}

              {/* Subscription Actions */}
              <div className="space-y-4">
                {canManageSubscription ? (
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="mp-btn-primary w-full"
                    data-testid="manage-subscription-button"
                  >
                    {portalLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Učitavanje...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-5 h-5" />
                        Upravljaj pretplatom
                      </>
                    )}
                  </button>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm mb-4">
                      {!hasStripeCustomer 
                        ? 'Pretplata još nije aktivirana.' 
                        : 'Za upravljanje pretplatom potrebna je aktivna pretplata.'}
                    </p>
                    <button 
                      onClick={handleActivateSubscription}
                      disabled={checkoutLoading}
                      className="mp-btn-primary"
                      data-testid="settings-activate-subscription"
                    >
                      {checkoutLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Učitavanje...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          {!hasStripeCustomer ? 'Aktiviraj pretplatu' : 'Obnovi pretplatu'}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Portal Info */}
                {canManageSubscription && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-2">
                      U Stripe portalu možete:
                    </p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      <li>• Otkazati pretplatu</li>
                      <li>• Ažurirati način plaćanja</li>
                      <li>• Pregledati račune i uplatnice</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Deletion Section */}
          <div className="mt-6">
            <div className="mp-info-card" style={{ padding: '24px' }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-base font-bold text-gray-700">Brisanje računa</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Za trajno brisanje računa kontaktirajte{' '}
                <a 
                  href="mailto:support@solvix.hr" 
                  className="text-blue-600 hover:underline font-medium"
                >
                  support@solvix.hr
                </a>
              </p>
              <a
                href="mailto:support@solvix.hr"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                data-testid="delete-account-link"
              >
                <Mail className="w-4 h-4" />
                support@solvix.hr
              </a>
            </div>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default SettingsPage;
