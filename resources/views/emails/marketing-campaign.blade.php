<!DOCTYPE html>
<html lang="ar" dir="auto">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 15px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 28px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: center; border-bottom: 4px solid #7dc242;">
                            <h2 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">{{ config('app.name', 'Ewan - إيوان') }}</h2>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 36px 32px;">
                            <h1 style="margin: 0 0 20px; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.4;">
                                {{ $title }}
                            </h1>
                            
                            <p style="margin: 0 0 16px; font-size: 15px; color: #64748b;">
                                {{ $userName ? (app()->getLocale() === 'ar' ? "مرحباً $userName،" : "Hello $userName,") : (app()->getLocale() === 'ar' ? 'مرحباً،' : 'Hello,') }}
                            </p>
                            
                            <div style="font-size: 15px; line-height: 1.8; color: #334155; white-space: pre-line; background-color: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #7dc242; margin-bottom: 28px;">
                                {!! nl2br(e($bodyContent)) !!}
                            </div>
                            
                            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #64748b;">
                                {{ app()->getLocale() === 'ar' ? 'مع أطيب التحيات،' : 'Best regards,' }}<br>
                                <strong style="color: #0f172a;">{{ config('app.name', 'Ewan Team') }}</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 32px; background-color: #f1f5f9; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 4px;">{{ config('app.name', 'Ewan') }} © {{ date('Y') }}. All rights reserved.</p>
                            <p style="margin: 0;">{{ app()->getLocale() === 'ar' ? 'تلقيت هذه الرسالة لأنك مسجل في منصتنا.' : 'You received this email because you are registered on our platform.' }}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
