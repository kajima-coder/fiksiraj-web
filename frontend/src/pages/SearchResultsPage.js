import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star, MapPin, Euro } from 'lucide-react';
import axios from 'axios';
import { PROFESSIONS } from '@/constants';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
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
  };

  const clearFilters = () => {
    setFilters({ profession: '', city: '' });
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-4">
            <Link to="/" className="text-2xl font-extrabold text-primary tracking-tight">
              Fiksiraj
            </Link>
            <div className="flex items-center space-x-3">
              <Link to="/prijava">
                <Button variant="ghost" className="text-slate-600 font-semibold rounded-xl px-5 py-2.5">
                  Prijava
                </Button>
              </Link>
              <Link to="/registracija">
                <Button className="btn-primary">
                  Registracija
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="page-container">
        <div className="flex flex-col lg:flex-row gap-10">
          <aside className="lg:w-80 flex-shrink-0">
            <div className="card-base p-8 sticky top-28">
              <h2 className="text-xl font-bold tracking-tight mb-8">Filteri</h2>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="filter-profession" className="text-sm font-bold text-slate-700 mb-3 block">Zanimanje</Label>
                  <select
                    id="filter-profession"
                    value={filters.profession}
                    onChange={(e) => handleFilterChange('profession', e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl h-12 px-4 text-sm font-medium"
                    data-testid="filter-profession-select"
                  >
                    <option value="">Sva zanimanja</option>
                    {PROFESSIONS.map((prof) => (
                      <option key={prof} value={prof}>{prof}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="filter-city" className="text-sm font-bold text-slate-700 mb-3 block">Grad</Label>
                  <Input
                    id="filter-city"
                    type="text"
                    placeholder="Npr. Zagreb"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="w-full h-12 rounded-xl border-2"
                    data-testid="filter-city-input"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Button
                    onClick={applyFilters}
                    className="btn-primary w-full"
                    data-testid="apply-filters-button"
                  >
                    Primijeni filtere
                  </Button>
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="w-full font-semibold rounded-xl py-3 hover:bg-slate-50"
                    data-testid="clear-filters-button"
                  >
                    Obriši filtere
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-10">
              <h1 className="section-title mb-3" data-testid="search-results-title">
                Rezultati pretrage
              </h1>
              <p className="section-subtitle">
                Pronađeno {professionals.length} {professionals.length === 1 ? 'majstor' : 'majstora'}
              </p>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-4"></div>
                <p className="text-base text-slate-500">Učitavanje...</p>
              </div>
            ) : professionals.length === 0 ? (
              <div className="card-base p-16 text-center">
                <Star className="w-14 h-14 text-slate-300 mx-auto mb-5" />
                <p className="text-xl text-slate-600 mb-6" data-testid="no-results-message">
                  Nema rezultata za vašu pretragu.
                </p>
                <Button onClick={clearFilters} className="btn-secondary">
                  Obriši filtere
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {professionals.map((prof) => (
                  <div
                    key={prof.slug}
                    className="professional-card group"
                    data-testid="professional-card"
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold tracking-tight text-slate-900 group-hover:text-primary transition-colors duration-300">{prof.name}</h3>
                          <p className="text-base font-semibold text-primary mt-1">{prof.profession}</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-bold text-amber-700">{prof.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                        <MapPin className="w-4 h-4" />
                        <span>{prof.city}</span>
                        <span className="text-slate-300">•</span>
                        <span>{prof.review_count} recenzija</span>
                      </div>
                      
                      {prof.bio && (
                        <p className="text-sm text-slate-500 mb-5 line-clamp-2 flex-grow">{prof.bio}</p>
                      )}
                      
                      <div className="flex items-center justify-between pt-5 border-t border-slate-100 mt-auto">
                        {prof.starting_price > 0 ? (
                          <div className="flex items-center gap-1.5 text-primary">
                            <Euro className="w-5 h-5" />
                            <span className="text-lg font-bold">Od {prof.starting_price.toFixed(2)} EUR</span>
                          </div>
                        ) : (
                          <div></div>
                        )}
                        <Link to={`/majstor/${prof.slug}`}>
                          <Button
                            className="btn-primary"
                            data-testid="book-professional-button"
                          >
                            Zakaži termin
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;
