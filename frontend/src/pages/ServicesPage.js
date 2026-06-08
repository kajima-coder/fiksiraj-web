import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import ServiceIcon from '@/components/ServiceIcon';
import { Plus, Pencil, Trash2, Clock, Euro, X, Briefcase } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 sm:pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <h1 className="mp-page-title" data-testid="services-title">Moje usluge</h1>
              <p className="text-base text-gray-500">Upravljajte uslugama koje nudite klijentima</p>
            </div>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="mp-btn-primary w-full sm:w-auto"
                data-testid="add-service-button"
              >
                <Plus className="w-5 h-5" />
                <span>Dodaj uslugu</span>
              </button>
            )}
          </div>

          {/* Add/Edit Service Form */}
          {isAdding && (
            <div className="mp-info-card mb-8" style={{ padding: '28px' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
                    {editingId ? <Pencil className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900" style={{fontFamily: "'Sora', sans-serif"}}>
                    {editingId ? 'Uredi uslugu' : 'Nova usluga'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="mp-form-group" style={{ marginBottom: '20px' }}>
                  <label className="mp-form-label">Naziv usluge</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Popravak slavine"
                    className="mp-form-input"
                    data-testid="service-name-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="mp-form-group" style={{ marginBottom: '0' }}>
                    <label className="mp-form-label">Trajanje (minute)</label>
                    <div className="mp-form-input-icon">
                      <Clock />
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                        placeholder="60"
                        className="mp-form-input"
                        data-testid="service-duration-input"
                      />
                    </div>
                  </div>
                  <div className="mp-form-group" style={{ marginBottom: '0' }}>
                    <label className="mp-form-label">Cijena (EUR)</label>
                    <div className="mp-form-input-icon">
                      <Euro />
                      <input
                        type="number"
                        step="0.01"
                        required
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="50.00"
                        className="mp-form-input"
                        data-testid="service-price-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    type="submit"
                    className="mp-btn-primary"
                    data-testid="save-service-button"
                  >
                    {editingId ? 'Spremi promjene' : 'Dodaj uslugu'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="mp-btn-secondary"
                    data-testid="cancel-service-button"
                  >
                    Odustani
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Services List */}
          <div className="mp-info-card" style={{ padding: '28px' }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900" style={{fontFamily: "'Sora', sans-serif"}}>Katalog usluga</h2>
                <p className="text-sm text-gray-500">{services.length} {services.length === 1 ? 'usluga' : 'usluga'}</p>
              </div>
            </div>

            {services.length === 0 ? (
              <div className="mp-empty-state" style={{ padding: '48px 24px' }}>
                <div className="mp-empty-icon" style={{ width: '80px', height: '80px', marginBottom: '20px' }}>
                  <Briefcase style={{ width: '36px', height: '36px' }} />
                </div>
                <h3 className="mp-empty-title" style={{ fontSize: '20px' }} data-testid="no-services-message">
                  Nemate nijednu uslugu
                </h3>
                <p className="mp-empty-text" style={{ fontSize: '14px', marginBottom: '0' }}>
                  Dodajte prvu uslugu klikom na gumb iznad.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="mp-service-card"
                    data-testid="service-card"
                  >
                    <div className="mp-service-header">
                      <ServiceIcon serviceName={service.name} size="lg" />
                      <div className="mp-service-info">
                        <h3 className="mp-service-name">{service.name}</h3>
                        <p className="mp-service-category">Usluga</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-4">
                        <div className="mp-service-detail">
                          <div className="mp-service-detail-icon">
                            <Clock />
                          </div>
                          <span className="mp-service-detail-text">{service.duration_minutes} min</span>
                        </div>
                      </div>
                      <div className="mp-service-price-tag">
                        {service.price.toFixed(2)} EUR
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="mp-btn-secondary flex-1"
                        data-testid="edit-service-button"
                      >
                        <Pencil className="w-4 h-4" />
                        Uredi
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="mp-btn-danger-outline flex-1"
                        data-testid="delete-service-button"
                      >
                        <Trash2 className="w-4 h-4" />
                        Obriši
                      </button>
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

export default ServicesPage;
