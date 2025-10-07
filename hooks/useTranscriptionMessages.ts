import { useEffect, useState } from 'react';
import { RoomEvent, type Room } from 'livekit-client';
import type { ReceivedChatMessage } from '@livekit/components-react';

interface TranscriptionData {
  type: 'transcription';
  role: 'assistant' | 'user';
  text: string;
  timestamp?: number;
}

export default function useTranscriptionMessages(room: Room) {
  const [transcriptions, setTranscriptions] = useState<ReceivedChatMessage[]>([]);

  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array, participant?: any) => {
      console.log('[useTranscriptionMessages] DataReceived event triggered');
      console.log('[useTranscriptionMessages] Payload:', payload);
      console.log('[useTranscriptionMessages] Participant:', participant);

      try {
        const decodedString = new TextDecoder().decode(payload);
        console.log('[useTranscriptionMessages] Decoded string:', decodedString);

        const data = JSON.parse(decodedString);
        console.log('[useTranscriptionMessages] Parsed data:', data);

        if (data.type === 'transcription') {
          console.log(`${data.role}: ${data.text}`);

          // Convert transcription to chat message format
          const transcriptionMessage: ReceivedChatMessage = {
            id: `transcription-${Date.now()}-${Math.random()}`,
            timestamp: data.timestamp || Date.now(),
            message: data.text,
            from: data.role === 'user' ? room.localParticipant : participant,
          };

          console.log('[useTranscriptionMessages] Adding transcription message:', transcriptionMessage);
          setTranscriptions((prev) => {
            const updated = [...prev, transcriptionMessage];
            console.log('[useTranscriptionMessages] Updated transcriptions array:', updated);
            return updated;
          });
        } else {
          console.log('[useTranscriptionMessages] Data type is not transcription:', data.type);
        }
      } catch (error) {
        console.error('[useTranscriptionMessages] Error parsing transcription data:', error);
      }
    };

    console.log('[useTranscriptionMessages] Setting up DataReceived listener');
    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      console.log('[useTranscriptionMessages] Cleaning up DataReceived listener');
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  return transcriptions;
}
