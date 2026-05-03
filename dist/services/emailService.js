import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
const buildOtpEmailHtml = (username, otp) => {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Verify your PropertyLA account</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#222;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;">
            <tr>
              <td style="background:#0d6efd;padding:24px 32px;color:#ffffff;">
                <h1 style="margin:0;font-size:22px;font-weight:600;">PropertyLA</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 16px;font-size:20px;color:#111;">Verify your email</h2>
                <p style="margin:0 0 16px;line-height:1.5;">Hi ${username},</p>
                <p style="margin:0 0 24px;line-height:1.5;">
                  Thanks for signing up. Use the one-time code below to verify your email address and activate your account.
                </p>
                <div style="text-align:center;margin:24px 0;">
                  <span style="display:inline-block;font-size:32px;letter-spacing:8px;font-weight:700;color:#0d6efd;background:#eef4ff;padding:16px 24px;border-radius:6px;">
                    ${otp}
                  </span>
                </div>
                <p style="margin:0 0 16px;line-height:1.5;color:#555;font-size:14px;">
                  If you didn't request this, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f0f2f5;padding:16px 32px;color:#888;font-size:12px;text-align:center;">
                &copy; ${new Date().getFullYear()} PropertyLA. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
export const sendOtpEmail = async (to, username, otp) => {
    const from = process.env.MAIL_FROM || "PropertyLA <support@propertyla.com.my>";
    await resend.emails.send({
        from,
        to,
        subject: "Your PropertyLA verification code",
        html: buildOtpEmailHtml(username, otp),
        text: `Hi ${username}, your OTP is ${otp}`,
    });
};
//# sourceMappingURL=emailService.js.map