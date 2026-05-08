import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ReviewPage = () => {
  const { bookingId, token } = useParams();
  const [loading, setLoading] = useState(true);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'expired', 'reviewed', 'invalid'
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
      const detail = error.response?.data?.detail || 'Greška pri učitavanju podataka';
      setErrorMessage(detail);
      
      // Determine error type for better UX
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
      const detail = error.response?.data?.detail || 'Greška pri slanju recenzije';
      toast.error(detail);
      
      // If the error indicates expired or already reviewed, show error state
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
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="card-elevated p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg text-slate-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  if (!bookingInfo) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center px-4">
        <div className="card-elevated max-w-md w-full p-8 text-center">
          {errorType === 'expired' ? (
            <>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-orange-600" strokeWidth={2} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-3" data-testid="review-expired-title">
                Link je istekao
              </h1>
              <p className="text-base text-slate-600 mb-6">
                {errorMessage || 'Link za recenziju je istekao. Recenzije su moguće samo unutar 30 dana od završetka usluge.'}
              </p>
            </>
          ) : errorType === 'reviewed' ? (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" strokeWidth={2} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-3" data-testid="review-already-title">
                Već ste ocijenili
              </h1>
              <p className="text-base text-slate-600 mb-6">
                {errorMessage || 'Ova rezervacija je već ocijenjena. Možete ostaviti samo jednu recenziju po rezervaciji.'}
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" strokeWidth={2} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-3" data-testid="review-invalid-title">
                Link nije valjan
              </h1>
              <p className="text-base text-slate-600 mb-6">
                {errorMessage || 'Ova rezervacija nije dostupna za recenziju.'}
              </p>
            </>
          )}
          <Link to="/">
            <Button className="btn-primary" data-testid="back-home-button">
              Nazad na početnu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center px-4">
        <div className="card-elevated max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-3" data-testid="review-success-title">
            Hvala na recenziji!
          </h1>
          <p className="text-base text-slate-600 mb-6">
            Vaša recenzija je uspješno poslana i bit će vidljiva na profilu majstora.
          </p>
          <Link to="/">
            <Button className="btn-primary" data-testid="back-home-after-review">
              Nazad na početnu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <Link to="/" className="text-2xl font-extrabold text-primary tracking-tight">Fiksiraj</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card-elevated p-8">
          <h1 className="text-3xl font-bold tracking-tight mb-6 text-center" data-testid="review-page-title">
            Ocijenite uslugu
          </h1>

          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold tracking-tight mb-4">Detalji rezervacije</h2>
            <div className="space-y-3">
              <p className="text-base text-slate-700">
                <span className="font-semibold text-slate-900">Majstor:</span> {bookingInfo.professional_name}
              </p>
              <p className="text-base text-slate-700">
                <span className="font-semibold text-slate-900">Usluga:</span> {bookingInfo.service_name}
              </p>
              <p className="text-base text-slate-700">
                <span className="font-semibold text-slate-900">Datum:</span>{' '}
                {format(new Date(bookingInfo.booking_datetime), 'PPP', { locale: hr })}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-base font-semibold text-slate-800 mb-3">
                Ocjena <span className="text-red-500">*</span>
              </label>
              <div className="flex justify-center space-x-3 py-4 bg-slate-50 rounded-xl">
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
                      className={`w-12 h-12 transition-colors ${
                        star <= (hoveredRating || rating)
                          ? 'text-orange-400 fill-orange-400 drop-shadow-md'
                          : 'text-slate-300'
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-slate-600 mt-3 font-medium">
                  Odabrali ste: <span className="text-orange-500">{rating} {rating === 1 ? 'zvjezdica' : rating < 5 ? 'zvjezdice' : 'zvjezdica'}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="comment" className="block text-base font-semibold text-slate-800 mb-2">
                Komentar <span className="text-slate-400">(opcionalno)</span>
              </label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Podijelite svoje iskustvo s ovim majstorom..."
                rows={4}
                className="w-full form-textarea"
                data-testid="review-comment-textarea"
              />
            </div>

            <Button
              type="submit"
              className="w-full btn-primary py-4 text-lg"
              disabled={submitting || rating === 0}
              data-testid="submit-review-button"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                  Slanje...
                </span>
              ) : (
                'Pošalji recenziju'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
