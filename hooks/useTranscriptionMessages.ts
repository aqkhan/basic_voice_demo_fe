import { useEffect, useState } from 'react';
import { RoomEvent, type Room } from 'livekit-client';
import type { ReceivedChatMessage } from '@livekit/components-react';

export default function useTranscriptionMessages(room: Room) {
  const [transcriptions, setTranscriptions] = useState<ReceivedChatMessage[]>([]);

  useEffect(() => {
    console.log('[useTranscriptionMessages] Hook initialized, room:', room);
    console.log('[useTranscriptionMessages] Room state:', room.state);

    const handleTranscriptionReceived = (
      segments: { text: string; id: string; final: boolean }[],
      participant: any,
      publication: any
    ) => {
      console.log('=== TRANSCRIPTION RECEIVED ===');
      console.log('[useTranscriptionMessages] Transcription received');
      console.log('[useTranscriptionMessages] Segments:', segments);
      console.log('[useTranscriptionMessages] Participant:', participant);

      // Process each segment
      segments.forEach((segment) => {
        // Only add final transcriptions to avoid duplicates
        if (segment.final) {
          const isLocal = participant?.identity === room.localParticipant?.identity;

          const transcriptionMessage: ReceivedChatMessage = {
            id: segment.id || `transcription-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            message: segment.text,
            from: isLocal ? room.localParticipant : participant,
          };

          console.log('[useTranscriptionMessages] Adding final transcription:', transcriptionMessage);
          setTranscriptions((prev) => {
            // Avoid duplicates by checking if ID already exists
            if (prev.some((t) => t.id === transcriptionMessage.id)) {
              return prev;
            }
            return [...prev, transcriptionMessage];
          });
        }
      });
    };

    console.log('[useTranscriptionMessages] Setting up TranscriptionReceived listener');
    room.on(RoomEvent.TranscriptionReceived, handleTranscriptionReceived);

    return () => {
      console.log('[useTranscriptionMessages] Cleaning up TranscriptionReceived listener');
      room.off(RoomEvent.TranscriptionReceived, handleTranscriptionReceived);
    };
  }, [room]);

  return transcriptions;
}
