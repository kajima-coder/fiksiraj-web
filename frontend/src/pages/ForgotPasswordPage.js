import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { CheckCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      setSubmitted(true);
      toast.success('Email za resetiranje lozinke je poslan!');
    } catch (error) {
      toast.error('Greška pri slanju emaila');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Provjerite email</h1>
          <p className="text-base text-slate-600 mb-6">
            Ako postoji račun s tim emailom, poslali smo vam link za resetiranje lozinke.
          </p>
          <Link to="/prijava">
            <Button className="w-full bg-primary hover:bg-primary-hover text-white font-semibold">
              Povratak na prijavu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/">
            <h1 className="text-4xl font-extrabold text-primary tracking-tight mb-2">Fiksiraj</h1>
          </Link>
          <p className="text-base leading-relaxed text-slate-600">Resetirajte svoju lozinku</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email adresa</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                placeholder="ivan@example.com"
                data-testid="forgot-password-email-input"
              />
              <p className="text-sm text-slate-500 mt-2">
                Poslat ćemo vam link za resetiranje lozinke na vaš email.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 shadow-sm active:scale-95"
              disabled={loading}
              data-testid="forgot-password-submit-button"
            >
              {loading ? 'Slanje...' : 'Pošalji link'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/prijava" className="text-sm text-primary font-medium hover:underline">
              ← Povratak na prijavu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
