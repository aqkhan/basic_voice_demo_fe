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
    const handleDataReceived = (
      payload: Uint8Array,
      participant?: any,
      kind?: any,
      topic?: string
    ) => {
      console.log('[useEmailInput] 📨 RAW DATA RECEIVED');
      console.log('[useEmailInput] - Payload length:', payload.length);
      console.log('[useEmailInput] - From participant:', participant?.identity);
      console.log('[useEmailInput] - Kind:', kind);
      console.log('[useEmailInput] - Topic:', topic);

      try {
        const decoder = new TextDecoder();
        const dataString = decoder.decode(payload);
        console.log('[useEmailInput] - Raw string:', dataString);

        const data = JSON.parse(dataString) as EmailInputRequest;
        console.log('[useEmailInput] - Parsed data:', data);
        console.log('[useEmailInput] - Data type:', data.type);
        console.log('[useEmailInput] - Input type:', data.input_type);

        if (data.type === 'request_input' && data.input_type === 'email') {
          console.log('[useEmailInput] ✅ EMAIL INPUT REQUESTED - SHOWING MODAL');
          setEmailLabel(data.label || 'Please enter your email address');
          setEmailPlaceholder(data.placeholder || 'your.email@example.com');
          setShowEmailInput(true);
        } else {
          console.log('[useEmailInput] ❌ Not an email request, ignoring');
        }
      } catch (error) {
        console.error('[useEmailInput] ❌ Error parsing data:', error);
      }
    };

    console.log('[useEmailInput] 🔧 Setting up DataReceived listener');
    console.log('[useEmailInput] - Room state:', room.state);
    console.log('[useEmailInput] - Room name:', room.name);
    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      console.log('[useEmailInput] 🧹 Cleaning up DataReceived listener');
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
