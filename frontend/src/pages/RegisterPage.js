import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CITIES, PROFESSIONS } from '@/constants';
import { User, Briefcase, MapPin, Phone, Mail, Lock, ArrowRight, FileText, Building2, Eye, EyeOff } from 'lucide-react';

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
      newErrors.companyName = 'Naziv firme je obavezan';
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
      // Pass 'HR' as default country (Croatia)
      await register(formData.name, formData.profession, 'HR', formData.city, formData.bio, formData.phone, formData.email, formData.password);
      toast.success('Uspješna registracija!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Greška pri registraciji');
    } finally {
      setLoading(false);
    }
  };

  // Required field label component
  const RequiredLabel = ({ htmlFor, children }) => (
    <Label htmlFor={htmlFor} className="form-label">
      {children} <span className="text-red-500">*</span>
    </Label>
  );

  return (
    <div className="min-h-screen app-background flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-block">
            <h1 className="text-5xl font-bold text-primary tracking-tight mb-3 hover:scale-105 transition-transform" style={{fontFamily: "'Sora', sans-serif"}}>Fiksiraj</h1>
          </Link>
          <p className="text-lg text-slate-400 font-medium">Registrirajte se kao profesionalac</p>
        </div>

        {/* Registration Card */}
        <div className="hero-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Info Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Ime i prezime - Required */}
              <div className="sm:col-span-2">
                <RequiredLabel htmlFor="name">Ime i prezime</RequiredLabel>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    className={`form-input pl-12 ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Ivan Horvat"
                    data-testid="register-name-input"
                  />
                </div>
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Naziv firme - NEW Required field */}
              <div className="sm:col-span-2">
                <RequiredLabel htmlFor="companyName">Naziv firme</RequiredLabel>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="companyName"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => {
                      setFormData({ ...formData, companyName: e.target.value });
                      if (errors.companyName) setErrors({ ...errors, companyName: '' });
                    }}
                    className={`form-input pl-12 ${errors.companyName ? 'border-red-500' : ''}`}
                    placeholder="Naziv vaše firme ili obrta"
                    data-testid="register-company-input"
                  />
                </div>
                {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
              </div>

              {/* Zanimanje */}
              <div className="sm:col-span-2">
                <Label htmlFor="profession" className="form-label">Zanimanje</Label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10 pointer-events-none hidden sm:block" />
                  <select
                    id="profession"
                    required
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    className="form-input sm:pl-12 pl-4 w-full cursor-pointer"
                    data-testid="register-profession-input"
                  >
                    <option value="">Odaberite zanimanje</option>
                    {PROFESSIONS.map((prof) => (
                      <option key={prof} value={prof}>{prof}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grad - Full width now (no country field) */}
              <div className="sm:col-span-2">
                <Label htmlFor="city" className="form-label">Grad</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10 pointer-events-none hidden sm:block" />
                  <select
                    id="city"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="form-input sm:pl-12 pl-4 w-full cursor-pointer"
                    data-testid="register-city-input"
                  >
                    <option value="">Odaberite grad</option>
                    {CITIES['HR']?.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Kratak opis */}
            <div>
              <Label htmlFor="bio" className="form-label">Kratak opis</Label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                <Textarea
                  id="bio"
                  required
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="form-textarea pl-12 min-h-[100px]"
                  placeholder="Iskustvo, specijalizacija..."
                  rows={3}
                  data-testid="register-bio-input"
                />
              </div>
            </div>

            {/* Telefon - Required */}
            <div>
              <RequiredLabel htmlFor="phone">Telefon</RequiredLabel>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  className={`form-input pl-12 ${errors.phone ? 'border-red-500' : ''}`}
                  placeholder="+385 91 234 5678"
                  data-testid="register-phone-input"
                />
              </div>
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            {/* Email - Required */}
            <div>
              <RequiredLabel htmlFor="email">Email</RequiredLabel>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  className={`form-input pl-12 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="ivan@example.com"
                  data-testid="register-email-input"
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Lozinka */}
            <div>
              <Label htmlFor="password" className="form-label">Lozinka</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="form-input pl-12 pr-12"
                  placeholder="••••••••"
                  data-testid="register-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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

            <Button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
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
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Već imate račun?{' '}
              <Link to="/prijava" className="text-primary font-bold hover:underline" data-testid="login-link">
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
