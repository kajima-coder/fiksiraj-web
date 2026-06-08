import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Switch } from '@/components/ui/switch';
import { CalendarOff, Clock, Calendar, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const days = [
  { key: 'monday', label: 'Ponedjeljak', short: 'Pon' },
  { key: 'tuesday', label: 'Utorak', short: 'Uto' },
  { key: 'wednesday', label: 'Srijeda', short: 'Sri' },
  { key: 'thursday', label: 'Četvrtak', short: 'Čet' },
  { key: 'friday', label: 'Petak', short: 'Pet' },
  { key: 'saturday', label: 'Subota', short: 'Sub' },
  { key: 'sunday', label: 'Nedjelja', short: 'Ned' },
];

const WorkingHoursPage = () => {
  const [workingHours, setWorkingHours] = useState(null);
  const [daysOff, setDaysOff] = useState([]);
  const [newDayOff, setNewDayOff] = useState({ date: '', reason: '' });

  useEffect(() => {
    fetchWorkingHours();
    fetchDaysOff();
  }, []);

  const fetchWorkingHours = async () => {
    try {
      const response = await axios.get(`${API}/working-hours`);
      setWorkingHours(response.data);
    } catch (error) {
      toast.error('Greška pri učitavanju radnog vremena');
    }
  };

  const fetchDaysOff = async () => {
    try {
      const response = await axios.get(`${API}/days-off`);
      setDaysOff(response.data);
    } catch (error) {
      toast.error('Greška pri učitavanju slobodnih dana');
    }
  };

  const handleWorkingHoursChange = (day, field, value) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSaveWorkingHours = async () => {
    try {
      await axios.put(`${API}/working-hours`, workingHours);
      toast.success('Radno vrijeme spremljeno!');
    } catch (error) {
      toast.error('Greška pri spremanju radnog vremena');
    }
  };

  const handleAddDayOff = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/days-off`, newDayOff);
      toast.success('Slobodan dan dodan!');
      setNewDayOff({ date: '', reason: '' });
      fetchDaysOff();
    } catch (error) {
      toast.error('Greška pri dodavanju slobodnog dana');
    }
  };

  const handleRemoveDayOff = async (date) => {
    try {
      await axios.delete(`${API}/days-off/${date}`);
      toast.success('Slobodan dan uklonjen!');
      fetchDaysOff();
    } catch (error) {
      toast.error('Greška pri uklanjanju slobodnog dana');
    }
  };

  if (!workingHours) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-20 sm:pt-24 flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 sm:pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {/* Page Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="mp-page-title" data-testid="working-hours-title">Radno vrijeme</h1>
            <p className="text-base text-gray-500">Postavite svoje radno vrijeme i dane kada niste dostupni</p>
          </div>

          {/* Weekly Working Hours Card */}
          <div className="mp-info-card mb-6" style={{ padding: '28px' }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900" style={{fontFamily: "'Sora', sans-serif"}}>Tjedno radno vrijeme</h2>
                <p className="text-sm text-gray-500">Označite dane kada radite i postavite radno vrijeme</p>
              </div>
            </div>

            {/* Day Rows */}
            <div className="space-y-4">
              {days.map((day) => (
                <div 
                  key={day.key} 
                  className={`p-4 rounded-xl border-2 transition-all ${
                    workingHours[day.key].enabled 
                      ? 'bg-white border-gray-200' 
                      : 'bg-gray-50 border-gray-100'
                  }`}
                  data-testid={`day-${day.key}`}
                >
                  <div className="flex flex-col gap-4">
                    {/* Day Toggle */}
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={workingHours[day.key].enabled}
                        onCheckedChange={(checked) => handleWorkingHoursChange(day.key, 'enabled', checked)}
                        data-testid={`${day.key}-toggle`}
                      />
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                          workingHours[day.key].enabled 
                            ? 'bg-black text-white' 
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {day.short}
                        </div>
                        <span className={`text-base font-semibold ${workingHours[day.key].enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                          {day.label}
                        </span>
                      </div>
                    </div>

                    {/* Time Inputs */}
                    {workingHours[day.key].enabled && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 sm:pl-14">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[24px]">Od</span>
                          <input
                            type="time"
                            value={workingHours[day.key].start_time || ''}
                            onChange={(e) => handleWorkingHoursChange(day.key, 'start_time', e.target.value)}
                            className="mp-form-input flex-1 sm:flex-none sm:w-32 text-center font-semibold"
                            data-testid={`${day.key}-start-time`}
                          />
                        </div>
                        <div className="hidden sm:block w-4 h-0.5 bg-gray-200 rounded-full"></div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[24px]">Do</span>
                          <input
                            type="time"
                            value={workingHours[day.key].end_time || ''}
                            onChange={(e) => handleWorkingHoursChange(day.key, 'end_time', e.target.value)}
                            className="mp-form-input flex-1 sm:flex-none sm:w-32 text-center font-semibold"
                            data-testid={`${day.key}-end-time`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={handleSaveWorkingHours}
                className="mp-btn-primary w-full sm:w-auto"
                data-testid="save-working-hours-button"
              >
                Spremi radno vrijeme
              </button>
            </div>
          </div>

          {/* Days Off Card */}
          <div className="mp-info-card" style={{ padding: '28px' }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
                <CalendarOff className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900" style={{fontFamily: "'Sora', sans-serif"}}>Slobodni dani</h2>
                <p className="text-sm text-gray-500">Dodajte dane kada niste dostupni za rezervacije</p>
              </div>
            </div>

            {/* Add Day Off Form */}
            <form onSubmit={handleAddDayOff} className="mb-8 p-5 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-1">
                  <label className="mp-form-label">Datum</label>
                  <input
                    type="date"
                    required
                    value={newDayOff.date}
                    onChange={(e) => setNewDayOff({ ...newDayOff, date: e.target.value })}
                    className="mp-form-input w-full"
                    data-testid="day-off-date-input"
                  />
                </div>
                <div className="flex-1">
                  <label className="mp-form-label">Razlog (opcionalno)</label>
                  <input
                    type="text"
                    value={newDayOff.reason}
                    onChange={(e) => setNewDayOff({ ...newDayOff, reason: e.target.value })}
                    placeholder="Godišnji odmor"
                    className="mp-form-input w-full"
                    data-testid="day-off-reason-input"
                  />
                </div>
                <button
                  type="submit"
                  className="mp-btn-primary flex items-center gap-2"
                  data-testid="add-day-off-button"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj
                </button>
              </div>
            </form>

            {/* Days Off List */}
            {daysOff.length === 0 ? (
              <div className="mp-empty-state" style={{ padding: '48px 24px' }}>
                <div className="mp-empty-icon" style={{ width: '64px', height: '64px', marginBottom: '16px' }}>
                  <Calendar style={{ width: '28px', height: '28px' }} />
                </div>
                <h3 className="mp-empty-title" style={{ fontSize: '18px' }} data-testid="no-days-off-message">
                  Nemate nijedan slobodan dan
                </h3>
                <p className="mp-empty-text" style={{ fontSize: '14px', marginBottom: '0' }}>
                  Dodajte dane kada nećete biti dostupni.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {daysOff.map((dayOff) => (
                  <div
                    key={dayOff.date}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50/30 transition-all group"
                    data-testid="day-off-item"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <CalendarOff className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{dayOff.date}</p>
                        {dayOff.reason && <p className="text-sm text-gray-500 mt-0.5">{dayOff.reason}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDayOff(dayOff.date)}
                      className="mp-btn-danger-outline opacity-60 group-hover:opacity-100 transition-opacity"
                      data-testid="remove-day-off-button"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Ukloni</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default WorkingHoursPage;
