import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface RoomSubmittedEmailProps {
  roomTitle: string;
}

export function RoomSubmittedEmail({ roomTitle }: Readonly<RoomSubmittedEmailProps>) {
  return (
    <Html>
      <Head />
      <Preview>Your room &quot;{roomTitle}&quot; has been submitted for review.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>🔒 Locked In.</Text>
          </Section>
          <Section style={bodySection}>
            <Heading style={h1}>Room Submitted Successfully</Heading>
            <Text style={text}>
              Hey Creator,
            </Text>
            <Text style={text}>
              We&apos;ve received your submission for the room: <strong>{roomTitle}</strong>.
            </Text>
            <Text style={text}>
              Our team will review it shortly. Once approved, it will go live on the dashboard and you&apos;ll receive a WhatsApp notification.
            </Text>
            <Text style={signOff}>
              Stay focused,<br />
              <strong>The Locked In Team</strong>
            </Text>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>Locked In, UMaT Campus</Text>
            <Link href="https://lockedinumat.tech" style={footerLink}>lockedinumat.tech</Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#000000',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  padding: '40px 0',
};
const container = {
  backgroundColor: '#111111',
  border: '1px solid #222222',
  borderRadius: '12px',
  margin: '0 auto',
  maxWidth: '560px',
  overflow: 'hidden',
};
const header = { backgroundColor: '#18181b', padding: '30px 40px', textAlign: 'center' as const };
const logo = { margin: '0', fontSize: '28px', fontWeight: '800', color: '#ffffff' };
const bodySection = { padding: '40px' };
const h1 = { color: '#ffffff', fontSize: '24px', fontWeight: '700', margin: '0 0 20px 0' };
const text = { color: '#a1a1aa', fontSize: '16px', lineHeight: '26px', margin: '0 0 24px 0' };
const signOff = { color: '#a1a1aa', fontSize: '16px', lineHeight: '26px', margin: '32px 0 0 0' };
const hr = { borderColor: '#222222', margin: '0' };
const footer = { padding: '30px 40px', textAlign: 'center' as const };
const footerText = { color: '#71717a', fontSize: '13px', margin: '0 0 8px 0' };
const footerLink = { color: '#a1a1aa', fontSize: '13px', textDecoration: 'underline' };
