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
    console.error(`Failed to send follow-up to ${to}:`, error);
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
        { success: false, error: 'No contacts provided for follow-up' },
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
      transportConfig.host = 'smtp.gmail.com';
      transportConfig.port = 587;
      transportConfig.secure = false;
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const sentTo: string[] = [];
    const failed: string[] = [];

    // Add follow-up prefix to template
    const followUpTemplate = `Follow-up: ${emailTemplate}\n\nJust following up on my previous email. I wanted to check if you had a chance to review my inquiry.`;

    for (const contact of contacts) {
      const personalizedContent = replaceTemplateVariables(followUpTemplate, contact);

      const success = await sendEmail(
        transporter,
        contact.email,
        'Follow-up: Chess Coaching Inquiry',
        personalizedContent,
        personalizedContent.replace(/\n/g, '<br>'),
        senderEmail
      );

      if (success) {
        sentTo.push(contact.email);
      } else {
        failed.push(contact.email);
      }

      // Rate limiting
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
    console.error('Follow-up sending error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send follow-ups' },
      { status: 500 }
    );
  }
}
