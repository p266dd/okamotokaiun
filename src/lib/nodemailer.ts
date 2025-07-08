import { createTransport } from "nodemailer";

const transporter = createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    type: "OAuth2",
    user: process.env.NODEMAILER_FROM,
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  // Verify SMTP connection.
  const hasConnection = await transporter.verify();
  console.log("SMTP Connection Successful:", hasConnection ? "yes" : "no");

  try {
    const info = await transporter.sendMail({
      from: `'Okamoto Kaiun' <${process.env.NODEMAILER_FROM}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error: unknown) {
    console.error("Error while sending mail.", error);
  }
}
