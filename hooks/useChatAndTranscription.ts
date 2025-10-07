import { useMemo } from 'react';
import {
  type ReceivedChatMessage,
  useChat,
  useRoomContext,
} from '@livekit/components-react';
import useTranscriptionMessages from './useTranscriptionMessages';

export default function useChatAndTranscription() {
  const chat = useChat();
  const room = useRoomContext();
  const transcriptions = useTranscriptionMessages(room);

  const mergedMessages = useMemo(() => {
    const merged: Array<ReceivedChatMessage> = [
      ...transcriptions,
      ...chat.chatMessages,
    ];
    const sorted = merged.sort((a, b) => a.timestamp - b.timestamp);
    console.log('[useChatAndTranscription] Total messages:', sorted.length);
    console.log('[useChatAndTranscription] Transcriptions:', transcriptions.length);
    console.log('[useChatAndTranscription] Chat messages:', chat.chatMessages.length);
    return sorted;
  }, [transcriptions, chat.chatMessages]);

  return { messages: mergedMessages, send: chat.send };
}
