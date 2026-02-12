-- Rooms tablosu
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  guest_id UUID,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  invite_token TEXT UNIQUE,
  winner_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game states tablosu
CREATE TABLE IF NOT EXISTS game_states (
  room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
  grid JSONB NOT NULL DEFAULT '[]',
  player1_pos JSONB NOT NULL DEFAULT '{"x": 10, "y": 20}',
  player2_pos JSONB NOT NULL DEFAULT '{"x": 30, "y": 20}',
  player1_score INTEGER NOT NULL DEFAULT 9,
  player2_score INTEGER NOT NULL DEFAULT 9,
  player1_trail JSONB NOT NULL DEFAULT '[]',
  player2_trail JSONB NOT NULL DEFAULT '[]',
  player1_direction TEXT NOT NULL DEFAULT 'right',
  player2_direction TEXT NOT NULL DEFAULT 'left',
  remaining_time INTEGER NOT NULL DEFAULT 30,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_invite_token ON rooms(invite_token);
CREATE INDEX IF NOT EXISTS idx_rooms_owner_id ON rooms(owner_id);

-- RLS politikaları
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;

-- Rooms için RLS politikaları
-- Herkes oda oluşturabilir (anonim dahil)
CREATE POLICY "Anyone can create rooms" ON rooms
  FOR INSERT WITH CHECK (true);

-- Herkes odaları okuyabilir
CREATE POLICY "Anyone can read rooms" ON rooms
  FOR SELECT USING (true);

-- Sadece owner veya henüz guest yoksa güncelleme yapılabilir
CREATE POLICY "Update rooms for joining or owner" ON rooms
  FOR UPDATE USING (
    auth.uid() = owner_id OR 
    (guest_id IS NULL AND status = 'waiting')
  );

-- Game states için RLS politikaları
CREATE POLICY "Anyone can read game states" ON game_states
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert game states" ON game_states
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update game states" ON game_states
  FOR UPDATE USING (true);

-- Realtime için publication
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE game_states;

-- Fonksiyon: Odaya katılma (race condition önleme)
CREATE OR REPLACE FUNCTION join_room(
  p_room_id UUID,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Kilitle ve oku
  SELECT * INTO v_room
  FROM rooms
  WHERE id = p_room_id
  FOR UPDATE;

  -- Oda bulunamadı
  IF v_room IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'room_not_found');
  END IF;

  -- Owner tekrar giriyorsa
  IF v_room.owner_id = p_user_id THEN
    RETURN jsonb_build_object('success', true, 'role', 'owner', 'status', v_room.status);
  END IF;

  -- Oda zaten doluysa
  IF v_room.guest_id IS NOT NULL THEN
    -- Eğer zaten guest ise
    IF v_room.guest_id = p_user_id THEN
      RETURN jsonb_build_object('success', true, 'role', 'guest', 'status', v_room.status);
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'room_full');
  END IF;

  -- Oyun zaten başladıysa veya bittiyse
  IF v_room.status != 'waiting' THEN
    RETURN jsonb_build_object('success', false, 'error', 'game_already_started');
  END IF;

  -- Guest olarak katıl
  UPDATE rooms
  SET 
    guest_id = p_user_id,
    status = 'playing',
    invite_token = NULL
  WHERE id = p_room_id;

  RETURN jsonb_build_object('success', true, 'role', 'guest', 'status', 'playing');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
