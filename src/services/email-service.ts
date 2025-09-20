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
  console.log('Fetching email configuration from Firestore...');
  const settingsDoc = await db.collection('settings').doc('app-config').get();
  
  if (!settingsDoc.exists) {
    console.error('Email settings document not found in Firestore.');
    throw new Error('Email settings not found in Firestore.');
  }
  
  const config = settingsDoc.data();
  console.log('Retrieved config from Firestore:', config); // <-- ADDED FOR DEBUGGING

  if (!config || !config.provider || config.provider === 'none') {
    throw new Error('Email provider is not configured.');
  }

  if (!config.fromEmail) {
    throw new Error("A 'From' email address has not been configured in settings.");
  }
  
  // Validate required fields based on provider
  if (config.provider === 'smtp') {
    const requiredSmtpFields = ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPass'];
    const missingFields = requiredSmtpFields.filter(field => !config[field]);
    if (missingFields.length > 0) {
      const errorMessage = `Missing SMTP configuration fields: ${missingFields.join(', ')}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  } else if (config.provider === 'sendgrid') {
    if (!config.sendgridKey) {
       const errorMessage = 'SendGrid API key is missing.';
       console.error(errorMessage);
       throw new Error(errorMessage);
    }
  }


  let transporter;

  if (config.provider === 'smtp') {
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
    console.log('Attempting to send email with Nodemailer...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully. Response:', info.response);
    return info;
  } catch (error: any) {
    console.error('Nodemailer error:', error);
    throw new Error(`Failed to send email via Nodemailer: ${error}`);
  }
}
