import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Dobrodošli u Fiksiraj',
    text: 'Ovdje upravljate svojim rezervacijama, javnim linkom i pretplatom.',
    icon: '👋'
  },
  {
    id: 'public-link',
    title: 'Vaš javni link',
    text: 'Ovaj link možete poslati klijentima kako bi direktno rezervirali termin kod vas.',
    icon: '🔗'
  },
  {
    id: 'reservations',
    title: 'Rezervacije',
    text: 'Ovdje pratite nove, potvrđene, otkazane i završene rezervacije.',
    icon: '📅'
  },
  {
    id: 'subscription',
    title: 'Pretplata',
    text: 'Imate 30 dana besplatnog probnog perioda. Nakon toga je potrebna aktivna pretplata za nastavak korištenja.',
    icon: '💳'
  },
  {
    id: 'settings',
    title: 'Postavke',
    text: 'U postavkama možete pregledati svoj profil, upravljati pretplatom i pristupiti korisničkom portalu.',
    icon: '⚙️'
  },
  {
    id: 'finish',
    title: 'Spremni ste',
    text: 'Možete početi koristiti Fiksiraj i dijeliti svoj javni link klijentima.',
    icon: '🎉'
  }
];

const OnboardingTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>
        
        {/* Skip button */}
        {!isLastStep && (
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            data-testid="onboarding-skip"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="text-6xl mb-6">{step.icon}</div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-900 mb-3" data-testid="onboarding-title">
            {step.title}
          </h2>
          
          {/* Text */}
          <p className="text-base text-slate-600 mb-8 leading-relaxed">
            {step.text}
          </p>
          
          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'w-6 bg-blue-500' 
                    : index < currentStep 
                      ? 'bg-blue-300' 
                      : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex gap-3 justify-center">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="px-6"
                data-testid="onboarding-prev"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Nazad
              </Button>
            )}
            
            {!isLastStep ? (
              <>
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="px-6 text-slate-500"
                  data-testid="onboarding-skip-btn"
                >
                  Preskoči
                </Button>
                <Button
                  onClick={handleNext}
                  className="btn-primary px-6"
                  data-testid="onboarding-next"
                >
                  Dalje
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            ) : (
              <Button
                onClick={handleFinish}
                className="btn-primary px-8"
                data-testid="onboarding-finish"
              >
                <PartyPopper className="w-4 h-4 mr-2" />
                Završi
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
