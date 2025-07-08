import { sendEmail } from "@/lib/nodemailer";

export async function resetPassword({
  token,
  name,
  email,
}: {
  token: string;
  name: string;
  email: string;
}) {
  const text = `
    Hello ${name},\n
    Someone has requested a password recovery for your account!/n
    Use the URL below in your browser to reset your password.\n\n
    ${process.env.NEXT_PUBLIC_BASE_URL}/login?action=reset&token=${token}\n\n
    If you didn't request this, you can safely ignore this email.\n\n
    Best,\n
    Okamoto Kaiun Team\n
  `;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          .container {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 20px;
            text-align: center;
          }
          .token {
            font-size: 12px;
            color: #ccc;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            font-size: 20px;
            color: #ffffff !important;
            background-color: #01499c;
            text-decoration: none;
            border-radius: 8px;
            margin-top: 20px;
          }
          .button:visited,
          .button:hover,
          .button:active {
            color: #ffffff !important;
          }
          .footer {
            font-size: 12px;
            color: #666;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Recovery</h2>
          <div>
            <p>
              Someone has requested a password recovery for your account! <br />
              Click the button below to reset your password.
            </p>
          </div>
          <div>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset?token=${token}" target="_blank" class="button">Reset Password</a>
          </div>
          <div>
            <p class="token">
              ${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset?token=${token}
            </p>
          </div>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p class="footer">Best regards, <br> Okamoto Kaiun Team</p>
        </div>
      </body>
    </html>
    `;

  return await sendEmail({
    to: email,
    subject: "Password Recovery - Okamoto Kaiun",
    text: text,
    html: html,
  });
}
