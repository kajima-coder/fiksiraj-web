import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, Users, Search, Star, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  return (
    <div className="min-h-screen app-background">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 py-3 sm:py-4">
            <span className="text-2xl sm:text-3xl font-bold text-primary tracking-tight" style={{fontFamily: "'Sora', sans-serif"}}>Fiksiraj</span>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/prijava">
                <Button variant="ghost" className="text-slate-600 font-bold rounded-2xl px-4 sm:px-6 py-2.5 text-sm hover:bg-slate-100 transition-all" data-testid="landing-login-button">
                  Prijava
                </Button>
              </Link>
              <Link to="/registracija">
                <Button className="btn-primary text-sm px-5 sm:px-8 py-3" data-testid="landing-register-button">
                  Registracija
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden min-h-[85vh] sm:min-h-[90vh] flex items-center">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(255, 255, 255, 0.98) 100%), url('https://images.unsplash.com/photo-1770656506117-2372e446b6fa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHw0fHxwcm9mZXNzaW9uYWwlMjBwbHVtYmVyJTIwZWxlY3RyaWNpYW4lMjBwYWludGVyJTIwdG9vbHN8ZW58MHx8fHwxNzcyNDY2NDAyfDA&ixlib=rb-4.1.0&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">Platforma za sve kućne majstore</span>
            </div>

            <h1 className="section-title mb-6 sm:mb-8 leading-[1.1]">
              Pronađite majstora<br />
              <span className="bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent">za svaki posao</span>
            </h1>
            <p className="section-subtitle mb-10 sm:mb-14 max-w-3xl mx-auto px-2">
              Fiksiraj je platforma za rezervaciju majstora. Vodoinstalater, električar, keramičar i drugi stručnjaci - sve na jednom mjestu.
            </p>

            {/* Search Card - Hero CTA */}
            <div className="hero-card max-w-4xl mx-auto mb-10 sm:mb-12 relative overflow-hidden">
              {/* Gradient accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-violet-500"></div>
              
              <div className="bg-gradient-to-r from-blue-50 to-primary/5 border border-blue-200/50 rounded-2xl p-4 mb-8">
                <p className="text-sm text-blue-800 font-medium text-center flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Rezervacija ne zahtijeva registraciju. Registracija je potrebna samo za majstore.
                </p>
              </div>

              <form onSubmit={handleSearch} className="space-y-5">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Zanimanje (npr. Vodoinstalater)"
                      value={searchProfession}
                      onChange={(e) => setSearchProfession(e.target.value)}
                      className="form-input h-14 pl-12 text-base"
                      data-testid="search-profession-input"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Grad (npr. Zagreb)"
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      className="form-input h-14 pl-12 text-base"
                      data-testid="search-city-input"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="btn-primary w-full h-14 text-base flex items-center justify-center gap-3"
                  data-testid="search-button"
                >
                  <Search className="w-5 h-5" />
                  <span>Pronađi majstora</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </form>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/registracija">
                <Button
                  className="btn-secondary w-full sm:w-auto px-10 py-4 text-base"
                  data-testid="hero-register-button"
                >
                  Počni besplatno kao majstor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Professionals */}
      {(featuredProfessionals || []).length > 0 && (
        <div className="py-24 sm:py-32 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="section-title mb-4">Izdvojeni majstori</h2>
              <p className="section-subtitle">Provjereni stručnjaci s najboljim ocjenama</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProfessionals.map((prof) => (
                <Link
                  key={prof.slug}
                  to={`/majstor/${prof.slug}`}
                  className="professional-card group"
                  data-testid="featured-professional-card"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight text-slate-900 group-hover:text-primary transition-colors duration-300" style={{fontFamily: "'Sora', sans-serif"}}>{prof.name}</h3>
                      <p className="text-base font-bold text-primary mt-1">{prof.profession}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 px-3 py-1.5 rounded-full shadow-sm">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-bold text-amber-700" style={{fontFamily: "'Inter', sans-serif"}}>{prof.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mb-5 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {prof.city}
                  </p>
                  <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                    <span className="text-sm text-slate-400">{prof.review_count} recenzija</span>
                    {prof.starting_price > 0 && (
                      <span className="price-tag text-sm py-1.5 px-4">Od {prof.starting_price.toFixed(2)} EUR</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="py-24 sm:py-32 app-background relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">Zašto Fiksiraj?</h2>
            <p className="section-subtitle">Sve što trebate za pronalaženje savršenog majstora</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Search, title: 'Brza pretraga', desc: 'Pronađite idealnog majstora za vaš posao u nekoliko sekundi.', color: 'from-blue-500 to-blue-600' },
              { icon: Calendar, title: 'Jednostavno rezerviranje', desc: 'Rezervirajte termin direktno preko platforme bez telefoniranja.', color: 'from-violet-500 to-purple-600' },
              { icon: CheckCircle, title: 'Provjereni stručnjaci', desc: 'Svi majstori su verificirani sa ocjenama i recenzijama.', color: 'from-emerald-500 to-green-600' },
              { icon: Users, title: 'Vaš profil', desc: 'Jedinstven link za dijeljenje - fiksiraj.app/majstor/vaše-ime.', color: 'from-amber-500 to-orange-500' },
            ].map((feature, index) => (
              <div key={index} className="stat-card group text-center" style={{'--stat-color': feature.color.includes('blue') ? '#3b82f6' : feature.color.includes('violet') ? '#8b5cf6' : feature.color.includes('emerald') ? '#10b981' : '#f59e0b'}}>
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-semibold tracking-tight mb-3" style={{fontFamily: "'Sora', sans-serif"}}>{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 sm:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="section-title mb-4">Spremni za početak?</h2>
          <p className="section-subtitle mb-12">
            Registrirajte se besplatno i počnite primati rezervacije danas.
          </p>
          <Link to="/registracija">
            <Button
              className="btn-primary px-14 py-5 text-lg"
              data-testid="cta-register-button"
            >
              Kreiraj račun besplatno
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col items-center text-center gap-8">
            <span className="text-3xl font-bold tracking-tight" style={{fontFamily: "'Sora', sans-serif"}}>Fiksiraj</span>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Platforma za rezervaciju majstora u Hrvatskoj. Pronađite provjerene stručnjake za svaki posao.
            </p>
            <div className="flex items-center gap-8">
              <Link to="/pretraga" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors duration-300">
                Pronađi majstora
              </Link>
              <Link to="/registracija" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors duration-300">
                Postani majstor
              </Link>
            </div>
            <div className="pt-8 border-t border-slate-800 w-full">
              <p className="text-sm text-slate-500">
                &copy; 2025 Fiksiraj. Sva prava pridržana.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
