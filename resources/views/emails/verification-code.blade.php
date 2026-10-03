<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9fa; color: #1e293b; margin: 0; padding: 24px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; padding: 32px 28px;">
                    <tr>
                        <td>
                            <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a;">
                                Ewan Learning
                            </h2>
                            <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #334155;">
                                Hi {{ $user->first_name ?? $user->name ?? 'there' }},
                            </p>
                            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #334155;">
                                Your verification code is:
                            </p>
                            <div style="background-color: #f1f5f9; border-radius: 8px; padding: 18px 24px; text-align: center; margin: 0 0 20px;">
                                <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0f766e; font-family: monospace;">
                                    {{ $verificationCode }}
                                </span>
                            </div>
                            <p style="margin: 0 0 16px; font-size: 13px; line-height: 1.5; color: #64748b;">
                                This code expires in 10 minutes. If you did not request this email, you can safely ignore it.
                            </p>
                            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px;" />
                            <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                                Ewan Learning &bull; <a href="https://portal.ewan-geniuses.com" style="color: #0f766e; text-decoration: none;">portal.ewan-geniuses.com</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
