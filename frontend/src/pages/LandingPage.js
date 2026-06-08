import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, Users, Search, Star, MapPin, ArrowRight, Sparkles, Wrench, Zap, Paintbrush, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LandingPage = () => {
  const [searchProfession, setSearchProfession] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [featuredProfessionals, setFeaturedProfessionals] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedProfessionals();
  }, []);

  const fetchFeaturedProfessionals = async () => {
    try {
      const response = await axios.get(`${API}/public/featured`);
      setFeaturedProfessionals(response.data.professionals);
    } catch (error) {
      console.error('Error fetching featured professionals:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchProfession) params.set('profession', searchProfession);
    if (searchCity) params.set('city', searchCity);
    navigate(`/pretraga?${params.toString()}`);
  };

  // Category icons mapping
  const categories = [
    { icon: Wrench, label: 'Vodoinstalater' },
    { icon: Zap, label: 'Električar' },
    { icon: Paintbrush, label: 'Soboslikar' },
    { icon: Home, label: 'Keramičar' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <span className="text-2xl sm:text-3xl font-bold text-black tracking-tight" style={{fontFamily: "'Sora', sans-serif"}}>
              Fiksiraj
            </span>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/prijava">
                <button className="px-4 sm:px-6 py-2.5 text-sm font-semibold text-gray-600 hover:text-black transition-colors" data-testid="landing-login-button">
                  Prijava
                </button>
              </Link>
              <Link to="/registracija">
                <button className="mp-btn-primary text-sm px-5 sm:px-7 py-2.5" data-testid="landing-register-button">
                  Registracija
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Premium Marketplace Style */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-5 py-2.5 mb-8">
            <Sparkles className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">Platforma za sve kućne majstore</span>
          </div>

          {/* Title - Much Larger */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-black tracking-tight mb-6 leading-[1.1]" style={{fontFamily: "'Sora', sans-serif"}}>
            Pronađite majstora<br />
            <span className="text-[#111111]">za svaki posao</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Vodoinstalater, električar, keramičar i drugi stručnjaci - sve na jednom mjestu.
          </p>

          {/* Premium Search Card */}
          <div className="mp-search-container max-w-2xl mx-auto mb-8">
            {/* Info banner */}
            <div className="bg-blue-50 rounded-xl p-4 mb-4 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">Rezervacija ne zahtijeva registraciju</span>
            </div>

            <form onSubmit={handleSearch}>
              <div className="space-y-3">
                <div className="mp-search-input-wrapper">
                  <Search className="mp-search-icon" />
                  <input
                    type="text"
                    placeholder="Zanimanje (npr. Vodoinstalater)"
                    value={searchProfession}
                    onChange={(e) => setSearchProfession(e.target.value)}
                    className="mp-search-input"
                    data-testid="search-profession-input"
                  />
                </div>
                <div className="mp-search-input-wrapper">
                  <MapPin className="mp-search-icon" />
                  <input
                    type="text"
                    placeholder="Grad (npr. Zagreb)"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="mp-search-input"
                    data-testid="search-city-input"
                  />
                </div>
                <button
                  type="submit"
                  className="mp-search-btn"
                  data-testid="search-button"
                >
                  <Search className="w-5 h-5" />
                  <span>Pronađi majstora</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Category Quick Links */}
          <div className="mp-category-grid max-w-md mx-auto">
            {categories.map((cat, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchProfession(cat.label);
                  navigate(`/pretraga?profession=${encodeURIComponent(cat.label)}`);
                }}
                className="mp-category-item"
              >
                <div className="mp-category-icon">
                  <cat.icon />
                </div>
                <span className="mp-category-label">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Professionals - Image First Cards */}
      {featuredProfessionals.length > 0 && (
        <section className="py-16 sm:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mp-section-header mb-12">
              <div>
                <h2 className="mp-section-title">Izdvojeni majstori</h2>
                <p className="mp-section-subtitle">Provjereni stručnjaci s najboljim ocjenama</p>
              </div>
              <Link to="/pretraga" className="mp-section-link hidden sm:flex">
                Pogledaj sve
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProfessionals.map((prof) => (
                <Link
                  key={prof.slug}
                  to={`/majstor/${prof.slug}`}
                  className="mp-professional-card"
                  data-testid="featured-professional-card"
                >
                  {/* Card Image Area */}
                  <div className="mp-card-image">
                    <div className="mp-card-image-placeholder">
                      {prof.name.charAt(0)}
                    </div>
                    {/* Rating Badge */}
                    <div className="mp-card-badge">
                      <Star />
                      <span>{prof.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="mp-card-content">
                    <h3 className="mp-card-title">{prof.name}</h3>
                    <p className="mp-card-subtitle">{prof.profession}</p>
                    <div className="mp-card-location">
                      <MapPin />
                      <span>{prof.city}</span>
                    </div>

                    <div className="mp-card-footer">
                      <span className="mp-card-reviews">{prof.review_count} recenzija</span>
                      {prof.starting_price > 0 && (
                        <span className="mp-card-price">
                          <span>Od </span>{prof.starting_price.toFixed(2)} EUR
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-10 sm:hidden">
              <Link to="/pretraga" className="mp-btn-secondary">
                Pogledaj sve majstore
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="mp-section-title mb-4">Zašto Fiksiraj?</h2>
            <p className="mp-section-subtitle">Sve što trebate za pronalaženje savršenog majstora</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Search, title: 'Brza pretraga', desc: 'Pronađite idealnog majstora za vaš posao u nekoliko sekundi.', color: 'bg-blue-600' },
              { icon: Calendar, title: 'Jednostavno rezerviranje', desc: 'Rezervirajte termin direktno preko platforme bez telefoniranja.', color: 'bg-purple-600' },
              { icon: CheckCircle, title: 'Provjereni stručnjaci', desc: 'Svi majstori su verificirani sa ocjenama i recenzijama.', color: 'bg-green-600' },
              { icon: Users, title: 'Vaš profil', desc: 'Jedinstven link za dijeljenje - fiksiraj.app/majstor/vaše-ime.', color: 'bg-orange-500' },
            ].map((feature, index) => (
              <div key={index} className="mp-info-card text-center">
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
                  <feature.icon className="w-7 h-7 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3" style={{fontFamily: "'Sora', sans-serif"}}>{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{fontFamily: "'Sora', sans-serif"}}>
            Spremni za početak?
          </h2>
          <p className="text-lg text-gray-400 mb-10">
            Registrirajte se besplatno i počnite primati rezervacije danas.
          </p>
          <Link to="/registracija">
            <button className="bg-white text-black px-10 py-4 rounded-2xl text-base font-semibold hover:bg-gray-100 transition-all" data-testid="cta-register-button">
              Kreiraj račun besplatno
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center gap-8">
            <span className="text-3xl font-bold tracking-tight" style={{fontFamily: "'Sora', sans-serif"}}>Fiksiraj</span>
            <p className="text-sm text-gray-400 max-w-md leading-relaxed">
              Platforma za rezervaciju majstora u Hrvatskoj. Pronađite provjerene stručnjake za svaki posao.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
              <Link to="/pretraga" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
                Pronađi majstora
              </Link>
              <Link to="/registracija" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
                Postani majstor
              </Link>
              <Link to="/terms" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
                Uvjeti korištenja
              </Link>
              <Link to="/privacy" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
                Politika privatnosti
              </Link>
            </div>
            
            {/* Payment Trust Section */}
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-gray-800 w-full text-gray-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Sigurna plaćanja putem Stripe</span>
            </div>
            
            <p className="text-sm text-gray-500">
              &copy; 2026 Fiksiraj. Sva prava pridržana.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
