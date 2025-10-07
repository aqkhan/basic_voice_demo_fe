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
      try {
        const data = JSON.parse(new TextDecoder().decode(payload)) as TranscriptionData;

        if (data.type === 'transcription') {
          console.log(`${data.role}: ${data.text}`);

          // Convert transcription to chat message format
          const transcriptionMessage: ReceivedChatMessage = {
            id: `transcription-${Date.now()}-${Math.random()}`,
            timestamp: data.timestamp || Date.now(),
            message: data.text,
            from: data.role === 'user' ? room.localParticipant : participant,
          };

          setTranscriptions((prev) => [...prev, transcriptionMessage]);
        }
      } catch (error) {
        console.error('Error parsing transcription data:', error);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  return transcriptions;
}
