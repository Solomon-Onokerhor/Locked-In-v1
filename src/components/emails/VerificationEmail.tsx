import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VerificationEmailProps {
  code: string;
}

export const VerificationEmail = ({ code }: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Locked In verification code</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Verify your email address</Heading>
          <Text style={text}>
            Welcome to Locked In! Please enter the verification code below to confirm your email address and finish signing in.
          </Text>
          <Section style={codeContainer}>
            <Text style={codeStyle}>{code}</Text>
          </Section>
          <Text style={text}>
            If you didn't request this email, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default VerificationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  maxWidth: '480px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const text = {
  color: '#444444',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 24px',
};

const codeContainer = {
  background: '#f4f4f5',
  borderRadius: '4px',
  margin: '16px 0',
  padding: '16px',
};

const codeStyle = {
  color: '#000',
  fontSize: '32px',
  fontWeight: '700',
  letterSpacing: '6px',
  lineHeight: '40px',
  paddingBottom: '8px',
  paddingTop: '8px',
  margin: '0',
  textAlign: 'center' as const,
};
