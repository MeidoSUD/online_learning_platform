import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Footer } from './Footer';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2, ChevronLeft } from 'lucide-react';

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
      {/* Hero */}
      <section className="page-hero -mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-start">
              <nav className="breadcrumb-custom">
                <Link href="/">{language === 'ar' ? 'الرئيسية' : 'Home'}</Link>
                <ChevronLeft size={12} />
                <span className="current">{language === 'ar' ? 'اتصل بنا' : 'Contact Us'}</span>
              </nav>
              <h1 className="text-4xl font-bold">{language === 'ar' ? 'اتصل بنا' : 'Contact Us'}</h1>
              <p className="text-lg">{language === 'ar' ? 'تواصل معنا لأي استفسار حول منتجاتنا وخدماتنا' : 'Get in touch with us for any inquiries about our products and services'}</p>
            </div>
            <div className="flex-1">
              <img src="/heros/contact_us_2.jpg" alt="Contact us" className="w-full max-w-md mx-auto rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-white/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="section-pad">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="contact-info-card">
                <h3 className="text-2xl font-bold mb-2">{language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}</h3>
                <p className="mb-6">{language === 'ar' ? 'نحن هنا لمساعدتك' : 'We are here to help you'}</p>

                <div className="contact-item">
                  <div className="contact-item-icon"><MapPin size={22} /></div>
                  <div className="contact-item-text">
                    <strong>{language === 'ar' ? 'العنوان' : 'Address'}</strong>
                    <span>{language === 'ar' ? 'جدة - شارع الأمير سلطان' : 'Jeddah - ALameer Sultan Street'}</span>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-item-icon"><Phone size={22} /></div>
                  <div className="contact-item-text">
                    <strong>{language === 'ar' ? 'الهاتف' : 'Phone'}</strong>
                    <span>+966 555683154</span>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-item-icon"><Mail size={22} /></div>
                  <div className="contact-item-text">
                    <strong>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</strong>
                    <span>contact@ewan-geniuses.com</span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6 mt-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="contact-item-icon"><MessageSquare size={22} /></div>
                    <div className="contact-item-text">
                      <strong>{language === 'ar' ? 'نحن نسمعك' : 'We Listen'}</strong>
                      <span>
                        {language === 'ar'
                          ? 'نحن ملتزمون بالرد على جميع الاستفسارات خلال 24 ساعة عمل. فريقنا جاهز لمساعدتك.'
                          : 'We are committed to responding to all inquiries within 24 business hours. Our team is ready to assist you.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-card">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle2 size={64} className="text-green mb-6" />
                  <h3 className="text-2xl font-bold text-navy mb-2">{language === 'ar' ? 'تم الإرسال!' : 'Sent Successfully!'}</h3>
                  <p className="mb-0">{language === 'ar' ? 'سيتم الرد على استفسارك في أقرب وقت.' : 'We will respond to your inquiry shortly.'}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h2 className="text-2xl font-bold text-navy mb-2">{language === 'ar' ? 'أرسل استفسارك' : 'Send Your Inquiry'}</h2>
                  <p className="mb-6">{language === 'ar' ? 'اختر المنتج واكتب رسالتك' : 'Select a product and write your message'}</p>

                  <div className="form-group">
                    <label className="form-label">{language === 'ar' ? 'الاسم' : 'Name'}</label>
                    <input name="name" required className="form-input" placeholder={language === 'ar' ? 'اسمك الكامل' : 'Your full name'} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                    <input name="email" type="email" required className="form-input" placeholder="email@example.com" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === 'ar' ? 'المنتج' : 'Product'}</label>
                    <select name="product" required className="form-input">
                      <option value="">{language === 'ar' ? 'اختر المنتج' : 'Select product'}</option>
                      <option value="Ewan App">{language === 'ar' ? 'تطبيق Ewan' : 'Ewan App'}</option>
                      <option value="Smart School">{language === 'ar' ? 'نظام المدرسة الذكية' : 'Smart School System'}</option>
                      <option value="Other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === 'ar' ? 'الرسالة' : 'Message'}</label>
                    <textarea name="message" required rows={5} className="form-input" placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'} />
                  </div>

                  <button type="submit" className="btn-primary-custom w-full text-lg py-4 flex items-center justify-center gap-2">
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
