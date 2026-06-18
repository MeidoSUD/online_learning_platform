import React, { useState } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Footer } from './Footer';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { language, direction } = useLanguage();
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const name = data.get('name') as string;
    const email = data.get('email') as string;
    const product = data.get('product') as string;
    const message = data.get('message') as string;
    const body = `Name: ${name}%0D%0AEmail: ${email}%0D%0AProduct: ${product}%0D%0A%0D%0A${message}`;
    window.location.href = `mailto:contact@ewan-geniuses.com?subject=${language === 'ar' ? 'استفسار من' : 'Inquiry from'} ${name}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-white" dir={direction}>
      <section className="pt-32 pb-20 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">{language === 'ar' ? 'اتصل بنا' : 'Contact Us'}</h1>
            <p className="text-slate-500 text-lg">{language === 'ar' ? 'تواصل معنا لأي استفسار حول منتجاتنا وخدماتنا' : 'Get in touch with us for any inquiries about our products and services'}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className={`bg-white rounded-2xl p-8 shadow-xl border border-slate-100 space-y-6 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}</h2>
                <p className="text-slate-500 mb-6">{language === 'ar' ? 'نحن هنا لمساعدتك' : 'We are here to help you'}</p>

                <div className={`flex items-center gap-4 ${direction === 'rtl' ? 'flex-row' : 'flex-row'}`}>
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-primary shrink-0"><MapPin size={22} /></div>
                  <div>
                    <p className="font-bold text-slate-900">{language === 'ar' ? 'العنوان' : 'Address'}</p>
                    <p className="text-slate-500">{language === 'ar' ? 'جدة - شارع الأمير سلطان' : 'Jeddah - ALameer Sultan Street'}</p>
                  </div>
                </div>

                <div className={`flex items-center gap-4 ${direction === 'rtl' ? 'flex-row' : 'flex-row'}`}>
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0"><Phone size={22} /></div>
                  <div>
                    <p className="font-bold text-slate-900">{language === 'ar' ? 'الهاتف' : 'Phone'}</p>
                    <p className="text-slate-500">+966 555683154</p>
                  </div>
                </div>

                <div className={`flex items-center gap-4 ${direction === 'rtl' ? 'flex-row' : 'flex-row'}`}>
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0"><Mail size={22} /></div>
                  <div>
                    <p className="font-bold text-slate-900">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                    <p className="text-slate-500">contact@ewan-geniuses.com</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-8 text-white">
                <MessageSquare size={32} className="mb-4 opacity-80" />
                <h3 className="text-xl font-bold mb-2">{language === 'ar' ? 'نحن نسمعك' : 'We Listen'}</h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  {language === 'ar'
                    ? 'نحن ملتزمون بالرد على جميع الاستفسارات خلال 24 ساعة عمل. فريقنا جاهز لمساعدتك.'
                    : 'We are committed to responding to all inquiries within 24 business hours. Our team is ready to assist you.'}
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle2 size={64} className="text-green-500 mb-6" />
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{language === 'ar' ? 'تم الإرسال!' : 'Sent Successfully!'}</h3>
                  <p className="text-slate-500">{language === 'ar' ? 'سيتم الرد على استفسارك في أقرب وقت.' : 'We will respond to your inquiry shortly.'}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={`space-y-5 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{language === 'ar' ? 'أرسل استفسارك' : 'Send Your Inquiry'}</h2>
                  <p className="text-slate-500 mb-6">{language === 'ar' ? 'اختر المنتج واكتب رسالتك' : 'Select a product and write your message'}</p>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{language === 'ar' ? 'الاسم' : 'Name'}</label>
                    <input name="name" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-slate-50" placeholder={language === 'ar' ? 'اسمك الكامل' : 'Your full name'} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                    <input name="email" type="email" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-slate-50" placeholder="email@example.com" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{language === 'ar' ? 'المنتج' : 'Product'}</label>
                    <select name="product" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-slate-50">
                      <option value="">{language === 'ar' ? 'اختر المنتج' : 'Select product'}</option>
                      <option value="Ewan App">{language === 'ar' ? 'تطبيق Ewan' : 'Ewan App'}</option>
                      <option value="Smart School">{language === 'ar' ? 'نظام المدرسة الذكية' : 'Smart School System'}</option>
                      <option value="Other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{language === 'ar' ? 'الرسالة' : 'Message'}</label>
                    <textarea name="message" required rows={5} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-slate-50 resize-none" placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'} />
                  </div>

                  <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                    <Send size={18} /> {language === 'ar' ? 'إرسال' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};
