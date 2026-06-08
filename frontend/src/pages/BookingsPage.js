import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import UserAvatar from '@/components/UserAvatar';
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

  const filterTabs = [
    { key: 'all', label: 'Sve' },
    { key: 'pending', label: 'Na čekanju' },
    { key: 'confirmed', label: 'Potvrđene' },
    { key: 'cancelled', label: 'Otkazane' },
    { key: 'completed', label: 'Završene' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 sm:pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {/* Page Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="mp-page-title" data-testid="bookings-title">Rezervacije</h1>
            <p className="text-base text-gray-500">Pregledajte i upravljajte svim rezervacijama</p>
          </div>

          {/* Filter Tabs */}
          <div className="mp-filter-tabs">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`mp-filter-tab ${filter === tab.key ? 'mp-filter-tab-active' : ''}`}
                data-testid={`filter-${tab.key}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Booking Cards */}
          <div className="space-y-5">
            {filteredBookings.length === 0 ? (
              <div className="mp-info-card">
                <div className="mp-empty-state" style={{ padding: '48px 24px' }}>
                  <div className="mp-empty-icon" style={{ width: '80px', height: '80px', marginBottom: '20px' }}>
                    <Calendar style={{ width: '36px', height: '36px' }} />
                  </div>
                  <h3 className="mp-empty-title" style={{ fontSize: '20px' }} data-testid="no-bookings-message">
                    {filter === 'all' 
                      ? 'Nemate nijednu rezervaciju' 
                      : filter === 'pending'
                      ? 'Nemate rezervacija na čekanju'
                      : filter === 'confirmed'
                      ? 'Nemate potvrđenih rezervacija'
                      : filter === 'cancelled'
                      ? 'Nemate otkazanih rezervacija'
                      : 'Nemate završenih rezervacija'}
                  </h3>
                  <p className="mp-empty-text" style={{ fontSize: '14px', marginBottom: '0' }}>
                    Podijelite svoj link da biste dobili prve klijente!
                  </p>
                </div>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="mp-booking-card"
                  data-testid="booking-card"
                >
                  {/* Header */}
                  <div className="mp-booking-header">
                    <div className="mp-booking-date">
                      <div className="mp-booking-date-icon">
                        <Briefcase />
                      </div>
                      <div className="mp-booking-date-text">
                        <h4>{booking.service_name}</h4>
                        <p>{format(new Date(booking.booking_datetime), 'PPP', { locale: hr })}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="bg-black text-white px-4 py-2 rounded-full text-sm font-bold">
                        {booking.service_price.toFixed(2)} EUR
                      </span>
                      <span className={`mp-booking-status ${
                        booking.status === 'pending' ? 'mp-booking-status-pending' :
                        booking.status === 'confirmed' ? 'mp-booking-status-confirmed' :
                        booking.status === 'cancelled' ? 'mp-booking-status-cancelled' :
                        'mp-booking-status-completed'
                      }`}>
                        {booking.status === 'pending' && 'Na čekanju'}
                        {booking.status === 'confirmed' && 'Potvrđeno'}
                        {booking.status === 'cancelled' && 'Otkazano'}
                        {booking.status === 'completed' && 'Završeno'}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="mp-booking-body">
                    <div className="mp-booking-client">
                      <UserAvatar name={booking.client_name} size="lg" />
                      <div className="mp-booking-client-info">
                        <h4>{booking.client_name}</h4>
                        <p>{booking.client_phone}</p>
                      </div>
                    </div>

                    <div className="mp-booking-service">
                      <p className="mp-booking-service-title">Detalji rezervacije</p>
                      <div className="mp-booking-service-meta">
                        <div className="mp-booking-service-item">
                          <Clock />
                          <span>{format(new Date(booking.booking_datetime), 'HH:mm')} • {booking.service_duration} min</span>
                        </div>
                        <div className="mp-booking-service-item">
                          <Calendar />
                          <span>{format(new Date(booking.booking_datetime), 'EEEE', { locale: hr })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {booking.description && (
                      <div className="mt-4 p-4 bg-green-50 rounded-xl border-2 border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-bold text-green-700 uppercase tracking-wider">Opis problema</p>
                        </div>
                        <p className="text-gray-700">{booking.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mp-booking-footer">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleConfirm(booking.id)}
                          className="mp-btn-success"
                          data-testid="confirm-booking-button"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Potvrdi
                        </button>
                        <button
                          onClick={() => handleCancel(booking.id)}
                          className="mp-btn-danger-outline"
                          data-testid="cancel-booking-button"
                        >
                          <XCircle className="w-4 h-4" />
                          Otkaži
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleComplete(booking.id)}
                        className="mp-btn-primary"
                        data-testid="complete-booking-button"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Označi završeno
                      </button>
                    )}
                    {(booking.status === 'completed' || booking.status === 'cancelled') && (
                      <button
                        onClick={() => handleDelete(booking.id, booking.status)}
                        className="mp-btn-danger-outline"
                        data-testid="delete-booking-button"
                      >
                        <Trash2 className="w-4 h-4" />
                        Ukloni
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default BookingsPage;
