// Envío de correos. Sin SMTP configurado, el mensaje se muestra en la consola.
const nodemailer = require("nodemailer");
const { env } = require("../config/environment");
const { CODE_PURPOSE, SECURITY } = require("../constants/security");

const transporter = env.smtp.host
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    })
  : null;

async function sendVerificationCode(email, code, purpose) {
  const subject = purpose === CODE_PURPOSE.REGISTRATION
    ? "Verifica tu correo - AXON"
    : "Código de inicio de sesión - AXON";
  const text = `Tu código de verificación es: ${code}\nExpira en ${SECURITY.CODE_EXPIRY_MINUTES} minutos.`;

  if (!transporter) {
    console.log("\n========== CORREO (modo desarrollo) ==========");
    console.log(`Para:   ${email}`);
    console.log(`Asunto: ${subject}`);
    console.log(`Código: ${code}`);
    console.log("===============================================\n");
    return;
  }

  await transporter.sendMail({ from: env.smtp.from, to: email, subject, text });
}

module.exports = { sendVerificationCode };
