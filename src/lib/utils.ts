// UUID oluştur
export function generateId(): string {
  return crypto.randomUUID();
}

// Davet token'ı oluştur
export function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Davet linkini oluştur
export function createInviteLink(roomId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/room/${roomId}`;
  }
  return `/room/${roomId}`;
}

// Süreyi formatla
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Skor formatla
export function formatScore(score: number): string {
  return score.toLocaleString('tr-TR');
}

// Kopyalama fonksiyonu
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
