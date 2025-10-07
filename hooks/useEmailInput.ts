import { useEffect, useState } from 'react';
import { RoomEvent, type Room } from 'livekit-client';

interface EmailInputRequest {
  type: 'request_input';
  input_type: 'email';
  label?: string;
  placeholder?: string;
}

export default function useEmailInput(room: Room) {
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailLabel, setEmailLabel] = useState('Please enter your email address');
  const [emailPlaceholder, setEmailPlaceholder] = useState('your.email@example.com');

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
      // Only process messages with topic "email_input"
      if (topic !== 'email_input') {
        return;
      }

      try {
        const decoder = new TextDecoder();
        const dataString = decoder.decode(payload);
        const data = JSON.parse(dataString) as EmailInputRequest;

        if (data.type === 'request_input' && data.input_type === 'email') {
          setEmailLabel(data.label || 'Please enter your email address');
          setEmailPlaceholder(data.placeholder || 'your.email@example.com');
          setShowEmailInput(true);
        }
      } catch (error) {
        console.error('[useEmailInput] Error parsing data:', error);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  const submitEmail = (email: string) => {
    const message = JSON.stringify({
      type: 'email_submitted',
      email: email,
    });

    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    room.localParticipant.publishData(data, { reliable: true });

    setShowEmailInput(false);
  };

  const closeEmailInput = () => {
    setShowEmailInput(false);
  };

  return {
    showEmailInput,
    emailLabel,
    emailPlaceholder,
    submitEmail,
    closeEmailInput,
  };
}
