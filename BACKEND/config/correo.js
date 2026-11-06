// envío de correos con los códigos de verificación
const nodemailer = require("nodemailer");
const { env, CODE_PURPOSE, SECURITY } = require("./configuracion");

// sin SMTP configurado, el mensaje sale en la consola
const transporter = env.smtp.host
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    })
  : null;

const MAIL_SUBJECTS = {
  [CODE_PURPOSE.REGISTRATION]: "AXON Security · Código de verificación",
  [CODE_PURPOSE.LOGIN]: "AXON Security · Código de inicio de sesión",
};

const mail = {
  async sendVerificationCode(email, code, purpose) {
    const subject = MAIL_SUBJECTS[purpose] || MAIL_SUBJECTS[CODE_PURPOSE.LOGIN];
    const text = `Tu código de verificación es: ${code}\nExpira en ${SECURITY.CODE_EXPIRY_MINUTES} minutos.`;

    if (!transporter) {
      console.log("\n========== CORREO (modo desarrollo) ==========");
      console.log(`Para:   ${email}`);
      console.log(`Asunto: ${subject}`);
      console.log(`Código: ${code}`);
      console.log("===============================================\n");
      return subject;
    }
    await transporter.sendMail({ from: env.smtp.from, to: email, subject, text });
    return subject;
  },
};

module.exports = { mail };
