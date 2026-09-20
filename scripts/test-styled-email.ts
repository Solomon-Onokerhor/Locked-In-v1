import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import * as React from 'react';
import { render } from '@react-email/render';
import { ImpeccableEmail } from '../src/components/emails/ImpeccableEmail';

dotenv.config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);
const emailAddress = 'mleslieyt@gmail.com';

const types = [
  'verification',
  'reset',
  'locked',
  'password_changed',
  'password_removed',
  'email_changed',
  'new_device',
  'invitation'
] as const;

async function runTests() {
  console.log(`Sending all 8 beautifully styled React Emails to ${emailAddress}...`);
  
  for (const type of types) {
    console.log(`Sending: ${type}...`);
    try {
      const htmlBody = await render(React.createElement(ImpeccableEmail, { 
        type, 
        code: '123456',
        linkUrl: 'https://lockedinumat.tech/reset-password',
        metadata: { device: 'MacBook Pro (Chrome)', location: 'Accra, Ghana' }
      }));
      
      const { data, error } = await resend.emails.send({
        from: 'Locked In <hello@contact.lockedinumat.tech>',
        to: [emailAddress],
        subject: `[Impeccable Test] ${type.replace('_', ' ').toUpperCase()}`,
        html: htmlBody,
        text: `This is the fallback text for ${type}.`
      });

      if (error) {
        console.error(`❌ Failed to send ${type}:`, error);
      } else {
        console.log(`✅ Successfully sent ${type} (ID: ${data?.id})`);
      }
    } catch (err) {
      console.error(`❌ Error rendering/sending ${type}:`, err);
    }
    
    // Slight delay to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('All tests completed! Please check your inbox.');
}

runTests();
