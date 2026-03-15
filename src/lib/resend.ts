import { Resend } from 'resend';

// resend's client is initialized with the API key
// In development, you should add RESEND_API_KEY to your .env.local
export const resend = new Resend(process.env.RESEND_API_KEY);
