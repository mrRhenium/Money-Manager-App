import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn("SMTP credentials missing. Email not sent.");
    return;
  }

  // Create transporter inside the function to ensure process.env is fully loaded
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Money Manager" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`Email successfully sent to ${to}`);
  } catch (error) {
    console.error("Error sending email via Nodemailer:", error);
    throw new Error("Could not send email");
  }
};
