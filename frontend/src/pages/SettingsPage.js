import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { User, Building2, Mail, Phone, Link as LinkIcon, CreditCard, Calendar, ExternalLink, Loader2, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
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
        icon: <Clock className="w-6 h-6 text-blue-600" />,
        bgColor: 'bg-blue-50 border-blue-200',
        textColor: 'text-blue-700',
        title: 'Probni period aktivan',
        subtitle: trialDays !== null ? `Preostalo ${trialDays} dana` : 'Probni period',
        description: 'Nakon isteka potrebna je pretplata za nastavak korištenja.'
      };
    }
    
    if (status === 'active') {
      return {
        icon: <CheckCircle className="w-6 h-6 text-emerald-600" />,
        bgColor: 'bg-emerald-50 border-emerald-200',
        textColor: 'text-emerald-700',
        title: 'Pretplata aktivna',
        subtitle: '€10/mjesečno',
        description: 'Uživate u svim premium značajkama.'
      };
    }
    
    if (status === 'past_due') {
      return {
        icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
        bgColor: 'bg-amber-50 border-amber-200',
        textColor: 'text-amber-700',
        title: 'Plaćanje kasni',
        subtitle: 'Ažurirajte način plaćanja',
        description: 'Vaše plaćanje nije uspjelo. Molimo ažurirajte podatke za plaćanje.'
      };
    }
    
    if (status === 'unpaid') {
      return {
        icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
        bgColor: 'bg-red-50 border-red-200',
        textColor: 'text-red-700',
        title: 'Neplaćeno',
        subtitle: 'Pretplata suspendirana',
        description: 'Vaš probni period je istekao. Za nastavak korištenja potrebno je aktivirati pretplatu.'
      };
    }
    
    if (status === 'canceled') {
      return {
        icon: <AlertTriangle className="w-6 h-6 text-slate-600" />,
        bgColor: 'bg-slate-50 border-slate-200',
        textColor: 'text-slate-700',
        title: 'Pretplata otkazana',
        subtitle: 'Neaktivno',
        description: 'Vaša pretplata je otkazana. Aktivirajte novu pretplatu za pristup.'
      };
    }
    
    // No subscription
    return {
      icon: <CreditCard className="w-6 h-6 text-slate-400" />,
      bgColor: 'bg-slate-50 border-slate-200',
      textColor: 'text-slate-600',
      title: 'Bez pretplate',
      subtitle: 'Neaktivno',
      description: 'Pretplata još nije aktivirana. Aktivirajte pretplatu za pristup premium značajkama.'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen app-background">
        <Navbar />
        <div className="page-container flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-slate-500">Učitavanje postavki...</p>
          </div>
        </div>
      </div>
    );
  }

  const statusDisplay = getSubscriptionStatusDisplay();
  const hasStripeCustomer = !!subscriptionStatus?.stripe_customer_id;
  const canManageSubscription = hasStripeCustomer && ['trialing', 'active', 'past_due'].includes(subscriptionStatus?.subscription_status);

  return (
    <div className="min-h-screen app-background">
      <Navbar />
      <div className="page-container">
        <div className="mb-12 sm:mb-16">
          <h1 className="section-title mb-4" data-testid="settings-title">
            Postavke
          </h1>
          <p className="section-subtitle">Upravljajte svojim profilom i pretplatom</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Profile Information Card */}
          <div className="card-elevated">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-700 uppercase tracking-wider">Profil</p>
                <p className="text-xs text-slate-400">Vaši podaci</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <User className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Ime</p>
                  <p className="text-base font-semibold text-slate-800">{profile?.name || '-'}</p>
                </div>
              </div>

              {/* Company Name */}
              {profile?.company_name && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <Building2 className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Naziv firme</p>
                    <p className="text-base font-semibold text-slate-800">{profile.company_name}</p>
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Email</p>
                  <p className="text-base font-semibold text-slate-800">{profile?.email || '-'}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <Phone className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Telefon</p>
                  <p className="text-base font-semibold text-slate-800">{profile?.phone || '-'}</p>
                </div>
              </div>

              {/* Public Link */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-primary/5 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <LinkIcon className="w-5 h-5 text-primary" />
                  <p className="text-xs text-primary uppercase tracking-wider font-bold">Javni link za rezervacije</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={publicLink}
                    readOnly
                    className="flex-1 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="btn-primary text-sm px-4 py-2"
                    data-testid="copy-link-button"
                  >
                    Kopiraj
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Management Card */}
          <div className="card-elevated">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                subscriptionStatus?.has_subscription 
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
                  : 'bg-gradient-to-br from-slate-400 to-slate-500'
              }`}>
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-700 uppercase tracking-wider">Pretplata</p>
                <p className="text-xs text-slate-400">Upravljanje pretplatom</p>
              </div>
            </div>

            {/* Subscription Status Display */}
            <div className={`p-5 rounded-2xl border-2 mb-6 ${statusDisplay.bgColor}`}>
              <div className="flex items-start gap-4">
                {statusDisplay.icon}
                <div className="flex-1">
                  <p className={`font-bold text-lg ${statusDisplay.textColor}`}>{statusDisplay.title}</p>
                  <p className={`text-sm font-medium ${statusDisplay.textColor} opacity-80`}>{statusDisplay.subtitle}</p>
                  <p className="text-sm text-slate-600 mt-2">{statusDisplay.description}</p>
                </div>
              </div>
            </div>

            {/* Trial Notice */}
            {subscriptionStatus?.subscription_status === 'trialing' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-amber-800">
                  <strong>Napomena:</strong> Nakon probnog perioda potrebna je aktivna pretplata za nastavak korištenja platforme.
                </p>
              </div>
            )}

            {/* Subscription Management */}
            <div className="space-y-4">
              {canManageSubscription ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="w-full btn-primary flex items-center justify-center gap-2"
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
              ) : !hasStripeCustomer ? (
                <div className="text-center py-4">
                  <p className="text-slate-500 text-sm mb-4">
                    Pretplata još nije aktivirana.
                  </p>
                  <a href="/dashboard" className="btn-primary inline-flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Aktiviraj pretplatu
                  </a>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-500 text-sm mb-4">
                    Za upravljanje pretplatom potrebna je aktivna pretplata.
                  </p>
                  <a href="/dashboard" className="btn-primary inline-flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Obnovi pretplatu
                  </a>
                </div>
              )}

              {/* Portal Info */}
              {canManageSubscription && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 text-center">
                    U Stripe portalu možete:
                  </p>
                  <ul className="text-xs text-slate-500 mt-2 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                      Otkazati pretplatu
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                      Ažurirati način plaćanja
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                      Pregledati račune i uplatnice
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Deletion Section */}
        <div className="mt-8">
          <div className="card-elevated">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-700 uppercase tracking-wider">Brisanje računa</p>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Za trajno brisanje računa kontaktirajte{' '}
              <a 
                href="mailto:support@solvix.hr" 
                className="text-primary hover:underline font-medium"
              >
                support@solvix.hr
              </a>
            </p>
            <a
              href="mailto:support@solvix.hr"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors"
              data-testid="delete-account-link"
            >
              <Mail className="w-4 h-4" />
              support@solvix.hr
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
