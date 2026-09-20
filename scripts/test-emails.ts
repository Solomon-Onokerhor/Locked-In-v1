import { Resend } from 'resend';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

const emailAddress = 'mleslieyt@gmail.com';

const templates = [
  { subject: 'Account Locked', body: 'Your account has been locked due to multiple login attempts.' },
  { subject: 'Password changed', body: 'Your password has been successfully changed.' },
  { subject: 'Password removed', body: 'Your password has been removed from the account.' },
  { subject: 'Primary email address changed', body: 'Your primary email address has been updated.' },
  { subject: 'Reset password code', body: 'Your reset password code is: 123456' },
  { subject: 'Sign in from new device', body: 'A sign-in occurred from a new or unrecognized device.' },
  { subject: 'Invitation', body: 'You have been invited to join the application.' },
  { subject: 'Verification code', body: 'Your verification code is: 123456' }
];

async function runTests() {
  console.log(`Starting email tests to ${emailAddress}...`);
  
  for (const template of templates) {
    console.log(`Sending: ${template.subject}...`);
    try {
      const { data, error } = await resend.emails.send({
        from: 'Locked In <hello@contact.lockedinumat.tech>',
        to: [emailAddress],
        subject: `[Test] ${template.subject}`,
        html: `<div style="font-family: sans-serif; padding: 20px;">
                <h2>${template.subject}</h2>
                <p>${template.body}</p>
                <br />
                <p style="color: #666; font-size: 12px;">This is a test simulation of the Clerk email template via Resend.</p>
               </div>`,
        text: `${template.subject}\n\n${template.body}\n\nThis is a test simulation of the Clerk email template via Resend.`
      });

      if (error) {
        console.error(`❌ Failed to send ${template.subject}:`, error);
      } else {
        console.log(`✅ Successfully sent ${template.subject} (ID: ${data?.id})`);
      }
    } catch (err) {
      console.error(`❌ Error sending ${template.subject}:`, err);
    }
    
    // Slight delay to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('All tests completed! Please check your inbox.');
}

runTests();
