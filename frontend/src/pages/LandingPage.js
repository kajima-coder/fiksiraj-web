import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, Users, Search, Star, MapPin, ArrowRight, Sparkles, Wrench, Zap, Paintbrush, Home, Hammer, Droplets, Flame, TreePine, Car, Refrigerator, Wind, Truck, Sofa, Building2, Scissors, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LandingPage = () => {
  const [searchProfession, setSearchProfession] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [featuredProfessionals, setFeaturedProfessionals] = useState([]);
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);

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

  // All professions with icons - comprehensive mapping
  const professionCategories = [
    { icon: Droplets, label: 'Vodoinstalater', color: 'bg-blue-500' },
    { icon: Zap, label: 'Električar', color: 'bg-amber-500' },
    { icon: Paintbrush, label: 'Soboslikar', color: 'bg-pink-500' },
    { icon: Hammer, label: 'Tesar', color: 'bg-orange-600' },
    { icon: Building2, label: 'Zidar', color: 'bg-stone-500' },
    { icon: Layers, label: 'Keramičar', color: 'bg-cyan-500' },
    { icon: Home, label: 'Parketar', color: 'bg-amber-700' },
    { icon: Layers, label: 'Knaufer', color: 'bg-gray-500' },
    { icon: Home, label: 'Krovopokrivač', color: 'bg-red-600' },
    { icon: Flame, label: 'Instalater grijanja', color: 'bg-orange-500' },
    { icon: Flame, label: 'Plinoinstalater', color: 'bg-red-500' },
    { icon: Hammer, label: 'Stolar', color: 'bg-yellow-700' },
    { icon: Wrench, label: 'Bravar', color: 'bg-slate-600' },
    { icon: Layers, label: 'Staklar', color: 'bg-sky-400' },
    { icon: Wind, label: 'Dimnjačar', color: 'bg-gray-700' },
    { icon: TreePine, label: 'Vrtlar', color: 'bg-green-600' },
    { icon: Car, label: 'Automehaničar', color: 'bg-blue-700' },
    { icon: Car, label: 'Autolimar', color: 'bg-indigo-600' },
    { icon: Refrigerator, label: 'Serviser bijele tehnike', color: 'bg-gray-400' },
    { icon: Wind, label: 'Serviser klima', color: 'bg-teal-500' },
    { icon: Sparkles, label: 'Čistač/ica', color: 'bg-purple-500' },
    { icon: Truck, label: 'Selidbe i prijevoz', color: 'bg-blue-600' },
    { icon: Sofa, label: 'Monter namještaja', color: 'bg-yellow-600' },
    { icon: Building2, label: 'Fasader', color: 'bg-orange-400' },
    { icon: Scissors, label: 'Limar', color: 'bg-slate-500' },
    { icon: Hammer, label: 'Građevinski radovi', color: 'bg-stone-600' },
    { icon: Home, label: 'Adaptacije stanova', color: 'bg-emerald-600' },
  ];

  const scrollCategories = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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

      {/* Hero Section - Dark Premium with Background Image */}
      <section className="relative pt-16 sm:pt-20 overflow-hidden bg-[#0B1424]">
        {/* Background Image + Dark Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1920&q=80"
            alt=""
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B1424]/95 via-[#0E1B33]/85 to-[#0B1424]/60"></div>
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0B1424]/80 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-14 sm:pb-24">
          <div className="max-w-3xl">
            {/* Title - Premium Typography */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-5 leading-[1.08]" style={{fontFamily: "'Sora', sans-serif"}}>
              Pronađite majstora
              <br />
              <span className="text-blue-400">za svaki posao</span>
            </h1>

            {/* Blue accent bar */}
            <div className="w-24 sm:w-36 h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-400/20 mb-6 shadow-lg shadow-blue-500/30"></div>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-white/70 mb-8 sm:mb-10 max-w-xl leading-relaxed">
              Brzo pronađite provjerene stručnjake za sve kućne popravke i poslove. Bez registracije.
            </p>
          </div>

          {/* Premium Search Card */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-2xl shadow-black/40 max-w-3xl">
            <form onSubmit={handleSearch}>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Što trebate? (npr. Vodoinstalater)"
                    value={searchProfession}
                    onChange={(e) => setSearchProfession(e.target.value)}
                    className="w-full bg-gray-50 border-0 rounded-xl pl-12 pr-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    data-testid="search-profession-input"
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Grad (npr. Zagreb)"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="w-full bg-gray-50 border-0 rounded-xl pl-12 pr-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    data-testid="search-city-input"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-black text-white rounded-xl px-8 py-4 font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 sm:w-auto w-full"
                  data-testid="search-button"
                >
                  <Search className="w-5 h-5" />
                  <span className="sm:hidden lg:inline">Traži</span>
                </button>
              </div>
            </form>
            
            {/* Quick info */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Bez registracije</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Brza rezervacija</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professions Horizontal Scroll Section */}
      <section className="py-8 sm:py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900" style={{fontFamily: "'Sora', sans-serif"}}>
                Pronađi po zanimanju
              </h2>
              <p className="text-sm text-gray-500 mt-1">Odaberite kategoriju za brzu pretragu</p>
            </div>
            {/* Desktop Navigation Arrows */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => scrollCategories('left')}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => scrollCategories('right')}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Horizontal Scrollable Categories */}
          <div 
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto pb-4 px-4 sm:px-6 lg:px-8 scrollbar-hide snap-x snap-mandatory"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {professionCategories.map((cat, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchProfession(cat.label);
                  navigate(`/pretraga?profession=${encodeURIComponent(cat.label)}`);
                }}
                className="flex-shrink-0 snap-start flex items-center gap-3 bg-white border-2 border-gray-100 hover:border-gray-200 hover:shadow-md rounded-2xl px-5 py-4 transition-all group"
                data-testid={`category-${index}`}
              >
                <div className={`w-11 h-11 ${cat.color} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <cat.icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap pr-2">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile swipe hint */}
          <p className="text-center text-xs text-gray-400 mt-2 sm:hidden">
            ← Povuci za više →
          </p>
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
                    {prof.profile_image_id ? (
                      <img
                        src={`${API}/images/${prof.profile_image_id}`}
                        alt={prof.name}
                        className="mp-card-photo"
                        loading="lazy"
                      />
                    ) : (
                      <div className="mp-card-image-placeholder">
                        {prof.name.charAt(0)}
                      </div>
                    )}
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

      {/* Hide scrollbar globally for this page */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
