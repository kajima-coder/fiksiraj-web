import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { CheckCircle, Phone, Clock, Euro, Star, FileText, MapPin, ArrowLeft, User, Mail, Sparkles, CalendarDays } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { hr } from 'date-fns/locale';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PublicBookingPage = () => {
  const { slug } = useParams();
  const [professional, setProfessional] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [description, setDescription] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState(1);

  useEffect(() => {
    fetchProfessional();
  }, [slug]);

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedService, selectedDate]);

  const fetchProfessional = async () => {
    try {
      const response = await axios.get(`${API}/public/${slug}`);
      setProfessional(response.data);
    } catch (error) {
      toast.error('Profesionalac nije pronađen');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await axios.get(`${API}/public/${slug}/available-slots`, {
        params: {
          date: dateStr,
          service_id: selectedService.id,
        },
      });
      setAvailableSlots(response.data.slots);
      setSelectedSlot(null);
    } catch (error) {
      toast.error('Greška pri učitavanju dostupnih termina');
    }
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setBookingStep(2);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setBookingStep(3);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/public/${slug}/book`, {
        service_id: selectedService.id,
        booking_datetime: selectedSlot,
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail || null,
        description: description || null,
      });
      setBooking(response.data);
      toast.success('Rezervacija uspješno kreirana!');
      setBookingStep(4);
    } catch (error) {
      toast.error('Greška pri kreiranju rezervacije');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center px-4">
        <div className="hero-card text-center max-w-md">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-slate-300" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2" style={{fontFamily: "'Sora', sans-serif"}}>Profesionalac nije pronađen</h1>
          <p className="text-base text-slate-500 mb-6">Provjerite link i pokušajte ponovo.</p>
          <Link to="/">
            <Button className="btn-primary">Natrag na početnu</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Success Screen
  if (bookingStep === 4 && booking) {
    const handleNewBooking = () => {
      // Reset all booking state
      setSelectedService(null);
      setSelectedSlot(null);
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setDescription('');
      setBooking(null);
      setBookingStep(1);
    };

    return (
      <div className="min-h-screen app-background flex items-center justify-center px-4 py-12">
        <div className="hero-card max-w-md w-full text-center relative overflow-hidden">
          {/* Success gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600"></div>
          
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
            <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-3" style={{fontFamily: "'Sora', sans-serif"}} data-testid="booking-success-title">
            Rezervacija uspješna!
          </h1>
          <p className="section-subtitle mb-6">
            Vaša rezervacija je poslana. Majstor će je uskoro potvrditi.
          </p>
          <div className="bg-gradient-to-r from-blue-50 to-primary/5 border border-blue-200/50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-blue-800 font-medium flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              Biti ćete obaviješteni e-mailom kada majstor prihvati ili odbije rezervaciju.
            </p>
          </div>
          
          {/* Booking Summary */}
          <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 text-left space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-blue-200 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usluga</p>
                <p className="text-base font-bold text-slate-900">{booking.service_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-violet-200 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Datum i vrijeme</p>
                <p className="text-base font-medium text-slate-700">
                  {format(new Date(booking.booking_datetime), 'PPP p', { locale: hr })}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="status-badge status-pending">Na čekanju potvrde</span>
              <span className="price-tag">{booking.service_price.toFixed(2)} EUR</span>
            </div>
          </div>
          
          <p className="text-sm text-slate-500 flex items-center justify-center gap-2 mb-8">
            <Phone className="w-4 h-4" />
            {professional.phone}
          </p>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/" className="flex-1">
              <Button 
                className="btn-primary w-full" 
                data-testid="back-to-home-button"
              >
                Nazad na početnu
              </Button>
            </Link>
            <Button 
              onClick={handleNewBooking}
              className="btn-secondary flex-1"
              data-testid="new-booking-button"
            >
              Nova rezervacija
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Link to="/" className="text-2xl sm:text-3xl font-bold text-primary tracking-tight hover:scale-105 transition-transform" style={{fontFamily: "'Sora', sans-serif"}}>
              Fiksiraj
            </Link>
          </div>
        </div>
      </nav>

      <div className="page-container max-w-5xl">
        {/* Professional Profile Card */}
        <div className="card-elevated mb-10 relative overflow-hidden">
          {/* Gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-violet-500"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary to-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
              <span className="text-3xl sm:text-4xl font-black text-white">{professional.name.charAt(0)}</span>
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2" style={{fontFamily: "'Sora', sans-serif"}} data-testid="professional-name">
                {professional.name}
              </h1>
              <p className="text-lg font-bold text-primary mb-1">{professional.profession}</p>
              <p className="text-base text-slate-500 flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4" />
                {professional.city}
              </p>
              {professional.bio && (
                <p className="text-base text-slate-600 leading-relaxed mb-5">{professional.bio}</p>
              )}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 px-4 py-2 rounded-full">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span className="font-black text-amber-700">{professional.rating.toFixed(1)}</span>
                  <span className="text-sm text-amber-600">({professional.review_count} recenzija)</span>
                </div>
                <p className="text-base text-slate-600 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{professional.phone}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {professional.reviews && professional.reviews.length > 0 && (
          <div className="card-elevated mb-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight" style={{fontFamily: "'Sora', sans-serif"}}>Recenzije</h2>
                <p className="text-sm text-slate-400">{professional.review_count} ocjena od klijenata</p>
              </div>
            </div>
            <div className="space-y-6">
              {professional.reviews.map((review) => (
                <div key={review.id} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100" data-testid="review-item">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{review.client_name}</span>
                    <span className="text-sm text-slate-400">
                      • {format(new Date(review.created_at), 'PP', { locale: hr })}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-base text-slate-600">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Select Service */}
        {bookingStep === 1 && (
          <div className="card-elevated">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight" style={{fontFamily: "'Sora', sans-serif"}}>Odaberite uslugu</h2>
                <p className="text-sm text-slate-400">Korak 1 od 3</p>
              </div>
            </div>
            {professional.services.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-lg text-slate-400 font-medium">Trenutno nema dostupnih usluga.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {professional.services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="group text-left p-6 bg-white/80 border-2 border-slate-100 rounded-3xl hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                    data-testid="service-option"
                  >
                    <h3 className="text-xl font-semibold tracking-tight text-slate-900 mb-4 group-hover:text-primary transition-colors" style={{fontFamily: "'Sora', sans-serif"}}>{service.name}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">{service.duration_minutes} minuta</span>
                      </div>
                      <span className="price-tag">{service.price.toFixed(2)} EUR</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {bookingStep >= 2 && selectedService && (
          <div className="card-elevated">
            <div className="mb-6">
              <button
                onClick={() => {
                  setBookingStep(1);
                  setSelectedService(null);
                  setSelectedSlot(null);
                }}
                className="text-sm text-primary hover:underline font-bold flex items-center gap-2"
                data-testid="back-to-services"
              >
                <ArrowLeft className="w-4 h-4" />
                Natrag na usluge
              </button>
            </div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight" style={{fontFamily: "'Sora', sans-serif"}}>Odaberite termin</h2>
                <p className="text-sm text-slate-400">Korak 2 od 3 • {selectedService.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <Label className="form-label mb-4 block">Odaberite datum</Label>
                <div className="bg-white/80 rounded-2xl border-2 border-slate-100 p-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-xl"
                    locale={hr}
                  />
                </div>
              </div>

              <div>
                <Label className="form-label mb-4 block">Dostupni termini</Label>
                {availableSlots.length === 0 ? (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center" data-testid="no-slots-message">
                    <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-base text-slate-500 font-medium">Nema dostupnih termina za odabrani datum.</p>
                    <p className="text-sm text-slate-400 mt-1">Pokušajte odabrati drugi datum.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto p-1">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => handleSlotSelect(slot)}
                        className={`rounded-2xl p-3 text-sm font-bold transition-all duration-300 ${
                          selectedSlot === slot
                            ? 'bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/30 scale-105'
                            : 'bg-white/80 text-slate-700 border-2 border-slate-100 hover:border-primary/30 hover:bg-primary/5'
                        }`}
                        data-testid="time-slot"
                      >
                        {format(new Date(slot), 'HH:mm')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Client Details Form */}
        {bookingStep === 3 && selectedSlot && (
          <div className="card-elevated mt-8 relative overflow-hidden">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600"></div>
            
            <div className="bg-gradient-to-r from-blue-50 to-primary/5 border border-blue-200/50 rounded-2xl p-4 mb-8">
              <p className="text-sm text-blue-800 font-medium text-center flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                Rezervacija ne zahtijeva registraciju. Unesite svoje podatke ispod.
              </p>
            </div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight" style={{fontFamily: "'Sora', sans-serif"}}>Vaši podaci</h2>
                <p className="text-sm text-slate-400">Korak 3 od 3 • Završite rezervaciju</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmitBooking} className="space-y-5">
              <div>
                <Label htmlFor="client-name" className="form-label">
                  Ime i prezime <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="client-name"
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Marko Marković"
                    className="form-input pl-12"
                    data-testid="client-name-input"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="client-phone" className="form-label">
                  Telefon <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="client-phone"
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+385 91 234 5678"
                    className="form-input pl-12"
                    data-testid="client-phone-input"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="client-email" className="form-label">
                  Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="client-email"
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="marko@example.com"
                    className="form-input pl-12"
                    data-testid="client-email-input"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Na ovu adresu ćete dobiti potvrdu rezervacije
                </p>
              </div>
              <div>
                <Label htmlFor="description" className="form-label flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Opišite problem (nije obavezno)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Npr. Kada je pukla na rubu, treba popravak ili zamjena..."
                  className="form-textarea min-h-[120px]"
                  data-testid="description-input"
                />
              </div>
              
              {/* Booking Summary */}
              <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 space-y-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Sažetak rezervacije</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Usluga:</span>
                  <span className="text-sm font-bold text-slate-900">{selectedService.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Datum i vrijeme:</span>
                  <span className="text-sm font-bold text-slate-900">
                    {format(new Date(selectedSlot), 'PPP p', { locale: hr })}
                  </span>
                </div>
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-base font-bold text-slate-700">Cijena:</span>
                  <span className="price-tag text-lg">{selectedService.price.toFixed(2)} EUR</span>
                </div>
              </div>
              
              <Button
                type="submit"
                className="btn-success w-full py-4 text-base"
                data-testid="submit-booking-button"
              >
                Potvrdi rezervaciju
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicBookingPage;
