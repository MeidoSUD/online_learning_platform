<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ app()->getLocale() == 'ar' ? 'التحقق من البريد الإلكتروني' : 'Email Verification' }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #0d6efd;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #0d6efd;
            margin: 0;
            font-size: 24px;
        }
        .content {
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #0d6efd;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #0b5ed7;
        }
        .button-container {
            text-align: center;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .link-text {
            word-break: break-all;
            color: #666;
            font-size: 12px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>{{ app()->getLocale() == 'ar' ? 'التحقق من البريد الإلكتروني' : 'Email Verification' }}</h1>
        </div>

        <div class="content">
            <p>{{ app()->getLocale() == 'ar' ? 'مرحباً' : 'Hello' }} <strong>{{ $user->name }}</strong>,</p>

            <p>
                @if(app()->getLocale() == 'ar')
                    شكراً لتحديث بريدك الإلكتروني. للمتابعة، يرجى التحقق من عنوان بريدك الإلكتروني الجديد بالنقر على الزر أدناه:
                @else
                    Thank you for updating your email address. To continue, please verify your new email address by clicking the button below:
                @endif
            </p>

            <div class="button-container">
                <a href="{{ $verificationUrl }}" class="button">
                    {{ app()->getLocale() == 'ar' ? 'تحقق من البريد الإلكتروني' : 'Verify Email Address' }}
                </a>
            </div>

            <div class="warning">
                <strong>{{ app()->getLocale() == 'ar' ? '⚠️ تنبيه أمني:' : '⚠️ Security Notice:' }}</strong><br>
                @if(app()->getLocale() == 'ar')
                    هذا الرابط صالح لمدة 24 ساعة فقط. إذا لم تقم بطلب هذا التغيير، يرجى تجاهل هذا البريد الإلكتروني أو الاتصال بفريق الدعم.
                @else
                    This link is valid for 24 hours only. If you didn't request this change, please ignore this email or contact our support team.
                @endif
            </div>

            <p>
                @if(app()->getLocale() == 'ar')
                    إذا لم يعمل الزر أعلاه، انسخ الرابط التالي والصقه في متصفحك:
                @else
                    If the button above doesn't work, copy and paste the following link into your browser:
                @endif
            </p>
            <p class="link-text">{{ $verificationUrl }}</p>
        </div>

        <div class="footer">
            <p>
                @if(app()->getLocale() == 'ar')
                    هذه رسالة تلقائية، يرجى عدم الرد عليها.<br>
                    © {{ date('Y') }} جميع الحقوق محفوظة.
                @else
                    This is an automated message, please do not reply.<br>
                    © {{ date('Y') }} All rights reserved.
                @endif
            </p>
        </div>
    </div>
</body>
</html>