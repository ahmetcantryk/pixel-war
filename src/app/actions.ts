'use server';

import { createClient } from '@/lib/supabase/server';
import { generateInviteToken } from '@/lib/utils';
import { redirect } from 'next/navigation';

// Anonim kullanıcı oluştur veya mevcut oturumu al
export async function getOrCreateUser() {
  const supabase = await createClient();

  // Mevcut oturum kontrolü
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    return { userId: session.user.id, error: null };
  }

  // Anonim oturum oluştur
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    return { userId: null, error: error.message };
  }

  return { userId: data.user?.id ?? null, error: null };
}

// Oda oluştur
export async function createRoom() {
  const supabase = await createClient();

  // Kullanıcı kontrolü
  const { userId, error: userError } = await getOrCreateUser();
  if (!userId) {
    return { roomId: null, error: userError || 'Kullanıcı oluşturulamadı' };
  }

  // Oda oluştur
  const inviteToken = generateInviteToken();

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      owner_id: userId,
      status: 'waiting',
      invite_token: inviteToken,
    })
    .select('id')
    .single();

  if (error) {
    return { roomId: null, error: error.message };
  }

  return { roomId: data.id, error: null };
}

// Odaya katıl
export async function joinRoom(roomId: string) {
  const supabase = await createClient();

  // Kullanıcı kontrolü
  const { userId, error: userError } = await getOrCreateUser();
  if (!userId) {
    return { success: false, role: null, error: userError || 'Kullanıcı oluşturulamadı' };
  }

  // join_room fonksiyonunu çağır
  const { data, error } = await supabase.rpc('join_room', {
    p_room_id: roomId,
    p_user_id: userId,
  });

  if (error) {
    return { success: false, role: null, error: error.message };
  }

  const result = data as { success: boolean; role?: string; error?: string; status?: string };

  if (!result.success) {
    return { success: false, role: null, error: result.error || 'Odaya katılınamadı' };
  }

  return { success: true, role: result.role, status: result.status, error: null };
}

// Oda bilgisi al
export async function getRoom(roomId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (error) {
    return { room: null, error: error.message };
  }

  return { room: data, error: null };
}

// Kullanıcı ID'sini al
export async function getCurrentUserId() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user?.id ?? null;
}

// Oda oluştur ve yönlendir
export async function createRoomAndRedirect() {
  const { roomId, error } = await createRoom();

  if (error || !roomId) {
    throw new Error(error || 'Oda oluşturulamadı');
  }

  redirect(`/room/${roomId}`);
}
