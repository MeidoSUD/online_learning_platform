<!DOCTYPE html>
<html dir="auto" lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $type === 'reset' ? 'Password Reset Verification Code' : 'Email Verification Code' }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .email-wrapper {
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            font-size: 24px;
            margin-bottom: 5px;
        }
        .header p {
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 30px 20px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #333;
        }
        .verification-section {
            background-color: #f9f9f9;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .verification-code {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            text-align: center;
            letter-spacing: 5px;
            font-family: 'Courier New', monospace;
            margin: 15px 0;
            padding: 15px;
            background-color: #ffffff;
            border-radius: 4px;
            border: 2px dashed #667eea;
        }
        .info-text {
            font-size: 14px;
            color: #666;
            margin: 15px 0;
            line-height: 1.6;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 13px;
            color: #856404;
        }
        .footer {
            border-top: 1px solid #e0e0e0;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
        }
        .footer p {
            margin: 5px 0;
        }
        .divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <!-- Header -->
            <div class="header">
                <h1>{{ $type === 'reset' ? 'Password Reset Request' : 'Email Verification' }}</h1>
                <p>{{ $type === 'reset' ? 'إعادة تعيين كلمة المرور' : 'التحقق من البريد الإلكتروني' }}</p>
            </div>

            <!-- Content -->
            <div class="content">
                <p class="greeting">
                    {{ $type === 'reset' ? 'Hello' : 'Welcome' }}, {{ $user->first_name }}!
                </p>

                @if ($type === 'register')
                    <p class="info-text">
                        Thank you for registering with Ewan Geniuses! To complete your account setup, please use the verification code below to verify your email address.
                    </p>
                    <p class="info-text" style="direction: rtl; text-align: right;">
                        شكراً لتسجيلك في إيوان جينيوسز! لإكمال إعداد حسابك، يرجى استخدام رمز التحقق أدناه للتحقق من عنوان بريدك الإلكتروني.
                    </p>
                @else
                    <p class="info-text">
                        You requested a password reset for your account. Use the verification code below to proceed with resetting your password.
                    </p>
                    <p class="info-text" style="direction: rtl; text-align: right;">
                        لقد طلبت إعادة تعيين كلمة المرور لحسابك. استخدم رمز التحقق أدناه للمتابعة مع إعادة تعيين كلمة المرور الخاصة بك.
                    </p>
                @endif

                <!-- Verification Code Section -->
                <div class="verification-section">
                    <p style="text-align: center; color: #666; margin-bottom: 10px;">
                        {{ $type === 'reset' ? 'Your Verification Code' : 'Your Verification Code' }}
                    </p>
                    <div class="verification-code">{{ $verificationCode }}</div>
                    <p style="text-align: center; color: #999; font-size: 13px;">
                        This code will expire in 10 minutes
                    </p>
                </div>

                <!-- Warning -->
                <div class="warning">
                    <strong>⚠️ Security Notice:</strong> Never share this code with anyone. Ewan Geniuses support staff will never ask you for this code.
                </div>

                <p class="info-text">
                    If you did not request {{ $type === 'reset' ? 'a password reset' : 'to register' }}, please ignore this email or contact our support team immediately.
                </p>

                <div class="divider"></div>

                <p class="info-text" style="font-size: 13px;">
                    Have questions? Contact us at <strong>contact@ewan-geniuses.com</strong>
                </p>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p>© {{ date('Y') }} Ewan Geniuses. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
                <p style="margin-top: 10px; color: #666;">
                    Ewan Geniuses | Online Learning Platform
                </p>
            </div>
        </div>
    </div>
</body>
</html>
