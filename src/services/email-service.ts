'use server';

import nodemailer from 'nodemailer';
import { db } from '@/lib/firebase-admin';

interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(options: EmailOptions) {
  const settingsDoc = await db.collection('settings').doc('app-config').get();
  if (!settingsDoc.exists) {
    throw new Error('Email settings not found.');
  }
  const config = settingsDoc.data();

  if (!config || !config.provider || config.provider === 'none') {
    throw new Error('Email provider is not configured.');
  }

  let transporter;

  if (config.provider === 'smtp') {
    if (!config.smtpHost || !config.smtpPort || !config.smtpUser || !config.smtpPass) {
      throw new Error('SMTP configuration is incomplete. Please check your settings.');
    }
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: Number(config.smtpPort),
      secure: Number(config.smtpPort) === 465, // true for 465, false for other ports
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });
  } else if (config.provider === 'sendgrid') {
     if (!config.sendgridKey) {
       throw new Error('SendGrid API key is missing.');
     }
    // Correctly configure nodemailer for SendGrid
    transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587, // Use 587 for TLS or 465 for SSL
        secure: false, // Use 'true' if you use port 465
        auth: {
            user: 'apikey', // This is a literal string for SendGrid
            pass: config.sendgridKey
        }
    });
  } else {
    throw new Error(`Unsupported email provider: ${config.provider}`);
  }

  const mailOptions = {
    from: options.from || config.fromEmail,
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
