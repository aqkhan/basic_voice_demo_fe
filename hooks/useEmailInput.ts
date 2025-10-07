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
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload)) as EmailInputRequest;

        console.log('[useEmailInput] Received data:', data);

        if (data.type === 'request_input' && data.input_type === 'email') {
          console.log('[useEmailInput] Email input requested');
          setEmailLabel(data.label || 'Please enter your email address');
          setEmailPlaceholder(data.placeholder || 'your.email@example.com');
          setShowEmailInput(true);
        }
      } catch (error) {
        console.error('[useEmailInput] Error parsing data:', error);
      }
    };

    console.log('[useEmailInput] Setting up DataReceived listener for email input');
    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      console.log('[useEmailInput] Cleaning up DataReceived listener');
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  const submitEmail = (email: string) => {
    console.log('[useEmailInput] Submitting email:', email);

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
