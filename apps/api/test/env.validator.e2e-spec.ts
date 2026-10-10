import { describe, it, expect } from 'vitest';
import { validateEnv, assertValidEnv } from '../src/common/env.validator.js';

describe('Environment Validator (S7)', () => {
  const validSecret = 'a'.repeat(32);

  describe('JWT_SECRET validation', () => {
    it('rejects missing or empty JWT_SECRET', () => {
      const res = validateEnv({ JWT_SECRET: '' });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('JWT_SECRET is required');
    });

    it('rejects JWT_SECRET shorter than 32 characters', () => {
      const res = validateEnv({ JWT_SECRET: 'short_secret_under_32_chars' });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('JWT_SECRET must be at least 32 characters long');
    });

    it.each([
      'supersecret',
      'changeme',
      'secret',
      'password',
      'generate-a-strong-secret-key-for-jwt',
      'supersecret-with-padding-to-make-it-long-enough',
    ])('rejects known placeholder: %s', (placeholder) => {
      const res = validateEnv({ JWT_SECRET: placeholder });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('JWT_SECRET cannot be a known placeholder');
    });

    it('accepts valid strong JWT_SECRET in development', () => {
      const res = validateEnv({
        JWT_SECRET: validSecret,
        NODE_ENV: 'development',
      });
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });
  });

  describe('NODE_ENV=production requirements', () => {
    const baseProdEnv = {
      NODE_ENV: 'production',
      JWT_SECRET: validSecret,
      FRONTEND_URL: 'https://hub.gdgoc.unair.ac.id',
      COOKIE_SECURE: 'true',
      DATABASE_URL: 'postgresql://prod_user:strong_prod_pass@db.internal:5432/gdgoc_prod',
    };

    it('passes with all valid production variables', () => {
      const res = validateEnv(baseProdEnv);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it('rejects production without FRONTEND_URL', () => {
      const res = validateEnv({ ...baseProdEnv, FRONTEND_URL: '' });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('FRONTEND_URL is required in production');
    });

    it('rejects production when COOKIE_SECURE is not true', () => {
      const res = validateEnv({ ...baseProdEnv, COOKIE_SECURE: 'false' });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('COOKIE_SECURE must be true in production');
    });

    it.each([
      'postgresql://dev:devpassword@127.0.0.1:5432/gdgoc',
      'postgresql://user:pass@localhost:5432/gdgoc',
      'postgresql://dev:devpassword@remote.host:5432/gdgoc',
    ])('rejects default/local database URL in production: %s', (dbUrl) => {
      const res = validateEnv({ ...baseProdEnv, DATABASE_URL: dbUrl });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('DATABASE_URL must be a non-default production database URL in production');
    });
  });

  describe('assertValidEnv', () => {
    it('throws Error when validation fails', () => {
      expect(() => assertValidEnv({ JWT_SECRET: 'short' })).toThrow(/Environment validation failed/);
    });

    it('does not throw when validation passes', () => {
      expect(() => assertValidEnv({ JWT_SECRET: validSecret, NODE_ENV: 'development' })).not.toThrow();
    });
  });
});
