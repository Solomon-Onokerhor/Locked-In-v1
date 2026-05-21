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

interface WelcomeEmailProps {
  name: string;
}

export function WelcomeEmail({ name }: Readonly<WelcomeEmailProps>) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Locked In! Time to level up your studies.</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header Section */}
          <Section style={header}>
            <Text style={logo}>🔒 Locked In.</Text>
          </Section>

          {/* Main Content Section */}
          <Section style={bodySection}>
            <Heading style={h1}>Welcome to the squad, {name}!</Heading>
            <Text style={text}>
              We&apos;re absolutely thrilled to have you here. <strong>Locked In</strong> isn&apos;t just another platform—it&apos;s your dedicated space to block out the noise, connect with peers, and crush your academic goals.
            </Text>

            <Section style={featureBox}>
              <Text style={featureTitle}>🚀 What&apos;s next?</Text>
              <Text style={featureText}>
                • <strong>Join a Room:</strong> Jump into an active study room and find your focus alongside other UMaT students.<br/>
                • <strong>Track Time:</strong> Every minute you spend studying is tracked. Watch your total focus time grow!<br/>
                • <strong>Build your Streak:</strong> Show up daily to build an unbreakable study streak.
              </Text>
            </Section>

            <Section style={btnContainer}>
              <Button style={button} href="https://lockedinumat.tech">
                Start Studying Now
              </Button>
            </Section>

            <Text style={text}>
              If you ever need help, have feature requests, or just want to say hi, simply reply to this email. We read every single one.
            </Text>
            
            <Text style={signOff}>
              Stay focused,<br />
              <strong>The Locked In Team</strong>
            </Text>
          </Section>

          {/* Footer Section */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              You received this email because you recently signed up for Locked In. 
            </Text>
            <Text style={footerText}>
              UMaT Campus, Tarkwa, Ghana
            </Text>
            <Link href="https://lockedinumat.tech" style={footerLink}>
              lockedinumat.tech
            </Link>
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
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  padding: '40px 0',
};

const container = {
  backgroundColor: '#111111',
  border: '1px solid #222222',
  borderRadius: '12px',
  margin: '0 auto',
  padding: '0',
  maxWidth: '560px',
  overflow: 'hidden',
};

const header = {
  backgroundColor: '#18181b', // Zinc 900
  padding: '30px 40px',
  borderBottom: '1px solid #222',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0',
  fontSize: '28px',
  fontWeight: '800',
  letterSpacing: '-1px',
  color: '#ffffff',
};

const bodySection = {
  padding: '40px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 20px 0',
  lineHeight: '1.4',
};

const text = {
  color: '#a1a1aa', // Zinc 400
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 24px 0',
};

const featureBox = {
  backgroundColor: '#18181b',
  borderRadius: '8px',
  padding: '24px',
  margin: '32px 0',
  border: '1px solid #27272a',
};

const featureTitle = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const featureText = {
  color: '#a1a1aa',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0',
};

const btnContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

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

const signOff = {
  color: '#a1a1aa',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '32px 0 0 0',
};

const hr = {
  borderColor: '#222222',
  margin: '0',
};

const footer = {
  padding: '30px 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#71717a', // Zinc 500
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 8px 0',
};

const footerLink = {
  color: '#a1a1aa',
  fontSize: '13px',
  textDecoration: 'underline',
};
