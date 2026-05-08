import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Lozinke se ne podudaraju');
      return;
    }

    if (password.length < 6) {
      toast.error('Lozinka mora imati najmanje 6 znakova');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, {
        token,
        new_password: password
      });
      toast.success('Lozinka uspješno promijenjena!');
      navigate('/prijava');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Greška pri resetiranju lozinke');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/">
            <h1 className="text-4xl font-extrabold text-primary tracking-tight mb-2">Fiksiraj</h1>
          </Link>
          <p className="text-base leading-relaxed text-slate-600">Unesite novu lozinku</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Nova lozinka</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                placeholder="••••••••"
                data-testid="reset-password-input"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Potvrdite lozinku</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
                placeholder="••••••••"
                data-testid="reset-password-confirm-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 shadow-sm active:scale-95"
              disabled={loading}
              data-testid="reset-password-submit-button"
            >
              {loading ? 'Spremanje...' : 'Resetiraj lozinku'}
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

export default ResetPasswordPage;
