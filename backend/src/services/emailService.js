require("dotenv").config();
const nodemailer = require("nodemailer");

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  } else {
    transporter = null; // dev mode: print to console
  }
  return transporter;
}

async function sendVerificationCode(email, code, purpose) {
  const subject = purpose === "registration" ? "Verifica tu correo - AXON" : "Código de verificación - AXON";
  const text = `Tu código de verificación es: ${code}\nExpira en 5 minutos.`;
  const t = getTransporter();
  if (!t) {
    console.log(`\n========== EMAIL (DEV MODE) ==========`);
    console.log(`Para: ${email}`);
    console.log(`Asunto: ${subject}`);
    console.log(`Código: ${code}`);
    console.log(`======================================\n`);
    return { devMode: true };
  }
  await t.sendMail({
    from: process.env.SMTP_FROM || "AXON <no-reply@axon.local>",
    to: email,
    subject,
    text,
  });
  return { sent: true };
}

module.exports = { sendVerificationCode };
