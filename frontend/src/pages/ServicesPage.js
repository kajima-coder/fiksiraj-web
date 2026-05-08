import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Clock, Euro, Briefcase, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    duration_minutes: '',
    price: '',
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      setServices(response.data);
    } catch (error) {
      toast.error('Greška pri učitavanju usluga');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API}/services/${editingId}`, formData);
        toast.success('Usluga ažurirana!');
      } else {
        await axios.post(`${API}/services`, formData);
        toast.success('Usluga dodana!');
      }
      setFormData({ name: '', duration_minutes: '', price: '' });
      setIsAdding(false);
      setEditingId(null);
      fetchServices();
    } catch (error) {
      toast.error('Greška pri spremanju usluge');
    }
  };

  const handleEdit = (service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      duration_minutes: service.duration_minutes,
      price: service.price,
    });
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati ovu uslugu?')) return;
    try {
      await axios.delete(`${API}/services/${id}`);
      toast.success('Usluga obrisana!');
      fetchServices();
    } catch (error) {
      toast.error('Greška pri brisanju usluge');
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', duration_minutes: '', price: '' });
  };

  return (
    <div className="min-h-screen app-background">
      <Navbar />
      <div className="page-container">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
          <div>
            <h1 className="section-title mb-4" data-testid="services-title">
              Moje usluge
            </h1>
            <p className="section-subtitle">Upravljajte uslugama koje nudite klijentima</p>
          </div>
          {!isAdding && (
            <Button
              onClick={() => setIsAdding(true)}
              className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
              data-testid="add-service-button"
            >
              <Plus className="w-5 h-5" />
              <span>Dodaj uslugu</span>
            </Button>
          )}
        </div>

        {/* Add/Edit Service Form */}
        {isAdding && (
          <div className="card-elevated mb-10 relative overflow-hidden">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-violet-500"></div>
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                  {editingId ? <Pencil className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{fontFamily: "'Sora', sans-serif"}}>
                  {editingId ? 'Uredi uslugu' : 'Nova usluga'}
                </h2>
              </div>
              <Button
                type="button"
                onClick={handleCancel}
                variant="ghost"
                className="w-10 h-10 p-0 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="form-label">Naziv usluge</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Popravak slavine"
                  className="form-input"
                  data-testid="service-name-input"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="duration" className="form-label">Trajanje (minute)</Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="duration"
                      type="number"
                      required
                      min="1"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                      placeholder="60"
                      className="form-input pl-12"
                      data-testid="service-duration-input"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="price" className="form-label">Cijena (EUR)</Label>
                  <div className="relative">
                    <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="50.00"
                      className="form-input pl-12"
                      data-testid="service-price-input"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-4">
                <Button
                  type="submit"
                  className="btn-primary"
                  data-testid="save-service-button"
                >
                  {editingId ? 'Spremi promjene' : 'Dodaj uslugu'}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary"
                  data-testid="cancel-service-button"
                >
                  Odustani
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Services List */}
        <div className="card-elevated">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{fontFamily: "'Sora', sans-serif"}}>Katalog usluga</h2>
              <p className="text-sm text-slate-400">{services.length} {services.length === 1 ? 'usluga' : 'usluga'}</p>
            </div>
          </div>

          {services.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-xl text-slate-400 font-medium" data-testid="no-services-message">
                Nemate nijednu uslugu.
              </p>
              <p className="text-sm text-slate-300 mt-2">Dodajte prvu uslugu klikom na gumb iznad.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="group relative bg-white/80 border-2 border-slate-100 rounded-3xl p-6 hover:border-primary/20 hover:shadow-xl transition-all duration-300"
                  data-testid="service-card"
                >
                  {/* Service Header */}
                  <h3 className="text-xl font-semibold tracking-tight text-slate-900 mb-5 pr-8 group-hover:text-primary transition-colors" style={{fontFamily: "'Sora', sans-serif"}}>
                    {service.name}
                  </h3>

                  {/* Service Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-9 h-9 bg-gradient-to-br from-violet-100 to-violet-200 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trajanje</p>
                        <p className="text-base font-semibold text-slate-700">{service.duration_minutes} minuta</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary/20 to-blue-200 rounded-lg flex items-center justify-center">
                        <Euro className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cijena</p>
                        <p className="text-lg font-bold text-primary" style={{fontFamily: "'Inter', sans-serif"}}>{service.price.toFixed(2)} EUR</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(service)}
                      className="btn-secondary flex items-center gap-2 flex-1 justify-center text-sm py-3"
                      data-testid="edit-service-button"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Uredi</span>
                    </Button>
                    <Button
                      onClick={() => handleDelete(service.id)}
                      className="btn-outline-danger flex items-center gap-2 flex-1 justify-center text-sm py-3"
                      data-testid="delete-service-button"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Obriši</span>
                    </Button>
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

export default ServicesPage;
