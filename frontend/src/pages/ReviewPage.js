import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { getErrorMessage } from '@/utils/errorUtils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ReviewPage = () => {
  const { bookingId, token } = useParams();
  const [loading, setLoading] = useState(true);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorType, setErrorType] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchBookingInfo();
  }, [bookingId, token]);

  const fetchBookingInfo = async () => {
    try {
      const response = await axios.get(`${API}/public/review/${bookingId}/${token}`);
      setBookingInfo(response.data);
    } catch (error) {
      const detail = getErrorMessage(error, 'Greška pri učitavanju podataka');
      setErrorMessage(detail);
      
      if (detail.includes('istekao') || detail.includes('expired')) {
        setErrorType('expired');
      } else if (detail.includes('već ocijenjena') || detail.includes('already')) {
        setErrorType('reviewed');
      } else {
        setErrorType('invalid');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Molimo odaberite ocjenu');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/public/review/${bookingId}/${token}`, {
        rating,
        comment: comment.trim() || null
      });
      setSubmitted(true);
      toast.success('Hvala na recenziji!');
    } catch (error) {
      const detail = getErrorMessage(error, 'Greška pri slanju recenzije');
      toast.error(detail);
      
      if (detail.includes('istekao') || detail.includes('već')) {
        setErrorMessage(detail);
        setErrorType(detail.includes('istekao') ? 'expired' : 'reviewed');
        setBookingInfo(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="mp-info-card p-8 text-center" style={{ maxWidth: '320px' }}>
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-base text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  if (!bookingInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="mp-info-card max-w-md w-full text-center" style={{ padding: '40px 32px' }}>
          {errorType === 'expired' ? (
            <>
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Clock className="w-8 h-8 text-orange-600" strokeWidth={2} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3" style={{fontFamily: "'Sora', sans-serif"}} data-testid="review-expired-title">
                Link je istekao
              </h1>
              <p className="text-base text-gray-600 mb-6">
                {errorMessage || 'Link za recenziju je istekao. Recenzije su moguće samo unutar 30 dana od završetka usluge.'}
              </p>
            </>
          ) : errorType === 'reviewed' ? (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-blue-600" strokeWidth={2} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3" style={{fontFamily: "'Sora', sans-serif"}} data-testid="review-already-title">
                Već ste ocijenili
              </h1>
              <p className="text-base text-gray-600 mb-6">
                {errorMessage || 'Ova rezervacija je već ocijenjena. Možete ostaviti samo jednu recenziju po rezervaciji.'}
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-8 h-8 text-red-600" strokeWidth={2} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3" style={{fontFamily: "'Sora', sans-serif"}} data-testid="review-invalid-title">
                Link nije valjan
              </h1>
              <p className="text-base text-gray-600 mb-6">
                {errorMessage || 'Ova rezervacija nije dostupna za recenziju.'}
              </p>
            </>
          )}
          <Link to="/">
            <button className="mp-btn-primary" data-testid="back-home-button">
              Nazad na početnu
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="mp-info-card max-w-md w-full text-center" style={{ padding: '40px 32px' }}>
          <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3" style={{fontFamily: "'Sora', sans-serif"}} data-testid="review-success-title">
            Hvala na recenziji!
          </h1>
          <p className="text-base text-gray-600 mb-6">
            Vaša recenzija je uspješno poslana i bit će vidljiva na profilu majstora.
          </p>
          <Link to="/">
            <button className="mp-btn-primary" data-testid="back-home-after-review">
              Nazad na početnu
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16 sm:h-20">
            <Link to="/" className="text-2xl sm:text-3xl font-bold text-black tracking-tight" style={{fontFamily: "'Sora', sans-serif"}}>
              Fiksiraj
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-20 sm:pt-24">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="mp-info-card" style={{ padding: '32px' }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center" style={{fontFamily: "'Sora', sans-serif"}} data-testid="review-page-title">
              Ocijenite uslugu
            </h1>

            {/* Booking Details */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Detalji rezervacije</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Majstor:</span>
                  <span className="text-sm font-bold text-gray-900">{bookingInfo.professional_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Usluga:</span>
                  <span className="text-sm font-bold text-gray-900">{bookingInfo.service_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Datum:</span>
                  <span className="text-sm font-bold text-gray-900">
                    {format(new Date(bookingInfo.booking_datetime), 'PPP', { locale: hr })}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mp-form-label mb-3">
                  Ocjena <span className="text-red-500">*</span>
                </label>
                <div className="flex justify-center space-x-3 py-5 bg-gray-50 rounded-xl">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="focus:outline-none transition-all duration-200 hover:scale-125"
                      data-testid={`star-${star}`}
                    >
                      <Star
                        className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${
                          star <= (hoveredRating || rating)
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-gray-200'
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-sm text-gray-600 mt-3 font-medium">
                    Odabrali ste: <span className="text-amber-500 font-bold">{rating} {rating === 1 ? 'zvjezdica' : rating < 5 ? 'zvjezdice' : 'zvjezdica'}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="mp-form-label mb-2">
                  Komentar <span className="text-gray-400 font-normal">(opcionalno)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Podijelite svoje iskustvo s ovim majstorom..."
                  rows={4}
                  className="mp-form-input min-h-[120px] resize-none"
                  data-testid="review-comment-textarea"
                />
              </div>

              <button
                type="submit"
                className="mp-btn-success w-full"
                disabled={submitting || rating === 0}
                data-testid="submit-review-button"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Slanje...
                  </span>
                ) : (
                  'Pošalji recenziju'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
