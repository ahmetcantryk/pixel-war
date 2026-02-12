# Pixel War - 1v1 Gerçek Zamanlı Alan Boyama Oyunu

Pixel War, 2 oyunculu gerçek zamanlı bir grid tabanlı alan boyama oyunudur. Oyuncular özel davet linki ile aynı odaya katılır ve 30 saniye boyunca hareket ederek arkalarında bıraktıkları izlerle alan boyar.

## Özellikler

- **Gerçek zamanlı 1v1 oyun**: Supabase Realtime ile senkronize
- **Anonim kimlik doğrulama**: Kayıt olmadan hemen oyna
- **Tek kullanımlık davet linki**: Güvenli oda sistemi
- **Kapalı alan algoritması**: Flood-fill ile otomatik alan doldurma
- **30 saniyelik rekabet**: Hızlı ve heyecanlı oyun

## Teknolojiler

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Supabase (Auth + Realtime + PostgreSQL)
- **Rendering**: HTML5 Canvas
- **Styling**: Tailwind CSS

## Kurulum

### 1. Bağımlılıkları yükle

```bash
npm install
```

### 2. Supabase yapılandırması

`.env.local` dosyasını düzenle:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Veritabanı şemasını uygula

Supabase SQL Editor'da `supabase/migrations/001_initial_schema.sql` dosyasını çalıştır.

### 4. Supabase Authentication ayarları

Supabase Dashboard'da:
1. Authentication > Settings > Auth Providers
2. "Anonymous Sign-ins" seçeneğini aktif et

### 5. Uygulamayı başlat

```bash
npm run dev
```

## Oyun Kuralları

1. **Başlangıç**: Her oyuncu 3x3'lük güvenli bir alanla başlar
2. **Hareket**: WASD veya ok tuşları ile hareket et
3. **İz bırakma**: Kendi alanından çıkınca iz bırakırsın
4. **Alan fethi**: Kendi alanına geri döndüğünde, iz ile çevrili alan senin olur
5. **Tehlike**: Rakibin izine değersen kaybedersin!
6. **Süre**: 30 saniye sonunda en çok alana sahip olan kazanır

## Proje Yapısı

```
src/
├── app/
│   ├── page.tsx              # Ana sayfa
│   ├── actions.ts            # Server actions
│   └── room/[id]/
│       ├── page.tsx          # Oda sayfası
│       └── RoomClient.tsx    # Client component
├── components/
│   ├── GameCanvas.tsx        # Canvas renderer
│   ├── ScoreBoard.tsx        # Skor paneli
│   ├── GameOverModal.tsx     # Oyun sonu
│   └── WaitingRoom.tsx       # Bekleme odası
├── hooks/
│   ├── useGameState.ts       # Oyun durumu
│   ├── useKeyboard.ts        # Klavye kontrolü
│   └── useRealtime.ts        # Realtime
└── lib/
    ├── game/
    │   ├── engine.ts         # Oyun motoru
    │   ├── grid.ts           # Grid işlemleri
    │   ├── flood-fill.ts     # Alan hesaplama
    │   └── constants.ts      # Sabitler
    └── supabase/
        ├── client.ts         # Browser client
        └── server.ts         # Server client
```

## Lisans

MIT
