import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface Contact {
  name: string;
  email: string;
  phone: string;
  website: string;
  country: string;
  type: string;
}

async function sendEmail(
  transporter: nodemailer.Transporter,
  to: string,
  subject: string,
  text: string,
  html: string,
  from: string
) {
  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html
    });
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
}

function replaceTemplateVariables(template: string, contact: Contact): string {
  return template
    .replace(/\{name\}/g, contact.name)
    .replace(/\{email\}/g, contact.email)
    .replace(/\{country\}/g, contact.country)
    .replace(/\{website\}/g, contact.website)
    .replace(/\{type\}/g, contact.type);
}

export async function POST(request: Request) {
  try {
    const { contacts, emailTemplate, senderEmail, emailPassword } = await request.json();

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No contacts provided' },
        { status: 400 }
      );
    }

    if (!emailTemplate || !senderEmail || !emailPassword) {
      return NextResponse.json(
        { success: false, error: 'Email configuration incomplete' },
        { status: 400 }
      );
    }

    // Create transporter
    // Supports Gmail, Outlook, and generic SMTP
    let transportConfig: any = {
      auth: {
        user: senderEmail,
        pass: emailPassword
      }
    };

    if (senderEmail.includes('@gmail.com')) {
      transportConfig.service = 'gmail';
    } else if (senderEmail.includes('@outlook.com') || senderEmail.includes('@hotmail.com')) {
      transportConfig.service = 'hotmail';
    } else {
      // Generic SMTP configuration
      transportConfig.host = 'smtp.gmail.com'; // Default to Gmail
      transportConfig.port = 587;
      transportConfig.secure = false;
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const sentTo: string[] = [];
    const failed: string[] = [];

    // Send emails with rate limiting (avoid being marked as spam)
    for (const contact of contacts) {
      const personalizedContent = replaceTemplateVariables(emailTemplate, contact);

      const success = await sendEmail(
        transporter,
        contact.email,
        'Chess Coaching Inquiry',
        personalizedContent,
        personalizedContent.replace(/\n/g, '<br>'),
        senderEmail
      );

      if (success) {
        sentTo.push(contact.email);
      } else {
        failed.push(contact.email);
      }

      // Rate limiting: wait 2 seconds between emails
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return NextResponse.json({
      success: true,
      sent: sentTo.length,
      failed: failed.length,
      sentTo,
      failedTo: failed
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send emails' },
      { status: 500 }
    );
  }
}
