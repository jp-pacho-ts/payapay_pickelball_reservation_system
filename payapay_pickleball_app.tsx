import { useState, useMemo, useEffect, type ChangeEvent, type MouseEvent } from 'react';
import {
  MapPin, Calendar as CalendarIcon, Clock, CheckCircle2,
  Sun, Moon, User, Mail, Phone, ShieldCheck,
  Users, CreditCard, Trash2, AlertTriangle,
  Smartphone, Wallet, Lock, ArrowLeft, Check,
  Download, QrCode, AlertCircle, Map, Navigation
} from 'lucide-react';

const COURTS = [
  { id: 'bebs', name: 'Bebs Court', description: 'Premium outdoor surface' },
  { id: 'monte', name: 'Monte Court', description: 'Standard championship court' },
  { id: 'biyo', name: 'Biyo Court', description: 'Great for practice and drills' }
];

const RULES = [
  { icon: Users, text: "The pickleball court shall be rented on a first-come, first-served basis or via advance booking." },
  { icon: CheckCircle2, text: "Walk-in players may use the court only if it is vacant and unreserved." },
  { icon: AlertTriangle, text: "Players must play only on their booked court. Transferring is not allowed without approval." },
  { icon: Clock, text: "Strictly observe reserved playing time. Vacate promptly; late arrival does not extend time." },
  { icon: Trash2, text: "Keep the court clean and in good condition after use." },
  { icon: ShieldCheck, text: "Proper sports shoes must be worn. Any damage may be subject to charges." }
];

// Helper to generate time slots from 6 AM to 2 AM (next day)
const generateTimeSlots = () => {
  const slots = [];
  // 6 AM (6) to 1 AM (25) - Last booking can be 1 AM for 1 hour ending at 2 AM
  for (let i = 6; i <= 25; i++) {
    let displayHour = i % 24;
    displayHour = displayHour === 0 ? 12 : (displayHour > 12 ? displayHour - 12 : displayHour);
    let ampm = i < 12 || i >= 24 ? 'AM' : 'PM';

    slots.push({
      value: i,
      label: `${displayHour}:00 ${ampm}`,
      period: i < 12 ? 'Morning' : (i < 17 ? 'Afternoon' : 'Evening/Night'),
      isNightRate: i >= 16 || i >= 24 // 4 PM onwards is Night Rate (₱450)
    });
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

type FormErrors = Partial<Record<'name' | 'email' | 'phone' | 'date', string | null>>;

// Use the park's calendar date rather than UTC, which can be the previous day.
const getParkDate = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

export default function PayapayPickleballApp() {
  // App Flow State: 'form' -> 'payment' -> 'success'
  const [step, setStep] = useState('form');

  // Booking Selection State
  const [selectedCourt, setSelectedCourt] = useState(COURTS[0].id);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(6); // Default 6:00 AM
  const [duration, setDuration] = useState(1);

  // Player Details State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    players: '2'
  });

  // UI & Payment State
  const [errors, setErrors] = useState<FormErrors>({});
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [reservationNumber, setReservationNumber] = useState('');

  // Set default date to today on mount
  useEffect(() => {
    const today = getParkDate();
    setSelectedDate(today);
  }, []);

  // Ensure duration doesn't exceed closing time (2 AM is hour 26)
  useEffect(() => {
    const maxAllowed = 26 - selectedTime;
    if (duration > maxAllowed) {
      setDuration(maxAllowed > 0 ? maxAllowed : 1);
    }
  }, [selectedTime, duration]);

  // Calculate total cost based on time-specific rates
  const { totalCost, breakdown } = useMemo(() => {
    let total = 0;
    let currentBreakdown = [];

    for (let j = 0; j < duration; j++) {
      let currentHour = selectedTime + j;
      // 6:00 AM–4:00 PM is ₱350/hr, 4:00 PM–2:00 AM is ₱450/hr
      let rate = (currentHour >= 6 && currentHour < 16) ? 350 : 450;
      total += rate;

      let displayHour = currentHour % 24;
      displayHour = displayHour === 0 ? 12 : (displayHour > 12 ? displayHour - 12 : displayHour);
      let ampm = currentHour < 12 || currentHour >= 24 ? 'AM' : 'PM';

      currentBreakdown.push({
        hourLabel: `${displayHour}:00 ${ampm}`,
        rate: rate
      });
    }
    return { totalCost: total, breakdown: currentBreakdown };
  }, [selectedTime, duration]);

  // Validate user inputs before proceeding to payment
  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
       newErrors.phone = 'Phone number is required';
    } else if (formData.phone.replace(/[^0-9]/g, '').length < 10) {
       newErrors.phone = 'Please enter a valid phone number';
    }

    if (!selectedDate) newErrors.date = 'Please select a date';
    else if (selectedDate < getParkDate()) newErrors.date = 'Please select today or a future date';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const field = name as keyof FormErrors;
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const proceedToPayment = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setStep('payment');
    }
  };

  // Simulate payment processing and generate reservation number
  const processPayment = () => {
    setIsProcessing(true);
    // Simulate network request delay
    setTimeout(() => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let result = 'RES-';
      for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));

      setReservationNumber(result);
      setIsProcessing(false);
      setStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 2500);
  };

  // Reset entirely to book again
  const resetBooking = () => {
    setStep('form');
    setFormData({ name: '', email: '', phone: '', players: '2' });
    setReservationNumber('');
    setSelectedCourt(COURTS[0].id);
    setSelectedTime(6);
    setDuration(1);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center py-12 px-4 sm:px-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Mock Paymongo Header */}
          <div className="bg-white p-6 pb-4 flex flex-col items-center border-b border-gray-100 relative">
            <button onClick={() => setStep('form')} className="absolute left-4 top-6 text-gray-400 hover:text-gray-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-emerald-950 rounded-xl flex items-center justify-center mb-3">
              <Lock className="w-5 h-5 text-lime-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Payapay Pickleball Park</h2>
            <div className="bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-2 border border-blue-200">
              Test Environment Mockup
            </div>
          </div>

          <div className="p-6 bg-gray-50/50">
            <p className="text-center text-sm text-gray-500 font-medium mb-1">Amount Due</p>
            <h2 className="text-4xl font-black text-center text-gray-900 mb-8 tracking-tight">
              <span className="text-2xl text-gray-400 font-medium mr-1">PHP</span>
              {totalCost.toFixed(2)}
            </h2>

            <div className="space-y-3 mb-8">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">How would you like to pay?</h3>

              {/* Payment Option: GCash */}
              <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'gcash' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'gcash'} onChange={() => setPaymentMethod('gcash')} />
                <Smartphone className={`w-6 h-6 mr-3 ${paymentMethod === 'gcash' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="font-semibold text-gray-900 flex-grow">GCash</span>
                {paymentMethod === 'gcash' && <Check className="w-5 h-5 text-blue-600" />}
              </label>

              {/* Payment Option: Maya */}
              <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'maya' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'maya'} onChange={() => setPaymentMethod('maya')} />
                <Wallet className={`w-6 h-6 mr-3 ${paymentMethod === 'maya' ? 'text-emerald-600' : 'text-gray-400'}`} />
                <span className="font-semibold text-gray-900 flex-grow">Maya</span>
                {paymentMethod === 'maya' && <Check className="w-5 h-5 text-emerald-600" />}
              </label>

               {/* Payment Option: QR Ph */}
               <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'qrph' ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'qrph'} onChange={() => setPaymentMethod('qrph')} />
                <QrCode className={`w-6 h-6 mr-3 ${paymentMethod === 'qrph' ? 'text-gray-900' : 'text-gray-400'}`} />
                <span className="font-semibold text-gray-900 flex-grow">QR Ph</span>
                {paymentMethod === 'qrph' && <Check className="w-5 h-5 text-gray-900" />}
              </label>

              {/* Payment Option: Card */}
              <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                <CreditCard className={`w-6 h-6 mr-3 ${paymentMethod === 'card' ? 'text-indigo-600' : 'text-gray-400'}`} />
                <span className="font-semibold text-gray-900 flex-grow">Credit / Debit Card</span>
                {paymentMethod === 'card' && <Check className="w-5 h-5 text-indigo-600" />}
              </label>
            </div>

            <button
              onClick={processPayment}
              disabled={isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all shadow-md flex justify-center items-center gap-2
                ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black active:scale-[0.98]'}`}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay PHP ${totalCost.toFixed(2)}`
              )}
            </button>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
              <Lock className="w-3 h-3"/> Secured by MockPaymongo
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden relative">
            {/* Receipt Header */}
            <div className="bg-emerald-950 px-8 py-10 text-center relative">
              <div className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-lime-400/20 mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-950" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
              <p className="text-emerald-100/90 text-lg">Your court reservation is confirmed.</p>
            </div>

            {/* Receipt Body */}
            <div className="p-8 pb-4 relative">
              <div className="absolute top-0 left-8 right-8 h-px bg-dashed border-t-2 border-dashed border-gray-200 -mt-px"></div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 bg-gray-50 p-5 rounded-xl border border-gray-100 gap-4 sm:gap-0">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Reservation No.</p>
                  <p className="text-2xl font-mono font-black text-gray-900">{reservationNumber}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Status</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    PAID VIA {paymentMethod.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1.5"><User className="w-4 h-4"/> Player Name</p>
                    <p className="font-semibold text-gray-900 text-lg">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1.5"><Phone className="w-4 h-4"/> Contact Info</p>
                    <p className="font-semibold text-gray-900">{formData.phone}</p>
                    <p className="text-sm text-gray-600">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1.5"><MapPin className="w-4 h-4"/> Court</p>
                    <p className="font-semibold text-gray-900 text-lg">{COURTS.find(c => c.id === selectedCourt)?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1.5"><CalendarIcon className="w-4 h-4"/> Date & Time</p>
                    <p className="font-semibold text-gray-900">{selectedDate}</p>
                    <p className="text-sm text-gray-700 font-medium bg-emerald-50 text-emerald-800 inline-block px-2 py-0.5 rounded mt-1">
                      {TIME_SLOTS.find(t => t.value === selectedTime)?.label} ({duration} hr{duration > 1 ? 's' : ''})
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6 mt-6">
                  <div className="flex justify-between items-center font-bold text-xl">
                    <span className="text-gray-900">Total Paid</span>
                    <span className="text-emerald-700">₱{totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 pt-6 flex flex-col sm:flex-row gap-4 bg-white border-t border-gray-50">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-white border-2 border-gray-200 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition-colors flex justify-center items-center gap-2"
              >
                <Download className="w-5 h-5" /> Save Receipt
              </button>
              <button
                onClick={resetBooking}
                className="flex-1 bg-emerald-950 text-lime-400 py-3.5 rounded-xl font-bold hover:bg-emerald-900 transition-colors shadow-lg shadow-emerald-900/20"
              >
                Book Another Court
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderAboutSection = () => (
    <section className="mb-10">
      <div className="bg-emerald-950 rounded-3xl overflow-hidden shadow-xl border border-emerald-900 flex flex-col md:flex-row">
        {/* Info Left */}
        <div className="p-8 md:p-12 md:w-2/3 flex flex-col justify-center relative">
          {/* Decorative Pattern */}
          <div className="absolute right-0 top-0 bottom-0 w-64 opacity-5 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-white"><circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="10" fill="none"/><path d="M50 10 V90 M10 50 H90" stroke="currentColor" strokeWidth="10"/></svg>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/10 text-lime-400 text-sm font-bold w-fit mb-6 border border-lime-400/20">
            <Map className="w-4 h-4" /> Tacloban's Premier Pickleball Facility
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
            Where Fun Meets the <span className="text-lime-400">Coast</span>.
          </h2>
          <p className="text-emerald-100/90 text-lg mb-8 max-w-xl leading-relaxed">
            Welcome to Payapay Pickleball Park! Whether you're a seasoned pro or just picking up a paddle for the first time, our three state-of-the-art courts (Bebs, Monte, and Biyo) are ready for your next match.
          </p>

          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-800/50 flex items-center justify-center shrink-0 border border-emerald-700/50">
                <Navigation className="w-5 h-5 text-lime-400" />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Location</h4>
                <p className="text-sm text-emerald-200/80">Purok Payapay, Brgy. 89<br/>San Jose, Tacloban City</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-800/50 flex items-center justify-center shrink-0 border border-emerald-700/50">
                <Clock className="w-5 h-5 text-lime-400" />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Operating Hours</h4>
                <p className="text-sm text-emerald-200/80">Open Daily<br/>6:00 AM – 2:00 AM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Right - Quick Rates */}
        <div className="bg-emerald-900 md:w-1/3 p-8 flex flex-col justify-center border-l border-emerald-800/50">
          <h3 className="text-white font-bold text-xl mb-6">Court Rates</h3>
          <div className="space-y-4">
            <div className="bg-emerald-800/40 p-4 rounded-xl border border-emerald-700/30">
              <div className="flex items-center gap-2 text-orange-300 font-semibold mb-1 text-sm">
                <Sun className="w-4 h-4" /> Day Rate
              </div>
              <div className="text-2xl font-black text-white">₱350 <span className="text-sm font-medium text-emerald-200/60">/ hour</span></div>
              <div className="text-xs text-emerald-200/80 mt-1">6:00 AM – 4:00 PM</div>
            </div>
            <div className="bg-emerald-800/40 p-4 rounded-xl border border-emerald-700/30">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold mb-1 text-sm">
                <Moon className="w-4 h-4" /> Night Rate
              </div>
              <div className="text-2xl font-black text-white">₱450 <span className="text-sm font-medium text-emerald-200/60">/ hour</span></div>
              <div className="text-xs text-emerald-200/80 mt-1">4:00 PM – 2:00 AM</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-lime-200 pb-12">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-950 rounded-lg flex items-center justify-center text-lime-400 transform -rotate-3 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none text-emerald-950">Payapay Pickleball</h1>
              <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest">Park</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-emerald-600"/> +63 912 345 6789</span>
            <button className="bg-emerald-950 text-lime-400 px-5 py-2 rounded-lg font-bold hover:bg-emerald-900 transition-colors">Contact Us</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Render the beautifully designed About Section */}
        {renderAboutSection()}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Form Sections */}
          <div className="lg:col-span-8 space-y-8">

            {/* Section 1: Court */}
            <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">1</div>
                <h2 className="text-2xl font-bold text-gray-900">Select Court</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {COURTS.map(court => {
                  const isSelected = selectedCourt === court.id;
                  return (
                    <button
                      key={court.id}
                      type="button"
                      onClick={() => setSelectedCourt(court.id)}
                      className={`text-left p-5 rounded-xl border-2 transition-all duration-200 outline-none relative overflow-hidden
                        ${isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 ring-4 ring-emerald-600/10'
                          : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50 focus:border-emerald-500'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <MapPin className={`w-6 h-6 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`} />
                        {isSelected && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                      </div>
                      <h3 className={`font-bold text-lg ${isSelected ? 'text-emerald-900' : 'text-gray-900'}`}>{court.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 leading-snug">{court.description}</p>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Section 2: Schedule */}
            <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">2</div>
                <h2 className="text-2xl font-bold text-gray-900">Date & Time</h2>
              </div>

              <div className="space-y-8">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Date</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      min={getParkDate()}
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        if(errors.date) setErrors(prev => ({...prev, date: null}));
                      }}
                      className={`w-full md:w-1/2 pl-12 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-gray-700 ${errors.date ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                    />
                  </div>
                  {errors.date && <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.date}</p>}
                </div>

                {/* Time Selection Grid */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="block text-sm font-semibold text-gray-700">Start Time</label>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-64 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-300">
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = selectedTime === slot.value;
                      return (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => setSelectedTime(slot.value)}
                          className={`py-2.5 px-1 rounded-lg text-sm font-semibold transition-all border
                            ${isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                              : slot.isNightRate
                                ? 'bg-indigo-50/50 text-indigo-900 border-indigo-100 hover:bg-indigo-100'
                                : 'bg-orange-50/50 text-orange-900 border-orange-100 hover:bg-orange-100'
                            }`}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration Slider */}
                <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-4 flex justify-between">
                    Duration
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">{duration} Hour{duration > 1 ? 's' : ''}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max={Math.min(6, 26 - selectedTime > 0 ? 26 - selectedTime : 1)}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium px-1">
                    <span>1 hr</span>
                    <span>Max avail</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Player Details Form */}
            <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">3</div>
                <h2 className="text-2xl font-bold text-gray-900">Player Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text" name="name" placeholder="Juan Dela Cruz"
                      value={formData.name} onChange={handleInputChange}
                      className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'}`}
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email" name="email" placeholder="juan@example.com"
                      value={formData.email} onChange={handleInputChange}
                      className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${errors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel" name="phone" placeholder="0912 345 6789"
                      value={formData.phone} onChange={handleInputChange}
                      className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${errors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'}`}
                    />
                  </div>
                   {errors.phone && <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.phone}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number of Players</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="players" value={formData.players} onChange={handleInputChange}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="2">2 Players (Singles)</option>
                      <option value="4">4 Players (Doubles)</option>
                      <option value="more">More than 4</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {}
          {/* Right Column: Sticky Summary & Rules */}
          <div className="lg:col-span-4 space-y-6">

            {/* Real-time Summary Card */}
            <div className="bg-emerald-950 rounded-2xl shadow-xl overflow-hidden sticky top-24 border border-emerald-900">
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-lime-400" /> Booking Summary
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center pb-4 border-b border-emerald-800/50">
                    <span className="text-emerald-100/70 text-sm">Court</span>
                    <span className="font-semibold text-white">{COURTS.find(c => c.id === selectedCourt)?.name}</span>
                  </div>

                  <div className="flex justify-between items-start pb-4 border-b border-emerald-800/50">
                    <span className="text-emerald-100/70 text-sm">Schedule</span>
                    <div className="text-right">
                      <span className="font-semibold text-white block">{selectedDate || 'Select Date'}</span>
                      <span className="text-sm text-lime-400 font-medium">
                        {TIME_SLOTS.find(t => t.value === selectedTime)?.label} for {duration} hr(s)
                      </span>
                    </div>
                  </div>

                  {/* Hourly Breakdown */}
                  <div className="bg-emerald-900/50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-bold text-emerald-100/50 uppercase tracking-wider mb-2">Rate Breakdown</p>
                    {breakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-emerald-100">{item.hourLabel}</span>
                        <span className="text-emerald-100 font-medium">₱{item.rate}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-end mb-8 pt-2">
                  <span className="text-emerald-100 text-sm font-medium">Total Amount</span>
                  <span className="text-3xl font-black text-white">₱{totalCost.toFixed(2)}</span>
                </div>

                <button
                  onClick={proceedToPayment}
                  className="w-full py-4 bg-lime-400 hover:bg-lime-500 text-emerald-950 rounded-xl font-black text-lg transition-colors shadow-lg shadow-lime-400/20 active:scale-[0.98]"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>

            {/* Rules Section */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Park Rules
              </h3>
              <ul className="space-y-4">
                {RULES.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <rule.icon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 leading-relaxed">{rule.text}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">© 2026 Payapay Pickleball Park. All rights reserved.</p>
          <p className="text-gray-400 text-xs mt-2">Purok Payapay, Brgy. 89, San Jose, Tacloban City</p>
        </div>
      </footer>
    </div>
  );
}
