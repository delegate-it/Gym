import nodemailer from "nodemailer";

export const mailConfigured = () => Boolean(process.env.SMTP_HOST);

export async function sendLoginCode(email: string, code: string) {
  if (!mailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured (SMTP_HOST missing).");
    }
    console.log(`\n[gym] Login code for ${email}: ${code}\n`);
    return;
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transport.sendMail({
    from: process.env.MAIL_FROM || "GymWise <no-reply@gymwise.co.za>",
    to: email,
    subject: `Your GymWise sign-in code: ${code}`,
    text: `Your sign-in code is ${code}\n\nIt expires in 10 minutes. If you didn't ask for it, ignore this email.`,
    html: `<p>Your GymWise sign-in code is</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>It expires in 10 minutes. If you didn't ask for it, ignore this email.</p>`,
  });
}
