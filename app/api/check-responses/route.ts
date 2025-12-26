import { NextResponse } from 'next/server';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

interface ImapConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

function getImapConfig(email: string, password: string): ImapConfig {
  let config: ImapConfig = {
    user: email,
    password: password,
    host: 'imap.gmail.com',
    port: 993,
    tls: true
  };

  if (email.includes('@outlook.com') || email.includes('@hotmail.com')) {
    config.host = 'outlook.office365.com';
  } else if (email.includes('@yahoo.com')) {
    config.host = 'imap.mail.yahoo.com';
  }

  return config;
}

async function checkInbox(email: string, password: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const config = getImapConfig(email, password);
      const imap = new Imap(config);
      const responses: any[] = [];

      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err, box) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          // Search for unread emails from the last 7 days
          const searchCriteria = ['UNSEEN', ['SINCE', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]];

          imap.search(searchCriteria, (err, results) => {
            if (err) {
              imap.end();
              return reject(err);
            }

            if (!results || results.length === 0) {
              imap.end();
              return resolve([]);
            }

            const fetch = imap.fetch(results, { bodies: '' });

            fetch.on('message', (msg) => {
              msg.on('body', (stream: any) => {
                simpleParser(stream as any, (err, parsed) => {
                  if (!err && parsed) {
                    responses.push({
                      from: parsed.from?.text || '',
                      email: parsed.from?.value?.[0]?.address || '',
                      subject: parsed.subject || '',
                      date: parsed.date || new Date(),
                      text: parsed.text || ''
                    });
                  }
                });
              });
            });

            fetch.once('end', () => {
              imap.end();
              resolve(responses);
            });

            fetch.once('error', (err) => {
              imap.end();
              reject(err);
            });
          });
        });
      });

      imap.once('error', (err) => {
        reject(err);
      });

      imap.connect();

      // Timeout after 30 seconds
      setTimeout(() => {
        imap.end();
        resolve(responses);
      }, 30000);
    } catch (error) {
      reject(error);
    }
  });
}

export async function POST(request: Request) {
  try {
    const { senderEmail, emailPassword } = await request.json();

    if (!senderEmail || !emailPassword) {
      return NextResponse.json(
        { success: false, error: 'Email credentials required' },
        { status: 400 }
      );
    }

    // For demo purposes, simulate checking responses
    // In production, this would use IMAP to check actual emails
    const mockResponses = [
      {
        email: 'demo@chesscenter.com',
        from: 'Demo Chess Center',
        subject: 'Re: Chess Coaching Inquiry',
        date: new Date(),
        text: 'Thank you for your interest!'
      }
    ];

    // Uncomment below for real IMAP checking (requires proper credentials)
    // const responses = await checkInbox(senderEmail, emailPassword);

    return NextResponse.json({
      success: true,
      responses: mockResponses,
      count: mockResponses.length
    });
  } catch (error) {
    console.error('Response checking error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check responses' },
      { status: 500 }
    );
  }
}
