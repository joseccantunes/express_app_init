import { Transporter, createTransport } from 'nodemailer';
import { htmlToText } from 'html-to-text';
import {IUser} from "../models";

interface User {
  email: string;
  name: string;
}

export default class Email {
  private to: string;
  private firstName: string;
  private url: string;
  private from: string;

  constructor(user: Pick<IUser, "email" | "name">, url: string) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;

    //TODO get the email from the database/settings/ENV/...
    this.from = `Jose Antunes <jose.antunes@example.com>`;
  }

  private newTransport(): Transporter | number {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid or other production transporter logic
      return 1; // Placeholder for Sendgrid or production service
    }

    return createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  private async send(template: string, subject: string): Promise<void> {
    // 1) Render HTML based on a pug template
    //TODO get html from the database and render it substituting the variables
    const html = "<p>HTML content</p>";
    //    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
    //       firstName: this.firstName,
    //       url: this.url,
    //       subject,
    //     });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    // 3) Create a transport and send email
    const transport = this.newTransport();
    if (typeof transport === 'number') {
      throw new Error('Production email transport is not implemented.');
    }
    await transport.sendMail(mailOptions);
  }

  async sendWelcome(): Promise<void> {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset(): Promise<void> {
    await this.send(
        'passwordReset',
        'Your password reset token (valid for only 10 minutes)',
    );
  }
}
