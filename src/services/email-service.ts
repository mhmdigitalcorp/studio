'use server';

import nodemailer from 'nodemailer';
import { db } from '@/lib/firebase-admin';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  from?: string; // from is now optional
}

export async function sendEmail(options: EmailOptions) {
  const settingsDoc = await db.collection('settings').doc('app-config').get();
  if (!settingsDoc.exists) {
    throw new Error('Email settings not found in Firestore.');
  }
  const config = settingsDoc.data();

  if (!config || !config.provider || config.provider === 'none') {
    throw new Error('Email provider is not configured.');
  }

  if (!config.fromEmail) {
    throw new Error("A 'From' email address has not been configured in settings.");
  }

  let transporter;

  if (config.provider === 'smtp') {
    if (!config.smtpHost || !config.smtpPort || !config.smtpUser || !config.smtpPass) {
      throw new Error('SMTP configuration is incomplete.');
    }
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: Number(config.smtpPort),
      secure: Number(config.smtpPort) === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });
  } else if (config.provider === 'sendgrid') {
     if (!config.sendgridKey) {
       throw new Error('SendGrid API key is missing.');
     }
    transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
            user: 'apikey',
            pass: config.sendgridKey
        }
    });
  } else {
    throw new Error(`Unsupported email provider: ${config.provider}`);
  }

  const mailOptions = {
    from: config.fromEmail, // Always use the configured 'from' email
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return info;
  } catch (error) {
    console.error('Nodemailer error:', error);
    throw new Error(`Failed to send email: ${error}`);
  }
}
