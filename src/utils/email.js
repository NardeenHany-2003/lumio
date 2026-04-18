import nodemailer from 'nodemailer';
import pug from 'pug';
import { convert } from 'html-to-text';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `"Lumio" <${process.env.EMAIL_FROM}>`;
  }

  // Create transporter
  newTransport() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM, 
        pass: process.env.EMAIL_APP_PASS, 
      },
    });
  }

  // Core send 
  async send(template, subject) {
    // 1) Render HTML from Pug template
    const html = pug.renderFile(
      join(__dirname, '..', 'views', 'email', `${template}.pug`),
      { firstName: this.firstName, url: this.url, subject },
    );

    // 2) Mail options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html, { wordwrap: 100 }),
    };

    // 3) Send
    await this.newTransport().sendMail(mailOptions);
  }

  // Convenience methods
  async sendWelcome() {
    await this.send('welcome', 'Welcome to Lumio!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your Lumio password reset link (valid for 10 minutes)',
    );
  }
}
