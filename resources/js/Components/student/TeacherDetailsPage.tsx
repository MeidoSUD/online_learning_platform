
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ArrowLeft, BookOpen, Clock, CreditCard, CheckCircle, AlertTriangle, Star, Loader2 } from 'lucide-react';
import { TeacherProfile, StudentPaymentMethod, studentService, getStorageUrl } from '../../Services/api';

interface TeacherDetailsPageProps {
  teacher: TeacherProfile;
  serviceId: number;
  onBack: () => void;
  onBookingComplete: () => void;
}

export const TeacherDetailsPage: React.FC<TeacherDetailsPageProps> = ({ teacher, serviceId, onBack, onBookingComplete }) => {
  const { t, language, direction } = useLanguage();
  
  // States
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Selection
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedTimeslotId, setSelectedTimeslotId] = useState<number | null>(null);
  
  // Booking Data
  const [createdBooking, setCreatedBooking] = useState<any | null>(null);
  
  // Payment Data
  const [paymentMethods, setPaymentMethods] = useState<StudentPaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<StudentPaymentMethod | 'new' | null>(null);
  const [newCardDetails, setNewCardDetails] = useState({
    card_number: '', 
    card_holder: '', 
    expiry_month: '', 
    expiry_year: '', 
    cvv: '', 
    payment_brand: 'VISA'
  });

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const methods = await studentService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (e) {
      console.error("Failed to load payment methods", e);
    }
  };

  const handleCreateBooking = async () => {
      if (!selectedSubjectId || !selectedTimeslotId) {
          setError(language === 'ar' ? "يرجى اختيار المادة والوقت" : "Please select a subject and a time.");
          return;
      }

      setLoading(true);
      setError(null);

      try {
          const payload = {
              teacher_id: teacher.id,
              service_id: serviceId,
              subject_id: selectedSubjectId,
              timeslot_id: selectedTimeslotId,
              type: 'single' as const
          };

          const response = await studentService.createBooking(payload);
          
          // Robust ID Extraction
          let bookingId = response.id;
          if (!bookingId && response.data?.id) bookingId = response.data.id;
          if (!bookingId && response.booking?.id) bookingId = response.booking.id;
          if (!bookingId && response.data?.booking?.id) bookingId = response.data.booking.id;
          if (!bookingId && response.data?.data?.id) bookingId = response.data.data.id;

          if (!bookingId) {
             throw new Error("Booking created but ID is missing in response.");
          }
          
          setCreatedBooking({ ...response, id: bookingId });
          await fetchPaymentMethods();
          setStep('payment');

      } catch (e: any) {
          setError(e.message || "Failed to create booking.");
      } finally {
          setLoading(false);
      }
  };

  const handleProcessPayment = async () => {
      if (!createdBooking?.id) {
          setError("Booking ID is missing. Please try booking again.");
          return;
      }
      
      if (!selectedPaymentMethod) {
          setError(language === 'ar' ? "يرجى اختيار طريقة الدفع" : "Please select a payment method");
          return;
      }

      setLoading(true);
      setError(null);

      try {
           let paymentDetails: any;
        
            if (selectedPaymentMethod === 'new') {
                if (!newCardDetails.card_number || !newCardDetails.cvv) {
                     throw new Error("Please complete card details");
                }
                paymentDetails = {
                    card_number: newCardDetails.card_number,
                    card_holder: newCardDetails.card_holder,
                    expiry_month: Number(newCardDetails.expiry_month),
                    expiry_year: Number(newCardDetails.expiry_year),
                    cvv: newCardDetails.cvv,
                    payment_brand: newCardDetails.payment_brand
                };
            } else {
                paymentDetails = {
                    card_number: selectedPaymentMethod.card_number || '',
                    card_holder: selectedPaymentMethod.card_holder_name || '',
                    expiry_month: Number(selectedPaymentMethod.card_expiry_month),
                    expiry_year: Number(selectedPaymentMethod.card_expiry_year),
                    cvv: selectedPaymentMethod.card_cvc || '000', 
                    payment_brand: selectedPaymentMethod.payment_method?.name_en.toUpperCase() || 'VISA'
                };
            }
            
            const paymentPayload = {
                booking_id: createdBooking.id, 
                ...paymentDetails,
            };

            const payResponse = await studentService.processPayment(paymentPayload);
            
            // --- HANDLE HYPERPAY RESPONSE ACCORDING TO PROVIDED JSON ---
            // Structure: data.redirect_url.url
            const redirectUrl = payResponse.data?.redirect_url?.url 
                             || payResponse.redirect_url?.url
                             || payResponse.redirect_url;

            if (redirectUrl && (payResponse.requires_3ds || payResponse.data?.requires_3ds)) {
                console.log("Redirecting to 3DS verification:", redirectUrl);
                window.location.href = typeof redirectUrl === 'string' ? redirectUrl : redirectUrl.url;
                return;
            }

            // Success handling
            if (payResponse.success) {
                setStep('success');
            } else {
                const msg = payResponse.message || "Payment failed. Please check your card details.";
                setError(msg);
            }

      } catch (e: any) {
          setError(e.message || "Payment processing failed.");
      } finally {
          setLoading(false);
      }
  };

  const renderDetails = () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Left: Teacher Info */}
          <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
                  <div className="flex flex-col items-center text-center">
                      <div className="h-28 w-28 rounded-full bg-slate-100 mb-4 overflow-hidden border-4 border-white shadow-md">
                          {teacher.profile_image ? (
                              <img src={getStorageUrl(teacher.profile_image)} alt={teacher.first_name} className="h-full w-full object-cover" />
                          ) : (
                              <span className="h-full w-full flex items-center justify-center text-4xl font-bold text-slate-300">
                                  {teacher.first_name.charAt(0)}
                              </span>
                          )}
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">{teacher.first_name} {teacher.last_name}</h2>
                      <div className="flex items-center gap-1 text-amber-500 font-bold mt-1">
                          <Star size={16} fill="currentColor" /> {teacher.rating?.toFixed(1) || '5.0'}
                      </div>
                      <div className="mt-4 w-full bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
                          {teacher.bio || "No biography provided."}
                      </div>
                  </div>
              </div>
          </div>

          {/* Right: Booking Selection */}
          <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <BookOpen className="text-primary" size={20} />
                      {language === 'ar' ? 'اختر المادة' : 'Select Subject'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(!teacher.teacher_subjects || teacher.teacher_subjects.length === 0) ? (
                          <p className="text-slate-500 italic">No subjects available.</p>
                      ) : (
                          teacher.teacher_subjects?.map(sub => {
                              const currentId = sub.subject_id || sub.id; 
                              const isSelected = selectedSubjectId === currentId;
                              
                              return (
                              <button 
                                  key={sub.id} 
                                  onClick={() => setSelectedSubjectId(currentId)}
                                  type="button"
                                  className={`p-4 rounded-xl border text-start transition-all cursor-pointer ${
                                      isSelected
                                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 ring-2 ring-primary ring-offset-1' 
                                      : 'bg-white border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                                  }`}
                              >
                                  <div className="font-bold">{sub.title}</div>
                                  <div className={`text-xs mt-1 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                                      {sub.class_level_title} • {sub.class_title}
                                  </div>
                              </button>
                          )})
                      )}
                  </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Clock className="text-primary" size={20} />
                      {language === 'ar' ? 'اختر الوقت' : 'Select Time'}
                  </h3>
                  {(!teacher.available_times || teacher.available_times.length === 0) ? (
                      <div className="text-center py-8 text-slate-500 italic bg-slate-50 rounded-xl">
                          No available times slots found for this teacher.
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {teacher.available_times?.map(day => {
                              let timeItems = [];
                              if (day.time_slots && Array.isArray(day.time_slots)) {
                                  timeItems = day.time_slots;
                              } else if (day.times && Array.isArray(day.times)) {
                                  timeItems = day.times.map(t => typeof t === 'string' ? { id: 0, time: t } : t);
                              }
                              
                              if (timeItems.length === 0) return null;

                              return (
                              <div key={day.id || day.day || Math.random()}>
                                  <h4 className="font-medium text-slate-700 mb-2">Day {day.day}</h4>
                                  <div className="flex flex-wrap gap-2">
                                      {timeItems.map((timeItem: any) => {
                                          if (!timeItem || !timeItem.time) return null;
                                          if (!!timeItem.session) return null; 

                                          return (
                                          <button 
                                              key={timeItem.id} 
                                              onClick={() => setSelectedTimeslotId(timeItem.id)}
                                              type="button"
                                              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                                                  selectedTimeslotId === timeItem.id 
                                                  ? 'bg-primary text-white border-primary shadow-md ring-2 ring-primary ring-offset-1' 
                                                  : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'
                                              }`}
                                          >
                                              {timeItem.time}
                                          </button>
                                      )})}
                                  </div>
                              </div>
                          )})}
                      </div>
                  )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky bottom-4">
                  <div className="flex justify-between items-center">
                      <div>
                          <p className="text-sm text-slate-500">{language === 'ar' ? 'السعر للساعة' : 'Price per hour'}</p>
                          <p className="text-2xl font-bold text-primary">{teacher.individual_hour_price} {t.sar}</p>
                      </div>
                      <Button 
                          size="lg" 
                          onClick={handleCreateBooking}
                          isLoading={loading}
                          disabled={!selectedSubjectId || !selectedTimeslotId}
                          className="px-8"
                      >
                          {language === 'ar' ? 'حجز الموعد' : 'Book Session'}
                      </Button>
                  </div>
                  {error && (
                      <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                          <AlertTriangle size={16} /> {error}
                      </div>
                  )}
              </div>
          </div>
      </div>
  );

  const renderPayment = () => {
    const displayPrice = createdBooking?.price || teacher.individual_hour_price;
    const bookingRef = createdBooking?.id ? `#${createdBooking.id}` : '';

    return (
      <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
          <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3 text-green-800 shadow-sm">
              <CheckCircle className="flex-shrink-0" />
              <div>
                  <h3 className="font-bold">Booking Created Successfully!</h3>
                  <p className="text-sm opacity-80">
                    {language === 'ar' 
                      ? `تم إنشاء الحجز برقم ${bookingRef}. يرجى إتمام الدفع لتأكيد الموعد.` 
                      : `Booking ${bookingRef} created. Please complete payment to confirm your session.`}
                  </p>
              </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CreditCard className="text-primary" size={20} />
                  {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
              </h3>
              
              <div className="space-y-3 mb-6">
                  {paymentMethods.map(method => (
                      <div 
                          key={method.id} 
                          onClick={() => setSelectedPaymentMethod(method)}
                          className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                              selectedPaymentMethod === method 
                              ? 'bg-blue-50 border-primary ring-1 ring-primary' 
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                          <div className="flex items-center gap-3">
                              <CreditCard className="text-slate-400" />
                              <div>
                                  <p className="font-semibold text-slate-900">{method.payment_method?.name_en || 'Card'}</p>
                                  <p className="text-xs text-slate-500">**** {method.card_number?.slice(-4)}</p>
                              </div>
                          </div>
                          {selectedPaymentMethod === method && <div className="h-4 w-4 rounded-full bg-primary" />}
                      </div>
                  ))}
                  
                  <div 
                      onClick={() => setSelectedPaymentMethod('new')}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer border-dashed transition-all ${
                          selectedPaymentMethod === 'new' 
                          ? 'bg-blue-50 border-primary ring-1 ring-primary' 
                          : 'bg-slate-50 border-slate-300 hover:bg-slate-100'
                      }`}
                  >
                      <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                          <span className="text-xl font-bold text-slate-400">+</span>
                      </div>
                      <p className="font-semibold text-slate-600">{language === 'ar' ? 'إضافة بطاقة جديدة' : 'Add New Card'}</p>
                  </div>
              </div>

              {selectedPaymentMethod === 'new' && (
                   <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4 animate-fade-in">
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
                       <div className="grid grid-cols-3 gap-3">
                         <Input label="MM" placeholder="01" value={newCardDetails.expiry_month} onChange={e => setNewCardDetails({...newCardDetails, expiry_month: e.target.value})} />
                         <Input label="YY" placeholder="25" value={newCardDetails.expiry_year} onChange={e => setNewCardDetails({...newCardDetails, expiry_year: e.target.value})} />
                         <Input label="CVV" placeholder="000" value={newCardDetails.cvv} onChange={e => setNewCardDetails({...newCardDetails, cvv: e.target.value})} />
                       </div>
                   </div>
               )}
               
               {error && (
                   <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 mt-4">
                       <AlertTriangle size={16} /> {error}
                   </div>
               )}

               <Button className="w-full mt-6" size="lg" onClick={handleProcessPayment} isLoading={loading}>
                   {language === 'ar' ? `دفع ${displayPrice} ريال` : `Pay ${displayPrice} SAR`}
               </Button>
          </div>
      </div>
    );
  };

  const renderSuccess = () => (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in bg-white rounded-3xl shadow-lg border border-slate-100 max-w-2xl mx-auto">
          <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <CheckCircle size={48} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{language === 'ar' ? 'تم الدفع بنجاح!' : 'Payment Successful!'}</h2>
          <p className="text-slate-500 mb-8 text-center max-w-md px-4">
              {language === 'ar' 
                  ? 'تم تأكيد حجزك بنجاح. يمكنك استعراض تفاصيل الموعد في جدولك الدراسي.' 
                  : 'Your booking has been successfully confirmed. You can view the session details in your schedule.'}
          </p>
          <div className="w-full max-w-sm space-y-3 px-4">
              <Button className="w-full shadow-lg shadow-primary/20" onClick={onBookingComplete}>
                  {language === 'ar' ? 'الذهاب للحجوزات' : 'Go to Bookings'}
              </Button>
              <Button variant="ghost" className="w-full text-slate-500 hover:bg-slate-50" onClick={onBack}>
                  {language === 'ar' ? 'حجز موعد آخر' : 'Book Another Session'}
              </Button>
          </div>
      </div>
  );

  return (
    <div className="animate-fade-in pb-10">
      {/* Header */}
      {step !== 'success' && (
        <div className="mb-6 flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                <ArrowLeft className={direction === 'rtl' ? 'rotate-180' : ''} />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">
                {step === 'details' ? (language === 'ar' ? 'حجز موعد' : 'Book Session') : 
                step === 'payment' ? (language === 'ar' ? 'إتمام الدفع' : 'Complete Payment') : ''}
            </h1>
        </div>
      )}

      {step === 'details' && renderDetails()}
      {step === 'payment' && renderPayment()}
      {step === 'success' && renderSuccess()}
    </div>
  );
};
