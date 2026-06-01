import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
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
      <div className="min-h-screen app-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background">
      <Navbar />
      <div className="page-container">
        {/* Page Header */}
        <div className="mb-12 sm:mb-16">
          <h1 className="section-title mb-4" data-testid="working-hours-title">
            Radno vrijeme
          </h1>
          <p className="section-subtitle">
            Postavite svoje radno vrijeme i dane kada niste dostupni
          </p>
        </div>

        {/* Weekly Working Hours Card */}
        <div className="card-elevated mb-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{fontFamily: "'Sora', sans-serif"}}>Tjedno radno vrijeme</h2>
              <p className="text-sm text-slate-400">Označite dane kada radite i postavite radno vrijeme</p>
            </div>
          </div>

          {/* Day Rows - Modern Card Style */}
          <div className="space-y-4">
            {days.map((day) => (
              <div 
                key={day.key} 
                className={`day-row ${workingHours[day.key].enabled ? 'day-row-active' : ''}`}
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
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                        workingHours[day.key].enabled 
                          ? 'bg-gradient-to-br from-primary to-blue-600 text-white shadow-md' 
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {day.short}
                      </div>
                      <Label className={`text-base font-bold ${workingHours[day.key].enabled ? 'text-slate-900' : 'text-slate-400'}`}>
                        {day.label}
                      </Label>
                    </div>
                  </div>

                  {/* Time Inputs - Stacked on mobile, inline on larger screens */}
                  {workingHours[day.key].enabled && (
                    <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 xs:gap-4 sm:gap-6 pl-0 xs:pl-14">
                      <div className="flex items-center gap-2 w-full xs:w-auto">
                        <Label htmlFor={`${day.key}-start`} className="text-xs font-black text-slate-400 uppercase tracking-wider min-w-[24px]">Od</Label>
                        <Input
                          id={`${day.key}-start`}
                          type="time"
                          value={workingHours[day.key].start_time || ''}
                          onChange={(e) => handleWorkingHoursChange(day.key, 'start_time', e.target.value)}
                          className="flex-1 xs:flex-none xs:w-28 sm:w-32 form-input text-center font-semibold"
                          data-testid={`${day.key}-start-time`}
                        />
                      </div>
                      <div className="hidden xs:block w-4 h-0.5 bg-slate-200 rounded-full"></div>
                      <div className="flex items-center gap-2 w-full xs:w-auto">
                        <Label htmlFor={`${day.key}-end`} className="text-xs font-black text-slate-400 uppercase tracking-wider min-w-[24px]">Do</Label>
                        <Input
                          id={`${day.key}-end`}
                          type="time"
                          value={workingHours[day.key].end_time || ''}
                          onChange={(e) => handleWorkingHoursChange(day.key, 'end_time', e.target.value)}
                          className="flex-1 xs:flex-none xs:w-28 sm:w-32 form-input text-center font-semibold"
                          data-testid={`${day.key}-end-time`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100">
            <Button
              onClick={handleSaveWorkingHours}
              className="btn-primary w-full sm:w-auto"
              data-testid="save-working-hours-button"
            >
              Spremi radno vrijeme
            </Button>
          </div>
        </div>

        {/* Days Off Card */}
        <div className="card-elevated">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <CalendarOff className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{fontFamily: "'Sora', sans-serif"}}>Slobodni dani</h2>
              <p className="text-sm text-slate-400">Dodajte dane kada niste dostupni za rezervacije</p>
            </div>
          </div>

          {/* Add Day Off Form */}
          <form onSubmit={handleAddDayOff} className="mb-8 p-6 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="date" className="form-label">Datum</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={newDayOff.date}
                  onChange={(e) => setNewDayOff({ ...newDayOff, date: e.target.value })}
                  className="form-input"
                  data-testid="day-off-date-input"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="reason" className="form-label">Razlog (opcionalno)</Label>
                <Input
                  id="reason"
                  type="text"
                  value={newDayOff.reason}
                  onChange={(e) => setNewDayOff({ ...newDayOff, reason: e.target.value })}
                  placeholder="Godišnji odmor"
                  className="form-input"
                  data-testid="day-off-reason-input"
                />
              </div>
              <Button
                type="submit"
                className="btn-primary flex items-center gap-2"
                data-testid="add-day-off-button"
              >
                <Plus className="w-4 h-4" />
                Dodaj
              </Button>
            </div>
          </form>

          {/* Days Off List */}
          {daysOff.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-lg text-slate-400 font-medium" data-testid="no-days-off-message">
                Nemate nijedan slobodan dan.
              </p>
              <p className="text-sm text-slate-300 mt-1">Dodajte dane kada nećete biti dostupni.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {daysOff.map((dayOff) => (
                <div
                  key={dayOff.date}
                  className="flex items-center justify-between p-5 bg-white/80 border-2 border-slate-100 rounded-2xl hover:border-red-200 hover:bg-red-50/30 transition-all duration-300 group"
                  data-testid="day-off-item"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                      <CalendarOff className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{dayOff.date}</p>
                      {dayOff.reason && <p className="text-sm text-slate-500 mt-0.5">{dayOff.reason}</p>}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRemoveDayOff(dayOff.date)}
                    className="btn-outline-danger flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity"
                    data-testid="remove-day-off-button"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Ukloni</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkingHoursPage;
