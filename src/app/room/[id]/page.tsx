import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getRoom, getCurrentUserId, getOrCreateUser } from '@/app/actions';
import { RoomClient } from './RoomClient';

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { id: roomId } = await params;

  // Kullanıcı oluştur/al
  const { userId } = await getOrCreateUser();

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Hata</h1>
          <p className="text-gray-400">Oturum oluşturulamadı. Lütfen sayfayı yenileyin.</p>
        </div>
      </div>
    );
  }

  // Oda bilgisini al
  const { room, error } = await getRoom(roomId);

  if (error || !room) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Yükleniyor...</p>
          </div>
        </div>
      }
    >
      <RoomClient
        roomId={roomId}
        initialRoom={room}
        currentUserId={userId}
      />
    </Suspense>
  );
}
