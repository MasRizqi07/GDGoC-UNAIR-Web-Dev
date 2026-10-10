export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
}

export const KNOWN_PLACEHOLDERS = [
  'supersecret',
  'changeme',
  'secret',
  'password',
  'generate-a-strong-secret-key-for-jwt',
];

export function validateEnv(env: Record<string, string | undefined> = process.env): EnvValidationResult {
  const errors: string[] = [];

  const jwtSecret = env.JWT_SECRET?.trim();
  if (!jwtSecret) {
    errors.push('JWT_SECRET is required');
  } else {
    if (jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long');
    }
    const lower = jwtSecret.toLowerCase();
    if (KNOWN_PLACEHOLDERS.some((p) => lower === p.toLowerCase() || lower.includes(p.toLowerCase()))) {
      errors.push('JWT_SECRET cannot be a known placeholder');
    }
  }

  const nodeEnv = env.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    if (!env.FRONTEND_URL || !env.FRONTEND_URL.trim()) {
      errors.push('FRONTEND_URL is required in production');
    }
    if (env.COOKIE_SECURE !== 'true') {
      errors.push('COOKIE_SECURE must be true in production');
    }
    const dbUrl = env.DATABASE_URL || '';
    if (
      !dbUrl ||
      dbUrl.includes('dev:devpassword') ||
      dbUrl.includes('127.0.0.1') ||
      dbUrl.includes('localhost')
    ) {
      errors.push('DATABASE_URL must be a non-default production database URL in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertValidEnv(env: Record<string, string | undefined> = process.env): void {
  const result = validateEnv(env);
  if (!result.valid) {
    throw new Error(`Environment validation failed:\n${result.errors.map((e) => ` - ${e}`).join('\n')}`);
  }
}
