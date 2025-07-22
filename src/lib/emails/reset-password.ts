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
    ${name},\n
    下のボタンをクリックしてパスワードをリセットしてください。\n\n
    ${process.env.NEXT_PUBLIC_BASE_URL}/login?action=reset&token=${token}\n\n
    パスワードリセットをリクエストしていない場合は、このメールは無視してください。\n\n
    は削除してください。\n
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
          <h2>パスワードリセット</h2>
          <div>
            <p>
              下のボタンをクリックしてパスワードをリセットしてください。<br />
            </p>
          </div>
          <div>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset?token=${token}" target="_blank" class="button">パスワードリセット</a>
          </div>
          <div>
            <p class="token">
              ${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset?token=${token}
            </p>
          </div>
          <p>パスワードリセットをリクエストしていない場合は、このメールは無視してください。</p>
          <p class="footer">は削除してください。</p>
        </div>
      </body>
    </html>
    `;

  return await sendEmail({
    to: email,
    subject: "パスワードリセット - Okamoto Kaiun",
    text: text,
    html: html,
  });
}
