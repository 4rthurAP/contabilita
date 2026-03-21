import { registerAs } from '@nestjs/config';

export default registerAs('certificate', () => ({
  encryptionKey:
    process.env.CERTIFICATE_ENCRYPTION_KEY ||
    'a'.repeat(64), // Placeholder — MUST be overridden in production
}));
