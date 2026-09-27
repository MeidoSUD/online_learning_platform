<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}" dir="{{ app()->getLocale() == 'ar' ? 'rtl' : 'ltr' }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ __('Contact Support') }} - {{ config('app.name', 'Ewan') }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #10B981;
            --primary-dark: #059669;
            --primary-light: #34D399;
            --navy: #0F172A;
            --bg-light: #F8FAFC;
            --text-main: #1E293B;
            --text-muted: #64748B;
            --border: #E2E8F0;
            --card-bg: #FFFFFF;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: {{ app()->getLocale() == 'ar' ? "'Cairo', sans-serif" : "'Inter', sans-serif" }};
            background-color: var(--bg-light);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 24px 16px;
        }
        .container {
            max-width: 560px;
            width: 100%;
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 20px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
            padding: 36px 32px;
        }
        .header {
            text-align: center;
            margin-bottom: 28px;
        }
        .header .logo {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 54px;
            height: 54px;
            border-radius: 14px;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            color: #fff;
            font-size: 26px;
            font-weight: bold;
            margin-bottom: 16px;
        }
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            color: var(--navy);
            margin-bottom: 8px;
        }
        .header p {
            font-size: 14px;
            color: var(--text-muted);
            line-height: 1.5;
        }
        .form-group {
            margin-bottom: 18px;
        }
        .form-group label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: var(--navy);
            margin-bottom: 6px;
        }
        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 12px 14px;
            border: 1px solid var(--border);
            border-radius: 10px;
            font-size: 14px;
            font-family: inherit;
            color: var(--text-main);
            background: #FAFAFA;
            transition: all 0.2s ease;
        }
        .form-group input:focus,
        .form-group textarea:focus {
            outline: none;
            background: #FFF;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }
        .form-group textarea {
            resize: vertical;
            min-height: 110px;
        }
        .btn-submit {
            width: 100%;
            padding: 13px 20px;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            color: #fff;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            font-family: inherit;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
        }
        .btn-submit:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }
        .btn-submit:disabled {
            opacity: 0.65;
            cursor: not-allowed;
            transform: none;
        }
        .alert {
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 14px;
            margin-bottom: 20px;
            display: none;
        }
        .alert-success {
            background-color: #ECFDF5;
            color: #065F46;
            border: 1px solid #A7F3D0;
        }
        .alert-error {
            background-color: #FEF2F2;
            color: #991B1B;
            border: 1px solid #FECACA;
        }
        .footer {
            text-align: center;
            margin-top: 24px;
            font-size: 13px;
            color: var(--text-muted);
        }
        .footer a {
            color: var(--primary);
            text-decoration: none;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">E</div>
            <h1>{{ app()->getLocale() == 'ar' ? 'تواصل مع الدعم الفني' : 'Contact Support' }}</h1>
            <p>{{ app()->getLocale() == 'ar' ? 'نحن هنا لمساعدتك! أرسل استفسارك وسيقوم فريقنا بالرد عليك في أقرب وقت.' : 'We are here to help! Send us your inquiry and our support team will get back to you shortly.' }}</p>
        </div>

        <div id="alertSuccess" class="alert alert-success"></div>
        <div id="alertError" class="alert alert-error"></div>

        <form id="contactForm">
            @csrf
            <div class="form-group">
                <label for="name">{{ app()->getLocale() == 'ar' ? 'الاسم الكامل' : 'Full Name' }} *</label>
                <input type="text" id="name" name="name" required placeholder="{{ app()->getLocale() == 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name' }}">
            </div>

            <div class="form-group">
                <label for="email">{{ app()->getLocale() == 'ar' ? 'البريد الإلكتروني' : 'Email Address' }} *</label>
                <input type="email" id="email" name="email" required placeholder="name@example.com">
            </div>

            <div class="form-group">
                <label for="subject">{{ app()->getLocale() == 'ar' ? 'الموضوع' : 'Subject' }} *</label>
                <input type="text" id="subject" name="subject" required placeholder="{{ app()->getLocale() == 'ar' ? 'عنوان الرسالة' : 'Brief subject of your issue' }}">
            </div>

            <div class="form-group">
                <label for="message">{{ app()->getLocale() == 'ar' ? 'الرسالة' : 'Message' }} *</label>
                <textarea id="message" name="message" required placeholder="{{ app()->getLocale() == 'ar' ? 'اكتب تفاصيل استفسارك أو مشكلتك...' : 'Describe your question or issue in detail...' }}"></textarea>
            </div>

            <button type="submit" id="submitBtn" class="btn-submit">
                <span>{{ app()->getLocale() == 'ar' ? 'إرسال الرسالة' : 'Send Message' }}</span>
            </button>
        </form>

        <div class="footer">
            <p>&copy; {{ date('Y') }} {{ config('app.name', 'Ewan Platform') }}. <a href="/">{{ app()->getLocale() == 'ar' ? 'العودة للرئيسية' : 'Back to Home' }}</a></p>
        </div>
    </div>

    <script>
        const form = document.getElementById('contactForm');
        const submitBtn = document.getElementById('submitBtn');
        const alertSuccess = document.getElementById('alertSuccess');
        const alertError = document.getElementById('alertError');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            alertSuccess.style.display = 'none';
            alertError.style.display = 'none';
            submitBtn.disabled = true;

            const payload = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };

            try {
                const res = await fetch('/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': '{{ csrf_token() }}'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    alertSuccess.textContent = data.message || '{{ app()->getLocale() == 'ar' ? "تم إرسال رسالتك بنجاح! سنتواصل معك قريباً." : "Your message was sent successfully! We will get back to you soon." }}';
                    alertSuccess.style.display = 'block';
                    form.reset();
                } else {
                    let errMsg = data.message || '{{ app()->getLocale() == 'ar' ? "حدث خطأ أثناء الإرسال. يرجى التحقق من البيانات والمحاولة مجدداً." : "An error occurred. Please check your input and try again." }}';
                    if (data.errors) {
                        const firstErr = Object.values(data.errors)[0];
                        if (Array.isArray(firstErr) && firstErr.length > 0) {
                            errMsg = firstErr[0];
                        }
                    }
                    alertError.textContent = errMsg;
                    alertError.style.display = 'block';
                }
            } catch (err) {
                alertError.textContent = '{{ app()->getLocale() == 'ar' ? "تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً." : "Network error. Please try again later." }}';
                alertError.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
            }
        });
    </script>
</body>
</html>
