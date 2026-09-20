import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export interface NotificationEmailProps {
  previewText: string;
  title: string;
  heading: string;
  bodyParagraphs: (string | React.ReactNode)[];
  metadata?: { label: string; value: string }[];
  primaryAction?: { text: string; url: string };
}

export const NotificationEmail = ({
  previewText,
  title,
  heading,
  bodyParagraphs,
  metadata,
  primaryAction,
}: NotificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>{title}</Text>
          </Section>

          <Section style={bodySection}>
            <Heading style={h1}>{heading}</Heading>
            
            {bodyParagraphs.map((text, i) => (
              <Text key={i} style={paragraph}>
                {text}
              </Text>
            ))}

            {metadata && metadata.length > 0 && (
              <Section style={metadataBox}>
                {metadata.map((item, i) => (
                  <Text key={i} style={metadataText}>
                    <span style={metadataLabel}>{item.label}:</span> {item.value}
                  </Text>
                ))}
              </Section>
            )}

            {primaryAction && (
              <Section style={buttonContainer}>
                <Button style={button} href={primaryAction.url}>
                  {primaryAction.text}
                </Button>
              </Section>
            )}

            <Hr style={hr} />
            <Text style={footer}>
              Sent securely by Locked In.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f5f5f5',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  padding: '40px 0',
};

const container = {
  margin: '0 auto',
  maxWidth: '480px',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #eaeaea',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
};

const header = {
  backgroundColor: '#000',
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const logo = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: '800',
  letterSpacing: '1.5px',
  margin: '0',
};

const bodySection = {
  padding: '40px',
};

const h1 = {
  color: '#111111',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 20px',
  letterSpacing: '-0.5px',
};

const paragraph = {
  color: '#444444',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const metadataBox = {
  background: '#f9f9f9',
  border: '1px solid #eaeaea',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const metadataText = {
  color: '#333333',
  fontSize: '14px',
  margin: '0 0 12px',
  lineHeight: '1.4',
};

const metadataLabel = {
  color: '#888888',
  fontWeight: '600',
  marginRight: '8px',
  textTransform: 'uppercase' as const,
  fontSize: '12px',
  letterSpacing: '0.5px',
};

const buttonContainer = {
  marginTop: '32px',
  marginBottom: '32px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
};

const hr = {
  borderColor: '#eaeaea',
  margin: '32px 0 24px',
};

const footer = {
  color: '#888888',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0',
  textAlign: 'center' as const,
};
