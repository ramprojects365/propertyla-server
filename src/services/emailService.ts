import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const buildOtpEmailHtml = (username: string, otp: string): string => {
  return `
    <h2>Hi ${username},</h2>
    <p>Your PropertyLA verification code is:</p>
    <h1 style="letter-spacing:5px;">${otp}</h1>
    <p>If you didn't request this, ignore this email.</p>
  `;
};

export const sendOtpEmail = async (
  to: string,
  username: string,
  otp: string
): Promise<void> => {
  try {
    const response = await resend.emails.send({
      from: "PropertyLA <onboarding@resend.dev>", // ✅ MUST use this for now
      to,
      subject: "Your PropertyLA verification code",
      html: buildOtpEmailHtml(username, otp),
    });

    console.log("Email sent:", response);
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};