

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CheckCircle, Clock, CreditCard, Calendar, BookOpen, AlertTriangle, Loader2 } from 'lucide-react';
import { TeacherProfile, StudentPaymentMethod, studentService } from '../../Services/api';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface BookingFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherProfile;
  serviceId: number;
}

export const BookingFlowModal: React.FC<BookingFlowModalProps> = ({ isOpen, onClose, teacher, serviceId }) => {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1); // 1: Subject, 2: Time, 3: Payment, 4: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selections
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedTimeslot, setSelectedTimeslot] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<StudentPaymentMethod | 'new' | null>(null);
  const [newCardDetails, setNewCardDetails] = useState({
    card_number: '', 
    card_holder: '', 
    expiry_month: '', 
    expiry_year: '', 
    cvv: '', 
    payment_brand: 'VISA'
  });
  
  // Data
  const [paymentMethods, setPaymentMethods] = useState<StudentPaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods();
    }
    // Reset state on close
    return () => {
      setStep(1);
      setSelectedSubject(null);
      setSelectedTimeslot(null);
      setSelectedPaymentMethod(null);
      setError(null);
      setNewCardDetails({
        card_number: '', card_holder: '', expiry_month: '', expiry_year: '', cvv: '', payment_brand: 'VISA'
      });
    };
  }, [isOpen]);
  
  const fetchPaymentMethods = async () => {
    setLoadingPaymentMethods(true);
    try {
      const methods = await studentService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (e) {
      console.error("Failed to load payment methods", e);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };
  
  const handleConfirm = async () => {
    if (!selectedSubject || !selectedTimeslot || !selectedPaymentMethod) {
        setError("Please complete all steps.");
        return;
    }

    setLoading(true);
    setError(null);
    try {
        // Step 1: Create Booking
        const bookingPayload = {
            teacher_id: teacher.id,
            service_id: serviceId, // Use the prop passed from parent
            subject_id: selectedSubject,
            timeslot_id: selectedTimeslot,
            type: 'single' as const
        };
        const bookingRes = await studentService.createBooking(bookingPayload);
        console.log("Booking created:", bookingRes);
        
        // Robustly get ID
        const bookingId = bookingRes.data?.id || bookingRes.id;
        
        if (!bookingId) {
            throw new Error("Could not retrieve Booking ID from server response.");
        }

        // Step 2: Process Payment using Booking ID and Card Data
        let paymentDetails: any;
        
        if (selectedPaymentMethod === 'new') {
            paymentDetails = {
                card_number: newCardDetails.card_number,
                card_holder: newCardDetails.card_holder,
                expiry_month: Number(newCardDetails.expiry_month),
                expiry_year: Number(newCardDetails.expiry_year),
                cvv: newCardDetails.cvv,
                payment_brand: newCardDetails.payment_brand
            };
        } else {
            // Using saved card details to populate payment payload
            paymentDetails = {
                card_number: selectedPaymentMethod.card_number || '',
                card_holder: selectedPaymentMethod.card_holder_name || '',
                expiry_month: Number(selectedPaymentMethod.card_expiry_month),
                expiry_year: Number(selectedPaymentMethod.card_expiry_year),
                // Stored cards usually don't have CVV, so we provide a placeholder if it's required by the API
                // unless the user is prompted to enter it. For this flow, we assume simple re-use.
                cvv: selectedPaymentMethod.card_cvc || '123', 
                payment_brand: selectedPaymentMethod.payment_method?.name_en.toUpperCase() || 'VISA'
            };
        }
        
        const paymentPayload = {
            booking_id: bookingId, 
            ...paymentDetails,
        };
        
        console.log("Sending Payment Payload:", paymentPayload);
        await studentService.processPayment(paymentPayload);

        setStep(4); // Success
    } catch(e: any) {
        console.error("Booking/Payment failed:", e);
        setError(e.message || "An unexpected error occurred during booking.");
    } finally {
        setLoading(false);
    }
  };
  
  const renderStepContent = () => {
      switch(step) {
          // --- STEP 1: SELECT SUBJECT ---
          case 1:
              return (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><BookOpen size={18} /> Select a Subject</h3>
                      {(!teacher.teacher_subjects || teacher.teacher_subjects.length === 0) ? (
                          <p className="text-slate-500 text-sm">No subjects available.</p>
                      ) : (
                          teacher.teacher_subjects?.map(sub => {
                              // Fallback for title if API returns raw object
                              const displayTitle = sub.title || (language === 'ar' ? sub.name_ar : sub.name_en) || 'Unnamed Subject';
                              
                              return (
                              <button key={sub.id} onClick={() => setSelectedSubject(sub.id)}
                                  className={`w-full text-left p-3 rounded-lg border transition-all ${selectedSubject === sub.id ? 'bg-primary/10 border-primary' : 'hover:bg-slate-50 border-slate-200'}`}
                              >
                                  <p className="font-semibold">{displayTitle}</p>
                                  {sub.class_level_title && sub.class_title && (
                                      <p className="text-xs text-slate-500">{sub.class_level_title} - {sub.class_title}</p>
                                  )}
                              </button>
                          )})
                      )}
                  </div>
              );
          // --- STEP 2: SELECT TIME ---
          case 2:
              return (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><Calendar size={18} /> Select Available Time</h3>
                      {(!teacher.available_times || teacher.available_times.length === 0) ? (
                           <p className="text-slate-500 text-sm">No available times.</p>
                      ) : (
                          teacher.available_times?.map(day => {
                              // Handle both new 'time_slots' and old 'times' array structure
                              let timeItems = [];
                              if (day.time_slots && Array.isArray(day.time_slots)) {
                                  timeItems = day.time_slots;
                              } else if (day.times && Array.isArray(day.times)) {
                                  timeItems = day.times.map(t => typeof t === 'string' ? { id: 0, time: t } : t);
                              }

                              if (timeItems.length === 0) return null;

                              return (
                              <div key={day.id || Math.random()}>
                                  <p className="font-medium text-slate-600 mb-2">Day {day.day}</p>
                                  <div className="grid grid-cols-3 gap-2">
                                      {timeItems.map((timeItem: any) => {
                                          if (!timeItem || !timeItem.time) return null;
                                          // Check if booked (based on new API structure session existence)
                                          if (timeItem.session) return null; // Hide booked slots

                                          return (
                                          <button key={timeItem.id} onClick={() => setSelectedTimeslot(timeItem.id)}
                                              className={`py-2 px-1 rounded-lg text-sm font-medium border transition-all ${selectedTimeslot === timeItem.id ? 'bg-primary text-white border-primary' : 'bg-white hover:border-primary border-slate-200'}`}
                                          >
                                              {timeItem.time}
                                          </button>
                                      )})}
                                  </div>
                              </div>
                          )})
                      )}
                  </div>
              );
          // --- STEP 3: SELECT PAYMENT ---
          case 3:
              return (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                     <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><CreditCard size={18} /> Select Payment Method</h3>
                     {loadingPaymentMethods ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : (
                         paymentMethods.map(method => (
                             <div key={method.id} onClick={() => setSelectedPaymentMethod(method)}
                                 className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${selectedPaymentMethod === method ? 'bg-primary/10 border-primary' : 'hover:bg-slate-50 border-slate-200'}`}
                             >
                                 <p className="text-sm font-medium">
                                     {method.payment_method?.name_en || 'Card'} 
                                     <span className="text-slate-500 ml-2">**** {method.card_number?.slice(-4)}</span>
                                 </p>
                                 {selectedPaymentMethod === method && <CheckCircle size={16} className="text-primary"/>}
                             </div>
                         ))
                     )}
                     <div onClick={() => setSelectedPaymentMethod('new')}
                         className={`p-3 rounded-lg border cursor-pointer ${selectedPaymentMethod === 'new' ? 'bg-primary/10 border-primary' : 'hover:bg-slate-50 border-slate-200'}`}
                     >
                         <p className="font-semibold text-sm">+ Add a new card</p>
                     </div>

                     {selectedPaymentMethod === 'new' && (
                         <div className="p-4 border border-slate-200 rounded-lg mt-2 space-y-3 bg-slate-50/50">
                             <Select 
                                label="Card Brand"
                                options={[
                                    {value: 'VISA', label: 'Visa'},
                                    {value: 'MASTERCARD', label: 'Mastercard'},
                                    {value: 'MADA', label: 'Mada'}
                                ]}
                                value={newCardDetails.payment_brand}
                                onChange={e => setNewCardDetails({...newCardDetails, payment_brand: e.target.value})}
                             />
                             <Input 
                                label={t.cardNumber} 
                                value={newCardDetails.card_number} 
                                onChange={e => setNewCardDetails({...newCardDetails, card_number: e.target.value.replace(/\D/g, '')})} 
                                placeholder="0000 0000 0000 0000"
                             />
                             <Input 
                                label={t.cardHolder} 
                                value={newCardDetails.card_holder} 
                                onChange={e => setNewCardDetails({...newCardDetails, card_holder: e.target.value})} 
                                placeholder="Name on card"
                             />
                             <div className="grid grid-cols-3 gap-2">
                               <Input label="MM" placeholder="01" value={newCardDetails.expiry_month} onChange={e => setNewCardDetails({...newCardDetails, expiry_month: e.target.value})} />
                               <Input label="YY" placeholder="25" value={newCardDetails.expiry_year} onChange={e => setNewCardDetails({...newCardDetails, expiry_year: e.target.value})} />
                               <Input label="CVV" placeholder="123" value={newCardDetails.cvv} onChange={e => setNewCardDetails({...newCardDetails, cvv: e.target.value})} />
                             </div>
                         </div>
                     )}
                  </div>
              );
          // --- STEP 4: SUCCESS ---
          case 4:
              return (
                  <div className="text-center py-8">
                      <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} className="text-green-600" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">{t.bookingSuccess}</h2>
                      <p className="text-slate-500 mt-2">Your booking with {teacher.first_name} has been confirmed.</p>
                  </div>
              );
      }
  };
  
  const getNextButtonText = () => {
    switch(step) {
      case 1: return "Next: Select Time";
      case 2: return "Next: Payment";
      case 3: return `Confirm & Pay ${teacher.individual_hour_price} ${t.sar}`;
      default: return "";
    }
  };

  const isNextDisabled = () => {
      if (step === 1 && !selectedSubject) return true;
      if (step === 2 && !selectedTimeslot) return true;
      if (step === 3 && !selectedPaymentMethod) return true;
      // Basic validation for new card
      if (step === 3 && selectedPaymentMethod === 'new') {
          if(!newCardDetails.card_number || !newCardDetails.expiry_month || !newCardDetails.expiry_year || !newCardDetails.cvv) return true;
      }
      return false;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={step === 4 ? t.bookingSuccess : `${t.bookNow}: ${teacher.first_name}`}>
      <div className="min-h-[350px] flex flex-col">
        {/* Progress Bar */}
        {step < 4 && (
          <div className="flex justify-between items-center mb-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
             <span className={`pb-2 border-b-2 transition-colors flex-1 text-center ${step >= 1 ? 'text-primary border-primary' : 'border-slate-100'}`}>Subject</span>
             <span className={`pb-2 border-b-2 transition-colors flex-1 text-center ${step >= 2 ? 'text-primary border-primary' : 'border-slate-100'}`}>Time</span>
             <span className={`pb-2 border-b-2 transition-colors flex-1 text-center ${step >= 3 ? 'text-primary border-primary' : 'border-slate-100'}`}>Payment</span>
          </div>
        )}

        {error && (
            <div className="p-3 mb-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start gap-2 text-sm">
                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
            </div>
        )}

        <div className="flex-1">
            {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 mt-6 pt-4">
          {step < 3 && (
            <Button className="w-full" onClick={() => setStep(s => s + 1)} disabled={isNextDisabled()}>
              {getNextButtonText()}
            </Button>
          )}
          {step === 3 && (
            <Button className="w-full" onClick={handleConfirm} isLoading={loading} disabled={isNextDisabled()}>
              {getNextButtonText()}
            </Button>
          )}
          {step === 4 && (
            <Button className="w-full" onClick={onClose}>Done</Button>
          )}
        </div>
      </div>
    </Modal>
  );
};