import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (
  payload: Parameters<typeof resend.emails.send>[0],
  label: string
): Promise<void> => {
  const result = await resend.emails.send(payload);

  if (result.error) {
    console.error(`${label} email failed:`, result.error);
    throw result.error;
  }

  console.log(`${label} email sent:`, result.data?.id || 'accepted');
};

const buildOtpEmailHtml = (username: string, otp: string): string => {
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

export const sendOtpEmail = async (
  to: string,
  username: string,
  otp: string
): Promise<void> => {
  const from =
    process.env.MAIL_FROM || "PropertyLA <support@propertyla.com.my>";

  await sendEmail({
    from,
    to,
    subject: "Your PropertyLA verification code",
    html: buildOtpEmailHtml(username, otp),
    text: `Hi ${username}, your OTP is ${otp}`,
  }, 'OTP');
};

type PropertyFitEmailItem = {
  title: string;
  price?: number | string;
  location?: string;
  url?: string;
  imageUrl?: string;
};

const formatPrice = (price?: number | string): string => {
  const amount = Number(price);
  if (!Number.isFinite(amount) || amount <= 0) return 'Price on request';

  return `RM ${amount.toLocaleString('en-MY', { maximumFractionDigits: 0 })}`;
};

const buildPropertyFitListHtml = (
  name: string,
  properties: PropertyFitEmailItem[]
): string => {
  const propertyRows = properties
    .map((property) => {
      const title = property.url
        ? `<a href="${property.url}" style="color:#0d6efd;text-decoration:none;">${property.title}</a>`
        : property.title;
      const image = property.imageUrl
        ? `<a href="${property.url || '#'}" style="display:block;margin-bottom:10px;">
            <img src="${property.imageUrl}" alt="${property.title}" width="496" style="display:block;width:100%;max-width:496px;height:190px;object-fit:cover;border-radius:8px;border:1px solid #e8eef3;" />
          </a>`
        : '';
      const action = property.url
        ? `<a href="${property.url}" style="display:inline-block;margin-top:10px;background:#003b5c;color:#ffffff;text-decoration:none;border-radius:6px;padding:10px 14px;font-size:13px;font-weight:700;">View property</a>`
        : '';

      return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid #e8eef3;">
          ${image}
          <strong style="display:block;color:#111;margin-bottom:4px;">${title}</strong>
          <span style="display:block;color:#555;font-size:14px;">${formatPrice(property.price)}</span>
          <span style="display:block;color:#777;font-size:13px;">${property.location || 'Location pending'}</span>
          ${action}
        </td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#222;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#003b5c;padding:24px 32px;color:#ffffff;">
                <h1 style="margin:0;font-size:22px;">PropertyLA</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 14px;font-size:20px;color:#111;">Your property matches</h2>
                <p style="margin:0 0 18px;line-height:1.5;">Hi ${name || 'there'}, here are the properties matched from your Property Fit answers.</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${propertyRows}</table>
                <p style="margin:20px 0 0;line-height:1.5;color:#555;font-size:14px;">When you open or view a property, the assigned agent may be notified so they can follow up.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export const sendPropertyFitListEmail = async (
  to: string,
  name: string,
  properties: PropertyFitEmailItem[]
): Promise<void> => {
  if (!properties.length) return;

  const from = process.env.MAIL_FROM || 'PropertyLA <support@propertyla.com.my>';

  await sendEmail({
    from,
    to,
    subject: 'Your PropertyLA property matches',
    html: buildPropertyFitListHtml(name, properties),
    text: `Hi ${name || 'there'}, your PropertyLA matches:\n\n${properties
      .map((property) => `- ${property.title} | ${formatPrice(property.price)} | ${property.location || 'Location pending'}${property.url ? ` | ${property.url}` : ''}`)
      .join('\n')}`,
  }, 'Property fit list');
};

const getClientLoginUrl = (): string => {
  const clientUrl =
    process.env.PUBLIC_CLIENT_URL ||
    process.env.CLIENT_URL ||
    'https://www.propertyla.com.my';

  return `${clientUrl.replace(/\/$/, '')}/sign-in`;
};

const buildLeadAccountHtml = (params: {
  name: string;
  email: string;
  password: string;
}): string => {
  const loginUrl = getClientLoginUrl();

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#222;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#003b5c;padding:24px 32px;color:#ffffff;">
                <h1 style="margin:0;font-size:22px;">PropertyLA</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 14px;font-size:20px;color:#111;">Your property search is saved</h2>
                <p style="margin:0 0 16px;line-height:1.5;">Hi ${params.name || 'there'},</p>
                <p style="margin:0 0 18px;line-height:1.5;">We created a simple PropertyLA lead login so you can come back to your property search later.</p>
                <div style="background:#eefafa;border:1px solid #cce8ea;border-radius:8px;padding:16px;margin:18px 0;">
                  <p style="margin:0 0 8px;font-size:14px;color:#555;">Email</p>
                  <strong style="display:block;margin-bottom:14px;color:#111;">${params.email}</strong>
                  <p style="margin:0 0 8px;font-size:14px;color:#555;">Password</p>
                  <strong style="display:block;color:#003b5c;font-size:18px;word-break:break-all;">${params.password}</strong>
                </div>
                <a href="${loginUrl}" style="display:inline-block;background:#003b5c;color:#ffffff;text-decoration:none;border-radius:6px;padding:11px 16px;font-size:14px;font-weight:700;">Sign in</a>
                <p style="margin:18px 0 0;line-height:1.5;color:#555;font-size:14px;">If you did not request this, you can safely ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export const sendPropertyFitLeadPasswordEmail = async (params: {
  to: string;
  name: string;
  password: string;
}): Promise<void> => {
  const from = process.env.MAIL_FROM || 'PropertyLA <support@propertyla.com.my>';
  const loginUrl = getClientLoginUrl();

  await sendEmail({
    from,
    to: params.to,
    subject: 'Your PropertyLA login details',
    html: buildLeadAccountHtml({
      name: params.name,
      email: params.to,
      password: params.password
    }),
    text: `Hi ${params.name || 'there'}, your PropertyLA search is saved. Login: ${loginUrl}\nEmail: ${params.to}\nPassword: ${params.password}`,
  }, 'Property fit password');
};

const buildWelcomeBackHtml = (name: string): string => {
  const loginUrl = getClientLoginUrl();

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#222;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#003b5c;padding:24px 32px;color:#ffffff;">
                <h1 style="margin:0;font-size:22px;">PropertyLA</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 14px;font-size:20px;color:#111;">Welcome back</h2>
                <p style="margin:0 0 18px;line-height:1.5;">Hi ${name || 'there'}, this email is already connected to PropertyLA. You can sign in to continue your search.</p>
                <a href="${loginUrl}" style="display:inline-block;background:#003b5c;color:#ffffff;text-decoration:none;border-radius:6px;padding:11px 16px;font-size:14px;font-weight:700;">Sign in</a>
                <p style="margin:18px 0 0;line-height:1.5;color:#555;font-size:14px;">Our team may also follow up if your latest search needs agent help.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export const sendPropertyFitWelcomeBackEmail = async (params: {
  to: string;
  name: string;
}): Promise<void> => {
  const from = process.env.MAIL_FROM || 'PropertyLA <support@propertyla.com.my>';
  const loginUrl = getClientLoginUrl();

  await sendEmail({
    from,
    to: params.to,
    subject: 'Welcome back to PropertyLA',
    html: buildWelcomeBackHtml(params.name),
    text: `Hi ${params.name || 'there'}, welcome back to PropertyLA. You can sign in here: ${loginUrl}`,
  }, 'Property fit welcome back');
};

export const sendPropertyViewNotificationEmail = async (params: {
  to: string;
  agentName?: string | null;
  leadName?: string;
  leadEmail?: string;
  leadPhone?: string;
  propertyTitle: string;
  propertyUrl?: string;
}): Promise<void> => {
  const from = process.env.MAIL_FROM || 'PropertyLA <support@propertyla.com.my>';
  const leadName = params.leadName || 'A PropertyLA visitor';

  await sendEmail({
    from,
    to: params.to,
    subject: `${leadName} viewed ${params.propertyTitle}`,
    html: `<p>Hi ${params.agentName || 'agent'},</p>
      <p>${leadName} viewed or clicked <strong>${params.propertyTitle}</strong> from Property Fit.</p>
      <p>Email: ${params.leadEmail || 'Not provided'}<br/>Phone: ${params.leadPhone || 'Not provided'}</p>
      ${params.propertyUrl ? `<p><a href="${params.propertyUrl}">Open property</a></p>` : ''}`,
    text: `${leadName} viewed ${params.propertyTitle}. Email: ${params.leadEmail || 'Not provided'}, Phone: ${params.leadPhone || 'Not provided'}${params.propertyUrl ? `, Property: ${params.propertyUrl}` : ''}`,
  }, 'Property view notification');
};
