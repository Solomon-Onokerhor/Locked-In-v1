import * as React from 'react';
import {
  Body,
  Button,
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

interface SessionReminderEmailProps {
  attendeeName: string;
  roomTitle: string;
  dateTime: string;
  duration: string;
  location: string;
  roomUrl: string;
}

export function SessionReminderEmail({
  attendeeName,
  roomTitle,
  dateTime,
  duration,
  location,
  roomUrl,
}: Readonly<SessionReminderEmailProps>) {
  return (
    <Html>
      <Head />
      <Preview>⏰ Your session &quot;{roomTitle}&quot; is tomorrow — get ready!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>🔒 Locked In.</Text>
          </Section>

          {/* Body */}
          <Section style={bodySection}>
            <Heading style={h1}>Your session is tomorrow! 📅</Heading>
            <Text style={text}>
              Hey <strong>{attendeeName}</strong>, just a heads-up that your session is coming up in <strong>24 hours</strong>. Now&apos;s a great time to prepare.
            </Text>

            {/* Session Card */}
            <Section style={card}>
              <Text style={cardTitle}>{roomTitle}</Text>
              <Text style={cardDetail}>📅 {dateTime}</Text>
              <Text style={cardDetail}>⏱ Duration: {duration}</Text>
              <Text style={cardDetail}>📍 {location}</Text>
            </Section>

            <Section style={tipsBox}>
              <Text style={tipsTitle}>💡 To make the most of tomorrow&apos;s session:</Text>
              <Text style={tipsText}>
                • Review any notes or materials related to this topic<br />
                • Check the room page for any resources shared by the host<br />
                • Make sure you have a stable connection (for virtual rooms)<br />
                • Show up on time — your peers are counting on you
              </Text>
            </Section>

            <Section style={btnContainer}>
              <Button style={button} href={roomUrl}>View Room</Button>
            </Section>

            <Text style={text}>
              We&apos;ll also send you a WhatsApp ping 15 minutes before the session starts. Stay locked in!
            </Text>

            <Text style={signOff}>
              See you tomorrow,<br />
              <strong>The Locked In Team</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>Locked In, UMaT Campus, Tarkwa, Ghana</Text>
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
const text = { color: '#a1a1aa', fontSize: '16px', lineHeight: '26px', margin: '0 0 20px 0' };
const card = {
  backgroundColor: '#18181b',
  border: '1px solid #27272a',
  borderRadius: '10px',
  padding: '20px 24px',
  margin: '24px 0',
};
const cardTitle = { color: '#ffffff', fontSize: '17px', fontWeight: '700', margin: '0 0 14px 0' };
const cardDetail = { color: '#a1a1aa', fontSize: '14px', lineHeight: '22px', margin: '0 0 8px 0' };
const tipsBox = {
  backgroundColor: '#0f172a',
  border: '1px solid #1e3a5f',
  borderRadius: '10px',
  padding: '20px 24px',
  margin: '24px 0',
};
const tipsTitle = { color: '#93c5fd', fontSize: '15px', fontWeight: '600', margin: '0 0 12px 0' };
const tipsText = { color: '#94a3b8', fontSize: '14px', lineHeight: '24px', margin: '0' };
const btnContainer = { textAlign: 'center' as const, margin: '28px 0' };
const button = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  color: '#000000',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};
const signOff = { color: '#a1a1aa', fontSize: '16px', lineHeight: '26px', margin: '28px 0 0 0' };
const hr = { borderColor: '#222222', margin: '0' };
const footer = { padding: '30px 40px', textAlign: 'center' as const };
const footerText = { color: '#71717a', fontSize: '13px', margin: '0 0 8px 0' };
const footerLink = { color: '#a1a1aa', fontSize: '13px', textDecoration: 'underline' };
