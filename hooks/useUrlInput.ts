import { useEffect, useState } from 'react';
import { RoomEvent, type Room } from 'livekit-client';

interface UrlInputRequest {
  type: 'request_input';
  input_type: 'url';
  label?: string;
  placeholder?: string;
}

export default function useUrlInput(room: Room) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlLabel, setUrlLabel] = useState('Please enter your website URL');
  const [urlPlaceholder, setUrlPlaceholder] = useState('https://www.example.com');

  useEffect(() => {
    if (!room) {
      return;
    }

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: any,
      kind?: any,
      topic?: string
    ) => {
      // Only process messages with topic "url_input"
      if (topic !== 'url_input') {
        return;
      }

      try {
        const decoder = new TextDecoder();
        const dataString = decoder.decode(payload);
        const data = JSON.parse(dataString) as UrlInputRequest;

        if (data.type === 'request_input' && data.input_type === 'url') {
          setUrlLabel(data.label || 'Please enter your website URL');
          setUrlPlaceholder(data.placeholder || 'https://www.example.com');
          setShowUrlInput(true);
        }
      } catch (error) {
        console.error('[useUrlInput] Error parsing data:', error);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  const submitUrl = (url: string) => {
    const message = JSON.stringify({
      type: 'url_submitted',
      url: url,
    });

    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    room.localParticipant.publishData(data, { reliable: true });

    setShowUrlInput(false);
  };

  const closeUrlInput = () => {
    setShowUrlInput(false);
  };

  return {
    showUrlInput,
    urlLabel,
    urlPlaceholder,
    submitUrl,
    closeUrlInput,
  };
}
