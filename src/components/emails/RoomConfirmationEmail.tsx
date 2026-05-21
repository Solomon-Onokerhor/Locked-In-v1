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

interface RoomConfirmationEmailProps {
  attendeeName: string;
  roomTitle: string;
  dateTime: string; // Human-readable e.g. "Thursday, May 22 at 2:00 PM"
  duration: string; // e.g. "90 minutes"
  location: string; // e.g. "Zoom: https://..." or "Library Room 301"
  roomUrl: string;
}

export function RoomConfirmationEmail({
  attendeeName,
  roomTitle,
  dateTime,
  duration,
  location,
  roomUrl,
}: Readonly<RoomConfirmationEmailProps>) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;re locked into &quot;{roomTitle}&quot; — see you there!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>🔒 Locked In.</Text>
          </Section>

          {/* Body */}
          <Section style={bodySection}>
            <Heading style={h1}>You&apos;re officially locked in! 🎉</Heading>
            <Text style={text}>
              Hey <strong>{attendeeName}</strong>, your spot is confirmed for:
            </Text>

            {/* Room Card */}
            <Section style={card}>
              <Text style={cardTitle}>{roomTitle}</Text>
              <Text style={cardDetail}>📅 {dateTime}</Text>
              <Text style={cardDetail}>⏱ Duration: {duration}</Text>
              <Text style={cardDetail}>📍 {location}</Text>
            </Section>

            <Text style={text}>
              A calendar invite (.ics file) is attached to this email — tap it to add the session directly to your Apple or Google Calendar.
            </Text>
            <Text style={text}>
              We&apos;ll also send you a WhatsApp reminder 15 minutes before the session starts.
            </Text>

            <Section style={btnContainer}>
              <Link href={roomUrl} style={button}>View Room Details</Link>
            </Section>

            <Text style={signOff}>
              See you there,<br />
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
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
const header = {
  backgroundColor: '#18181b',
  padding: '30px 40px',
  textAlign: 'center' as const,
};
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
const btnContainer = { textAlign: 'center' as const, margin: '28px 0' };
const button = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  color: '#000000',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '14px 32px',
  display: 'inline-block',
};
const signOff = { color: '#a1a1aa', fontSize: '16px', lineHeight: '26px', margin: '28px 0 0 0' };
const hr = { borderColor: '#222222', margin: '0' };
const footer = { padding: '30px 40px', textAlign: 'center' as const };
const footerText = { color: '#71717a', fontSize: '13px', margin: '0 0 8px 0' };
const footerLink = { color: '#a1a1aa', fontSize: '13px', textDecoration: 'underline' };
