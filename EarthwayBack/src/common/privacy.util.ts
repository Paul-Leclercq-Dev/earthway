import * as crypto from 'crypto';

export function hashIpAddress(ip: string | null): string | null {
  if (!ip) {
    return null;
  }

  return crypto.createHash('sha256').update(ip).digest('hex');
}
