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
import * as React from 'react';

interface ImpeccableEmailProps {
  type: 'verification' | 'reset' | 'locked' | 'password_changed' | 'password_removed' | 'email_changed' | 'new_device' | 'invitation';
  code?: string;
  linkUrl?: string;
  metadata?: any;
}

export const ImpeccableEmail = ({ type, code, linkUrl, metadata }: ImpeccableEmailProps) => {
  const content = getContent(type, code, linkUrl, metadata);

  return (
    <Html>
      <Head />
      <Preview>{content.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>LOCKED IN</Text>
          </Section>

          <Section style={bodySection}>
            <Heading style={h1}>{content.title}</Heading>
            <Text style={text}>{content.description}</Text>

            {content.code && (
              <Section style={codeBox}>
                <Text style={codeText}>{content.code}</Text>
              </Section>
            )}

            {content.linkUrl && (
              <Section style={buttonContainer}>
                <Button style={button} href={content.linkUrl}>
                  {content.linkText || 'Click Here'}
                </Button>
              </Section>
            )}

            {content.metadataList && (
              <Section style={metadataSection}>
                {content.metadataList.map((item, i) => (
                  <Text key={i} style={metadataText}>
                    <strong>{item.label}:</strong> {item.value}
                  </Text>
                ))}
              </Section>
            )}

            {content.warning && (
              <Text style={warningText}>{content.warning}</Text>
            )}

            <Hr style={hr} />

            <Text style={footerText}>
              Need help? Reply to this email or visit our <Link href="https://lockedinumat.tech/support" style={link}>Help Center</Link>.
            </Text>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} Locked In. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

function getContent(type: ImpeccableEmailProps['type'], code?: string, linkUrl?: string, metadata?: any) {
  const genericWarning = "If you didn't request this, you can safely ignore this email. Your account is secure.";
  const securityWarning = "If you didn't perform this action, please secure your account immediately by resetting your password.";

  switch (type) {
    case 'verification':
      return {
        preview: 'Verify your email address for Locked In',
        title: 'Verify your email',
        description: 'Welcome to Locked In! To complete your sign in, please enter the verification code below.',
        code,
        linkUrl,
        linkText: 'Verify Email',
        warning: genericWarning,
      };
    case 'reset':
      return {
        preview: 'Reset your password for Locked In',
        title: 'Reset your password',
        description: 'We received a request to reset the password for your Locked In account. Use the code or click the button below to choose a new password.',
        code,
        linkUrl,
        linkText: 'Reset Password',
        warning: genericWarning,
      };
    case 'locked':
      return {
        preview: 'Security Alert: Your account has been locked',
        title: 'Account Locked',
        description: 'We detected multiple unsuccessful login attempts. For your security, your account has been temporarily locked.',
        metadataList: [
          { label: 'Time', value: new Date().toLocaleString() }
        ],
        warning: 'Please reset your password to unlock your account.',
      };
    case 'password_changed':
      return {
        preview: 'Your password was successfully changed',
        title: 'Password Updated',
        description: 'This is a confirmation that the password for your Locked In account was successfully changed just now.',
        warning: securityWarning,
      };
    case 'password_removed':
      return {
        preview: 'Your password was removed',
        title: 'Password Removed',
        description: 'The password for your Locked In account was removed. You will now sign in using alternative methods (like magic links or Google).',
        warning: securityWarning,
      };
    case 'email_changed':
      return {
        preview: 'Your primary email was updated',
        title: 'Email Address Updated',
        description: 'Your primary email address for Locked In has been changed successfully.',
        warning: securityWarning,
      };
    case 'new_device':
      return {
        preview: 'New sign-in detected on your account',
        title: 'New Sign-In Detected',
        description: 'We noticed a sign-in to your Locked In account from a new or unrecognized device.',
        metadataList: [
          { label: 'Device', value: metadata?.device || 'Unknown Device' },
          { label: 'Location', value: metadata?.location || 'Unknown Location' },
          { label: 'Time', value: new Date().toLocaleString() }
        ],
        warning: securityWarning,
      };
    case 'invitation':
      return {
        preview: 'You have been invited to Locked In',
        title: 'You\'re Invited!',
        description: 'You have been invited to join Locked In. Click the button or use the code below to accept your invitation and set up your account.',
        code,
        warning: 'If you aren\'t expecting this invitation, you can safely ignore it.',
      };
    default:
      return {
        preview: 'Message from Locked In',
        title: 'Update from Locked In',
        description: 'Here is an update regarding your account.',
      };
  }
}

export default ImpeccableEmail;

// --- Styles ---

const main = {
  backgroundColor: '#fafafa',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
};

const container = {
  margin: '40px auto',
  maxWidth: '460px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #eaeaea',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
};

const header = {
  backgroundColor: '#000000',
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const logo = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: '800',
  letterSpacing: '2px',
  margin: '0',
};

const bodySection = {
  padding: '40px',
};

const h1 = {
  color: '#111111',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
  margin: '0 0 16px',
};

const text = {
  color: '#555555',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px',
};

const codeBox = {
  background: '#f9f9f9',
  border: '1px solid #eeeeee',
  borderRadius: '8px',
  padding: '24px',
  textAlign: 'center' as const,
  margin: '16px 0 32px',
};

const codeText = {
  color: '#000000',
  fontSize: '36px',
  fontWeight: '700',
  letterSpacing: '8px',
  lineHeight: '1',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const metadataSection = {
  backgroundColor: '#fbfbfb',
  borderLeft: '4px solid #e0e0e0',
  padding: '16px 24px',
  margin: '0 0 24px',
  borderRadius: '0 4px 4px 0',
};

const metadataText = {
  color: '#444444',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px',
};

const warningText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 32px',
  fontStyle: 'italic' as const,
};

const hr = {
  borderColor: '#eeeeee',
  margin: '0 0 32px',
};

const footerText = {
  color: '#999999',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0 0 12px',
};

const link = {
  color: '#000000',
  textDecoration: 'underline',
};
