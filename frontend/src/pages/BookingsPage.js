import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, XCircle, Clock, User, Phone, Euro, Trash2, FileText, Briefcase } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings`);
      setBookings(response.data);
    } catch (error) {
      toast.error('Greška pri učitavanju rezervacija');
    }
  };

  const handleConfirm = async (id) => {
    try {
      await axios.put(`${API}/bookings/${id}/confirm`);
      toast.success('Rezervacija potvrđena!');
      fetchBookings();
    } catch (error) {
      toast.error('Greška pri potvrđivanju rezervacije');
    }
  };

  const handleComplete = async (id) => {
    try {
      await axios.put(`${API}/bookings/${id}/complete`);
      toast.success('Rezervacija označena kao završena!');
      fetchBookings();
    } catch (error) {
      toast.error('Greška pri označavanju rezervacije');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Jeste li sigurni da želite otkazati ovu rezervaciju?')) return;
    try {
      await axios.put(`${API}/bookings/${id}/cancel`);
      toast.success('Rezervacija otkazana!');
      fetchBookings();
    } catch (error) {
      toast.error('Greška pri otkazivanju rezervacije');
    }
  };

  const handleDelete = async (id, status) => {
    const message = status === 'cancelled' 
      ? 'Jeste li sigurni da želite ukloniti ovu otkazanu rezervaciju?' 
      : 'Jeste li sigurni da želite ukloniti ovu završenu rezervaciju?';
    if (!window.confirm(message)) return;
    try {
      await axios.delete(`${API}/bookings/${id}`);
      toast.success('Rezervacija uklonjena!');
      fetchBookings();
    } catch (error) {
      toast.error('Greška pri uklanjanju rezervacije');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  return (
    <div className="min-h-screen app-background">
      <Navbar />
      <div className="page-container">
        {/* Page Header */}
        <div className="mb-12 sm:mb-16">
          <h1 className="section-title mb-4" data-testid="bookings-title">
            Rezervacije
          </h1>
          <p className="section-subtitle">Pregledajte i upravljajte svim rezervacijama</p>
        </div>

        {/* Filter Tabs - Modern Pills */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-10 sm:mb-12">
          <div className="flex gap-2 sm:gap-3 min-w-max sm:min-w-0 sm:flex-wrap pb-2 sm:pb-0">
            <button
              onClick={() => setFilter('all')}
              className={`filter-btn whitespace-nowrap ${filter === 'all' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
              data-testid="filter-all"
            >
              Sve
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`filter-btn whitespace-nowrap ${filter === 'pending' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
              data-testid="filter-pending"
            >
              Na čekanju
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`filter-btn whitespace-nowrap ${filter === 'confirmed' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
              data-testid="filter-confirmed"
            >
              Potvrđene
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`filter-btn whitespace-nowrap ${filter === 'cancelled' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
              data-testid="filter-cancelled"
            >
              Otkazane
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`filter-btn whitespace-nowrap ${filter === 'completed' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
              data-testid="filter-completed"
            >
              Završene
            </button>
          </div>
        </div>

        {/* Booking Cards */}
        <div className="space-y-6 sm:space-y-8">
          {filteredBookings.length === 0 ? (
            <div className="card-elevated p-12 sm:p-20 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-xl text-slate-400 font-medium" data-testid="no-bookings-message">
                {filter === 'all' 
                  ? 'Nemate nijednu rezervaciju.' 
                  : filter === 'pending'
                  ? 'Nemate nijednu rezervaciju na čekanju.'
                  : filter === 'confirmed'
                  ? 'Nemate nijednu potvrđenu rezervaciju.'
                  : filter === 'cancelled'
                  ? 'Nemate nijednu otkazanu rezervaciju.'
                  : 'Nemate nijednu završenu rezervaciju.'}
              </p>
              <p className="text-sm text-slate-300 mt-2">Podijelite svoj link da biste dobili prve klijente!</p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="booking-card"
                data-testid="booking-card"
              >
                {/* Card Header - Service & Status */}
                <div className="booking-header">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <Briefcase className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900" style={{fontFamily: "'Sora', sans-serif"}}>{booking.service_name}</h3>
                        <p className="text-sm text-slate-400 mt-0.5">
                          {format(new Date(booking.booking_datetime), 'PPP', { locale: hr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Price Tag - Prominent */}
                      <div className="price-tag">
                        <Euro className="w-5 h-5" />
                        <span>{booking.service_price.toFixed(2)} EUR</span>
                      </div>
                      {/* Status Badge */}
                      {booking.status === 'pending' && (
                        <span className="status-badge status-pending">
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                          Na čekanju
                        </span>
                      )}
                      {booking.status === 'confirmed' && (
                        <span className="status-badge status-confirmed">
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                          Potvrđeno
                        </span>
                      )}
                      {booking.status === 'cancelled' && (
                        <span className="status-badge status-cancelled">
                          <XCircle className="w-3.5 h-3.5 mr-1.5" />
                          Otkazano
                        </span>
                      )}
                      {booking.status === 'completed' && (
                        <span className="status-badge status-completed">
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                          Završeno
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body - Client & Details */}
                <div className="booking-body">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Client Info */}
                    <div className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-2xl">
                      <div className="w-11 h-11 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Klijent</p>
                        <p className="text-base font-bold text-slate-900 truncate">{booking.client_name}</p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-2xl">
                      <div className="w-11 h-11 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Telefon</p>
                        <p className="text-base font-medium text-slate-700">{booking.client_phone}</p>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-2xl">
                      <div className="w-11 h-11 bg-gradient-to-br from-violet-100 to-violet-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Vrijeme</p>
                        <p className="text-base font-medium text-slate-700">
                          {format(new Date(booking.booking_datetime), 'HH:mm')} • {booking.service_duration} min
                        </p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-2xl">
                      <div className="w-11 h-11 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Datum</p>
                        <p className="text-base font-medium text-slate-700">
                          {format(new Date(booking.booking_datetime), 'EEEE', { locale: hr })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description Box - Prominent */}
                  {booking.description && (
                    <div className="description-box mt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        <p className="text-sm font-black text-emerald-700 uppercase tracking-wider">Opis problema</p>
                      </div>
                      <p className="text-base text-slate-700 leading-relaxed">{booking.description}</p>
                    </div>
                  )}
                </div>

                {/* Card Footer - Actions */}
                <div className="booking-footer">
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    {booking.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleConfirm(booking.id)}
                          className="btn-success flex items-center gap-2"
                          data-testid="confirm-booking-button"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Potvrdi</span>
                        </Button>
                        <Button
                          onClick={() => handleCancel(booking.id)}
                          className="btn-outline-danger flex items-center gap-2"
                          data-testid="cancel-booking-button"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Otkaži</span>
                        </Button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <Button
                        onClick={() => handleComplete(booking.id)}
                        className="btn-primary flex items-center gap-2"
                        data-testid="complete-booking-button"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Označi završeno</span>
                      </Button>
                    )}
                    {(booking.status === 'completed' || booking.status === 'cancelled') && (
                      <Button
                        onClick={() => handleDelete(booking.id, booking.status)}
                        className="btn-outline-danger flex items-center gap-2"
                        data-testid="delete-booking-button"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Ukloni</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingsPage;
