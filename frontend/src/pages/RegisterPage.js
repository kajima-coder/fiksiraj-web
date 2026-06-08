import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { CITIES, PROFESSIONS } from '@/constants';
import { User, Briefcase, MapPin, Phone, Mail, Lock, ArrowRight, FileText, Building2, Eye, EyeOff } from 'lucide-react';
import { getErrorMessage } from '@/utils/errorUtils';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    profession: '',
    city: '',
    bio: '',
    phone: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Ime i prezime je obavezno';
    }
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Naziv firme ili obrta je obavezan';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email je obavezan';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon je obavezan';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Molimo ispunite sva obavezna polja');
      return;
    }
    
    setLoading(true);
    try {
      await register(formData.name, formData.profession, 'HR', formData.city, formData.bio, formData.phone, formData.email, formData.password);
      toast.success('Uspješna registracija!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Greška pri registraciji'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mp-auth-container" style={{ padding: '40px 20px' }}>
      <div className="mp-auth-card" style={{ maxWidth: '520px' }}>
        {/* Logo & Header */}
        <div className="mp-auth-logo">
          <Link to="/">
            <h1 className="hover:opacity-80 transition-opacity cursor-pointer">Fiksiraj</h1>
          </Link>
          <p>Registrirajte se kao profesionalac</p>
        </div>

        {/* Registration Card */}
        <div className="mp-auth-form-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Ime i prezime */}
            <div className="mp-form-group" style={{ marginBottom: '20px' }}>
              <label className="mp-form-label">
                Ime i prezime <span className="text-red-500">*</span>
              </label>
              <div className="mp-form-input-icon">
                <User />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  className={`mp-form-input ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Ivan Horvat"
                  data-testid="register-name-input"
                />
              </div>
              {errors.name && <p className="text-red-500 text-sm mt-2">{errors.name}</p>}
            </div>

            {/* Naziv firme */}
            <div className="mp-form-group" style={{ marginBottom: '20px' }}>
              <label className="mp-form-label">
                Naziv firme ili obrta <span className="text-red-500">*</span>
              </label>
              <div className="mp-form-input-icon">
                <Building2 />
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => {
                    setFormData({ ...formData, companyName: e.target.value });
                    if (errors.companyName) setErrors({ ...errors, companyName: '' });
                  }}
                  className={`mp-form-input ${errors.companyName ? 'border-red-500' : ''}`}
                  placeholder="Unesite naziv firme ili obrta"
                  data-testid="register-company-input"
                />
              </div>
              {errors.companyName && <p className="text-red-500 text-sm mt-2">{errors.companyName}</p>}
            </div>

            {/* Zanimanje */}
            <div className="mp-form-group" style={{ marginBottom: '20px' }}>
              <label className="mp-form-label">Zanimanje</label>
              <div className="mp-form-input-icon">
                <Briefcase className="hidden sm:block" />
                <select
                  required
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  className="mp-form-input w-full cursor-pointer sm:pl-14 pl-5"
                  data-testid="register-profession-input"
                >
                  <option value="">Odaberite zanimanje</option>
                  {PROFESSIONS.map((prof) => (
                    <option key={prof} value={prof}>{prof}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grad */}
            <div className="mp-form-group" style={{ marginBottom: '20px' }}>
              <label className="mp-form-label">Grad</label>
              <div className="mp-form-input-icon">
                <MapPin className="hidden sm:block" />
                <select
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mp-form-input w-full cursor-pointer sm:pl-14 pl-5"
                  data-testid="register-city-input"
                >
                  <option value="">Odaberite grad</option>
                  {CITIES['HR']?.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kratak opis */}
            <div className="mp-form-group" style={{ marginBottom: '20px' }}>
              <label className="mp-form-label">Kratak opis</label>
              <div className="mp-form-input-icon" style={{ alignItems: 'flex-start' }}>
                <FileText style={{ top: '22px', transform: 'none' }} />
                <textarea
                  required
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="mp-form-input min-h-[100px] resize-none"
                  style={{ paddingLeft: '56px' }}
                  placeholder="Iskustvo, specijalizacija..."
                  rows={3}
                  data-testid="register-bio-input"
                />
              </div>
            </div>

            {/* Telefon */}
            <div className="mp-form-group" style={{ marginBottom: '20px' }}>
              <label className="mp-form-label">
                Telefon <span className="text-red-500">*</span>
              </label>
              <div className="mp-form-input-icon">
                <Phone />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  className={`mp-form-input ${errors.phone ? 'border-red-500' : ''}`}
                  placeholder="+385 91 234 5678"
                  data-testid="register-phone-input"
                />
              </div>
              {errors.phone && <p className="text-red-500 text-sm mt-2">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div className="mp-form-group" style={{ marginBottom: '20px' }}>
              <label className="mp-form-label">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="mp-form-input-icon">
                <Mail />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  className={`mp-form-input ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="ivan@example.com"
                  data-testid="register-email-input"
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-2">{errors.email}</p>}
            </div>

            {/* Lozinka */}
            <div className="mp-form-group" style={{ marginBottom: '24px' }}>
              <label className="mp-form-label">Lozinka</label>
              <div className="mp-form-input-icon relative">
                <Lock />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mp-form-input"
                  style={{ paddingRight: '52px' }}
                  placeholder="••••••••"
                  data-testid="register-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mp-btn-primary w-full"
              disabled={loading}
              data-testid="register-submit-button"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Registriraj se</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mp-auth-footer">
            <p>
              Već imate račun?{' '}
              <Link to="/prijava" data-testid="login-link">
                Prijavite se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
