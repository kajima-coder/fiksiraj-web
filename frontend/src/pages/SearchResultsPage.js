import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Star, MapPin, Search, Filter, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { PROFESSIONS } from '@/constants';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    profession: searchParams.get('profession') || '',
    city: searchParams.get('city') || '',
  });

  useEffect(() => {
    fetchResults();
  }, [searchParams]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const profession = searchParams.get('profession');
      const city = searchParams.get('city');
      
      if (profession) params.set('profession', profession);
      if (city) params.set('city', city);

      const response = await axios.get(`${API}/public/search?${params.toString()}`);
      setProfessionals(response.data.professionals);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.profession) params.set('profession', filters.profession);
    if (filters.city) params.set('city', filters.city);
    setSearchParams(params);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ profession: '', city: '' });
    setSearchParams({});
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Premium Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Link to="/" className="text-2xl sm:text-3xl font-bold text-black tracking-tight" style={{fontFamily: "'Sora', sans-serif"}}>
              Fiksiraj
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/prijava">
                <button className="px-4 sm:px-6 py-2.5 text-sm font-semibold text-gray-600 hover:text-black transition-colors">
                  Prijava
                </button>
              </Link>
              <Link to="/registracija">
                <button className="mp-btn-primary text-sm px-5 sm:px-7 py-2.5">
                  Registracija
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-20 sm:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header with Filter Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <h1 className="mp-page-title" data-testid="search-results-title">
                Rezultati pretrage
              </h1>
              <p className="text-base text-gray-500">
                Pronađeno {professionals.length} {professionals.length === 1 ? 'majstor' : 'majstora'}
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="mp-btn-secondary sm:hidden"
            >
              <Filter className="w-5 h-5" />
              Filteri
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block lg:w-80 flex-shrink-0">
              <div className="mp-info-card sticky top-28" style={{ padding: '28px' }}>
                <h2 className="text-lg font-bold text-gray-900 mb-6" style={{fontFamily: "'Sora', sans-serif"}}>Filteri</h2>
                
                <div className="space-y-5">
                  <div>
                    <label className="mp-form-label">Zanimanje</label>
                    <select
                      value={filters.profession}
                      onChange={(e) => handleFilterChange('profession', e.target.value)}
                      className="mp-form-input w-full cursor-pointer"
                      data-testid="filter-profession-select"
                    >
                      <option value="">Sva zanimanja</option>
                      {PROFESSIONS.map((prof) => (
                        <option key={prof} value={prof}>{prof}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mp-form-label">Grad</label>
                    <input
                      type="text"
                      placeholder="Npr. Zagreb"
                      value={filters.city}
                      onChange={(e) => handleFilterChange('city', e.target.value)}
                      className="mp-form-input w-full"
                      data-testid="filter-city-input"
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <button
                      onClick={applyFilters}
                      className="mp-btn-primary w-full"
                      data-testid="apply-filters-button"
                    >
                      Primijeni filtere
                    </button>
                    <button
                      onClick={clearFilters}
                      className="mp-btn-secondary w-full"
                      data-testid="clear-filters-button"
                    >
                      Obriši filtere
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            {/* Mobile Filters Dropdown */}
            {showFilters && (
              <div className="lg:hidden mp-info-card mb-6" style={{ padding: '24px' }}>
                <div className="space-y-4">
                  <div>
                    <label className="mp-form-label">Zanimanje</label>
                    <select
                      value={filters.profession}
                      onChange={(e) => handleFilterChange('profession', e.target.value)}
                      className="mp-form-input w-full cursor-pointer"
                    >
                      <option value="">Sva zanimanja</option>
                      {PROFESSIONS.map((prof) => (
                        <option key={prof} value={prof}>{prof}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mp-form-label">Grad</label>
                    <input
                      type="text"
                      placeholder="Npr. Zagreb"
                      value={filters.city}
                      onChange={(e) => handleFilterChange('city', e.target.value)}
                      className="mp-form-input w-full"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={applyFilters}
                      className="mp-btn-primary flex-1"
                    >
                      Primijeni
                    </button>
                    <button
                      onClick={clearFilters}
                      className="mp-btn-secondary flex-1"
                    >
                      Obriši
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results Grid */}
            <main className="flex-1">
              {loading ? (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-black border-t-transparent mb-4"></div>
                  <p className="text-base text-gray-500">Učitavanje...</p>
                </div>
              ) : professionals.length === 0 ? (
                <div className="mp-empty-state">
                  <div className="mp-empty-icon">
                    <Search />
                  </div>
                  <h3 className="mp-empty-title" data-testid="no-results-message">Nema rezultata</h3>
                  <p className="mp-empty-text">
                    Nema majstora koji odgovaraju vašoj pretrazi. Pokušajte s drugim filterima.
                  </p>
                  <button onClick={clearFilters} className="mp-btn-secondary">
                    Obriši filtere
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {professionals.map((prof) => (
                    <Link
                      key={prof.slug}
                      to={`/majstor/${prof.slug}`}
                      className="mp-professional-card"
                      data-testid="professional-card"
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

                        {prof.bio && (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-4">{prof.bio}</p>
                        )}

                        <div className="mp-card-footer">
                          <span className="mp-card-reviews">{prof.review_count} recenzija</span>
                          <div className="flex items-center gap-3">
                            {prof.starting_price > 0 && (
                              <span className="mp-card-price">
                                <span>Od </span>{prof.starting_price.toFixed(2)} EUR
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          className="mp-btn-primary w-full mt-4"
                          data-testid="book-professional-button"
                        >
                          Zakaži termin
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;
