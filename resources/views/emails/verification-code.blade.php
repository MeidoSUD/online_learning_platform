<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Code</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f7; color: #51545e; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center" style="padding: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="padding: 30px; text-align: center; background-color: #3869d4; color: #ffffff;">
                            <h1 style="margin: 0; font-size: 24px;">Verification Code</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px;">
                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5;">
                                Hello {{ $user->name ?? 'User' }},
                            </p>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5;">
                                Your verification code is:
                            </p>
                            <p style="margin: 0 0 32px; font-size: 32px; font-weight: bold; letter-spacing: 1px; color: #3869d4;">
                                {{ $verificationCode }}
                            </p>
                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5;">
                                This code will expire shortly. If you did not request this email, please ignore it.
                            </p>
                            @if($type === 'reset')
                                <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5;">
                                    Use this code to reset your account password.
                                </p>
                            @endif
                            <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #6b6e76;">
                                Thank you,
                                <br>
                                The Team
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px; text-align: center; background-color: #f4f4f7; color: #6b6e76; font-size: 12px;">
                            If you have any questions, reply to this email.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
