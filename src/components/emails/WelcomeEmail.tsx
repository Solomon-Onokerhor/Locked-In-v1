import * as React from 'react';

interface WelcomeEmailProps {
  name: string;
}

export function WelcomeEmail({ name }: Readonly<WelcomeEmailProps>) {
  return (
    <div style={{
    fontFamily: 'sans-serif',
    backgroundColor: '#000',
    color: '#fff',
    padding: '40px',
    borderRadius: '8px',
    maxWidth: '600px',
    margin: '0 auto',
    textAlign: 'center'
  }}>
    <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>Locked In.</h1>
    <p style={{ fontSize: '16px', lineHeight: '24px', color: '#ccc' }}>
      Welcome to the squad, <strong>{name}</strong>!
    </p>
    <p style={{ fontSize: '14px', color: '#888', marginTop: '20px' }}>
      It's time to lock in and level up. We're excited to have you with us.
    </p>
    <hr style={{ borderColor: '#333', margin: '30px 0' }} />
    <p style={{ fontSize: '12px', color: '#555' }}>
      Locked In - The ultimate study platform for UMaT students.
    </p>
  </div>
  );
}
