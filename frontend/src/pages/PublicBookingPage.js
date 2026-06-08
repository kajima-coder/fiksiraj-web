import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { CheckCircle, Phone, Clock, Euro, Star, FileText, MapPin, ArrowLeft, User, Mail, CalendarDays, Sparkles } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="mp-info-card text-center max-w-md" style={{ padding: '48px 32px' }}>
          <div className="mp-empty-icon mx-auto" style={{ width: '80px', height: '80px', marginBottom: '24px' }}>
            <User style={{ width: '36px', height: '36px' }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3" style={{fontFamily: "'Sora', sans-serif"}}>Profesionalac nije pronađen</h1>
          <p className="text-base text-gray-500 mb-6">Provjerite link i pokušajte ponovo.</p>
          <Link to="/">
            <button className="mp-btn-primary">Natrag na početnu</button>
          </Link>
        </div>
      </div>
    );
  }

  // Success Screen
  if (bookingStep === 4 && booking) {
    const handleNewBooking = () => {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="mp-info-card max-w-md w-full text-center" style={{ padding: '40px 32px' }}>
          <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3" style={{fontFamily: "'Sora', sans-serif"}} data-testid="booking-success-title">
            Rezervacija uspješna!
          </h1>
          <p className="text-gray-500 mb-6">
            Vaša rezervacija je poslana. Majstor će je uskoro potvrditi.
          </p>
          
          <div className="bg-blue-50 rounded-xl p-4 mb-6 flex items-center justify-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700 font-medium">Biti ćete obaviješteni e-mailom kada majstor prihvati ili odbije rezervaciju.</span>
          </div>
          
          {/* Booking Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-left space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Usluga</p>
                <p className="text-base font-bold text-gray-900">{booking.service_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Datum i vrijeme</p>
                <p className="text-base font-medium text-gray-700">
                  {format(new Date(booking.booking_datetime), 'PPP p', { locale: hr })}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <span className="mp-booking-status mp-booking-status-pending">Na čekanju</span>
              <span className="bg-black text-white px-4 py-2 rounded-full text-sm font-bold">{booking.service_price.toFixed(2)} EUR</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2 mb-8">
            <Phone className="w-4 h-4" />
            {professional.phone}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/" className="flex-1">
              <button className="mp-btn-primary w-full" data-testid="back-to-home-button">
                Nazad na početnu
              </button>
            </Link>
            <button 
              onClick={handleNewBooking}
              className="mp-btn-secondary flex-1"
              data-testid="new-booking-button"
            >
              Nova rezervacija
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Link to="/" className="text-2xl sm:text-3xl font-bold text-black tracking-tight hover:opacity-80 transition-opacity" style={{fontFamily: "'Sora', sans-serif"}}>
              Fiksiraj
            </Link>
          </div>
        </div>
      </nav>

      {/* Professional Profile Header */}
      <div className="mp-profile-header pt-20">
        <div className="mp-profile-avatar">
          {professional.name.charAt(0)}
        </div>
        <h1 className="mp-profile-name" data-testid="professional-name">{professional.name}</h1>
        <p className="mp-profile-profession">{professional.profession}</p>
        
        <div className="flex items-center justify-center gap-2 text-white/60 mb-4">
          <MapPin className="w-4 h-4" />
          <span>{professional.city}</span>
        </div>
        
        <div className="mp-profile-rating">
          <Star />
          <span className="mp-profile-rating-score">{professional.rating.toFixed(1)}</span>
          <span className="mp-profile-rating-count">({professional.review_count} recenzija)</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bio */}
        {professional.bio && (
          <div className="mp-info-card mb-6" style={{ padding: '24px' }}>
            <p className="text-gray-700 leading-relaxed">{professional.bio}</p>
            <p className="text-sm text-gray-500 mt-4 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {professional.phone}
            </p>
          </div>
        )}

        {/* Reviews */}
        {professional.reviews && professional.reviews.length > 0 && (
          <div className="mp-info-card mb-6" style={{ padding: '24px' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900" style={{fontFamily: "'Sora', sans-serif"}}>Recenzije</h2>
                <p className="text-sm text-gray-500">{professional.review_count} ocjena</p>
              </div>
            </div>
            <div className="space-y-4">
              {professional.reviews.map((review) => (
                <div key={review.id} className="mp-review-item" data-testid="review-item">
                  <div className="mp-review-header">
                    <div className="mp-review-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}
                        />
                      ))}
                    </div>
                    <span className="mp-review-author">{review.client_name}</span>
                    <span className="mp-review-date">
                      • {format(new Date(review.created_at), 'PP', { locale: hr })}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mp-review-text">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Select Service */}
        {bookingStep === 1 && (
          <div className="mp-info-card" style={{ padding: '24px' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900" style={{fontFamily: "'Sora', sans-serif"}}>Odaberite uslugu</h2>
                <p className="text-sm text-gray-500">Korak 1 od 3</p>
              </div>
            </div>

            {professional.services.length === 0 ? (
              <div className="mp-empty-state" style={{ padding: '32px 16px' }}>
                <div className="mp-empty-icon" style={{ width: '64px', height: '64px', marginBottom: '16px' }}>
                  <Clock style={{ width: '28px', height: '28px' }} />
                </div>
                <p className="text-gray-500">Trenutno nema dostupnih usluga.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {professional.services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="w-full text-left p-5 bg-gray-50 border-2 border-transparent rounded-xl hover:border-gray-200 hover:bg-white transition-all"
                    data-testid="service-option"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1" style={{fontFamily: "'Sora', sans-serif"}}>{service.name}</h3>
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{service.duration_minutes} minuta</span>
                        </div>
                      </div>
                      <span className="bg-black text-white px-4 py-2 rounded-full text-sm font-bold">{service.price.toFixed(2)} EUR</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {bookingStep >= 2 && selectedService && (
          <div className="mp-info-card" style={{ padding: '24px' }}>
            <button
              onClick={() => {
                setBookingStep(1);
                setSelectedService(null);
                setSelectedSlot(null);
              }}
              className="text-sm text-blue-600 hover:underline font-semibold flex items-center gap-2 mb-5"
              data-testid="back-to-services"
            >
              <ArrowLeft className="w-4 h-4" />
              Natrag na usluge
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900" style={{fontFamily: "'Sora', sans-serif"}}>Odaberite termin</h2>
                <p className="text-sm text-gray-500">Korak 2 od 3 • {selectedService.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="mp-form-label mb-3">Odaberite datum</p>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
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
                <p className="mp-form-label mb-3">Dostupni termini</p>
                {availableSlots.length === 0 ? (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center" data-testid="no-slots-message">
                    <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Nema dostupnih termina</p>
                    <p className="text-sm text-gray-400 mt-1">Pokušajte odabrati drugi datum.</p>
                  </div>
                ) : (
                  <div className="mp-time-slots">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => handleSlotSelect(slot)}
                        className={`mp-time-slot ${selectedSlot === slot ? 'mp-time-slot-selected' : ''}`}
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
          <div className="mp-info-card mt-6" style={{ padding: '24px' }}>
            <div className="bg-blue-50 rounded-xl p-4 mb-6 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">Rezervacija ne zahtijeva registraciju. Unesite svoje podatke ispod.</span>
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900" style={{fontFamily: "'Sora', sans-serif"}}>Vaši podaci</h2>
                <p className="text-sm text-gray-500">Korak 3 od 3 • Završite rezervaciju</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmitBooking} className="space-y-5">
              <div className="mp-form-group" style={{ marginBottom: '20px' }}>
                <label className="mp-form-label">
                  Ime i prezime <span className="text-red-500">*</span>
                </label>
                <div className="mp-form-input-icon">
                  <User />
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Marko Marković"
                    className="mp-form-input"
                    data-testid="client-name-input"
                  />
                </div>
              </div>

              <div className="mp-form-group" style={{ marginBottom: '20px' }}>
                <label className="mp-form-label">
                  Telefon <span className="text-red-500">*</span>
                </label>
                <div className="mp-form-input-icon">
                  <Phone />
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+385 91 234 5678"
                    className="mp-form-input"
                    data-testid="client-phone-input"
                  />
                </div>
              </div>

              <div className="mp-form-group" style={{ marginBottom: '20px' }}>
                <label className="mp-form-label">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="mp-form-input-icon">
                  <Mail />
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="marko@example.com"
                    className="mp-form-input"
                    data-testid="client-email-input"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Na ovu adresu ćete dobiti potvrdu rezervacije
                </p>
              </div>

              <div className="mp-form-group" style={{ marginBottom: '20px' }}>
                <label className="mp-form-label flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Opišite problem (nije obavezno)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Npr. Kada je pukla na rubu, treba popravak ili zamjena..."
                  className="mp-form-input min-h-[120px] resize-none"
                  data-testid="description-input"
                />
              </div>
              
              {/* Booking Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sažetak rezervacije</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Usluga:</span>
                  <span className="text-sm font-bold text-gray-900">{selectedService.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Datum i vrijeme:</span>
                  <span className="text-sm font-bold text-gray-900">
                    {format(new Date(selectedSlot), 'PPP p', { locale: hr })}
                  </span>
                </div>
                <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                  <span className="font-bold text-gray-700">Cijena:</span>
                  <span className="bg-black text-white px-4 py-2 rounded-full text-base font-bold">{selectedService.price.toFixed(2)} EUR</span>
                </div>
              </div>
              
              <button
                type="submit"
                className="mp-btn-success w-full"
                data-testid="submit-booking-button"
              >
                <CheckCircle className="w-5 h-5" />
                Potvrdi rezervaciju
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicBookingPage;
