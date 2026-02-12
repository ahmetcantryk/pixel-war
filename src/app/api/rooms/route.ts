import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInviteToken } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameDuration = 30, totalRounds = 3 } = body;

    // Validate inputs
    const validDurations = [15, 30, 45, 60, 90, 120];
    const validRounds = [1, 3, 5, 7];

    const duration = validDurations.includes(gameDuration) ? gameDuration : 30;
    const rounds = validRounds.includes(totalRounds) ? totalRounds : 3;

    const supabase = await createClient();

    // Mevcut oturum kontrolü
    const {
      data: { session },
    } = await supabase.auth.getSession();

    let userId = session?.user?.id;

    // Anonim oturum oluştur
    if (!userId) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      userId = data.user?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Kullanıcı oluşturulamadı' }, { status: 400 });
    }

    // Oda oluştur
    const inviteToken = generateInviteToken();

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        owner_id: userId,
        status: 'waiting',
        invite_token: inviteToken,
        game_duration: duration,
        total_rounds: rounds,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ roomId: data.id });
  } catch (error) {
    console.error('Room creation error:', error);
    return NextResponse.json({ error: 'Oda oluşturulamadı' }, { status: 500 });
  }
}
