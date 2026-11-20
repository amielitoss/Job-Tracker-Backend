import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  email: string,
  verificationCode: string,
) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: "Verify your Jobtrackly account",
    html: `
  <h2>Verify your JobTrackly account</h2>
  <p>Your verification code is:</p>
  <h1>${verificationCode}</h1>
  <p>This code expires in 5 minutes.</p>
  <p>If you didn't create this account, you can ignore this email.</p>`,
  });
}
