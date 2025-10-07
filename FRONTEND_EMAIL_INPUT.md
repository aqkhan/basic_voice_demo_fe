# Frontend Email Input Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Complete Implementation Guide](#complete-implementation-guide)
4. [Framework-Specific Examples](#framework-specific-examples)
5. [Data Message Formats](#data-message-formats)
6. [Testing & Debugging](#testing--debugging)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides complete implementation instructions for integrating an email input UI that communicates with a LiveKit voice agent. The agent sends data messages to trigger UI elements, and the frontend sends email data back to the agent.

### How It Works

1. **Agent → Frontend**: Agent sends a data message requesting email input
2. **Frontend**: Displays an email input form to the user
3. **User**: Enters their email and submits
4. **Frontend → Agent**: Sends the email back to the agent via data message
5. **Agent**: Processes the email (sends verification code, etc.)

### Prerequisites

- LiveKit client SDK installed (`livekit-client` package)
- Connected to a LiveKit room with the agent
- Basic understanding of JavaScript/TypeScript and your framework

---

## Quick Start

### Minimal Implementation (Vanilla JavaScript)

```javascript
import { Room, RoomEvent } from 'livekit-client';

// 1. Initialize room and connect
const room = new Room();
await room.connect(LIVEKIT_URL, TOKEN);

// 2. Listen for email input requests from agent
room.on(RoomEvent.DataReceived, (payload) => {
  const decoder = new TextDecoder();
  const data = JSON.parse(decoder.decode(payload));

  if (data.type === 'request_input' && data.input_type === 'email') {
    showEmailInputUI(data.label, data.placeholder);
  }
});

// 3. Show email input form
function showEmailInputUI(label, placeholder) {
  // Your UI code here - see detailed examples below
  const email = prompt(label); // Simple example
  if (email) submitEmailToAgent(email);
}

// 4. Send email back to agent
function submitEmailToAgent(email) {
  const message = JSON.stringify({
    type: 'email_submitted',
    email: email
  });

  const encoder = new TextEncoder();
  room.localParticipant.publishData(encoder.encode(message), { reliable: true });
}
```

---

## Complete Implementation Guide

### Step 1: Set Up LiveKit Room Connection

```javascript
import { Room, RoomEvent, RoomOptions } from 'livekit-client';

// Configuration
const LIVEKIT_URL = 'wss://your-livekit-server.com'; // Your LiveKit server URL
const LIVEKIT_TOKEN = 'your-token'; // Get from your backend

// Room options (optional but recommended)
const roomOptions = {
  adaptiveStream: true,
  dynacast: true,
  publishDefaults: {
    videoSimulcastLayers: [],
  },
};

// Create and connect to room
const room = new Room(roomOptions);

try {
  await room.connect(LIVEKIT_URL, LIVEKIT_TOKEN);
  console.log('Connected to room:', room.name);
  console.log('Local participant:', room.localParticipant.identity);
} catch (error) {
  console.error('Failed to connect to room:', error);
}
```

### Step 2: Set Up Data Message Listener

**IMPORTANT**: Attach the event listener AFTER connecting to the room.

```javascript
// Listen for data messages from the agent
room.on(RoomEvent.DataReceived, (
  payload,      // Uint8Array - the raw data
  participant,  // RemoteParticipant | undefined - who sent it (usually the agent)
  kind,         // DataPacket_Kind - RELIABLE or LOSSY
  topic         // string | undefined - optional topic/channel
) => {
  try {
    // Decode the payload
    const decoder = new TextDecoder();
    const dataString = decoder.decode(payload);

    console.log('📨 Received data from agent:', dataString);

    // Parse JSON
    const data = JSON.parse(dataString);

    // Handle email input request
    if (data.type === 'request_input' && data.input_type === 'email') {
      console.log('🔔 Email input requested');
      showEmailInputUI(data);
    }

  } catch (error) {
    console.error('❌ Error processing data message:', error);
  }
});

// Optional: Log room connection events for debugging
room.on(RoomEvent.Connected, () => {
  console.log('✅ Room connected successfully');
});

room.on(RoomEvent.Disconnected, () => {
  console.log('❌ Room disconnected');
});

room.on(RoomEvent.ParticipantConnected, (participant) => {
  console.log('👤 Participant connected:', participant.identity);
});
```

### Step 3: Create Email Input UI

#### Option A: Modal Overlay (Recommended)

```javascript
function showEmailInputUI(data) {
  // Create modal overlay
  const modal = document.createElement('div');
  modal.id = 'email-input-modal';
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <h2>${data.label || 'Enter Your Email'}</h2>
        <form id="email-form">
          <input
            type="email"
            id="email-input"
            placeholder="${data.placeholder || 'your.email@example.com'}"
            required
            autocomplete="email"
            autofocus
          />
          <div class="button-group">
            <button type="submit" class="btn-primary">Submit</button>
            <button type="button" class="btn-secondary" id="cancel-btn">Cancel</button>
          </div>
        </form>
        <div id="error-message" class="error-message"></div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle form submission
  const form = document.getElementById('email-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email-input').value;

    if (validateEmail(email)) {
      submitEmailToAgent(email);
      closeModal();
    } else {
      showError('Please enter a valid email address');
    }
  });

  // Handle cancel
  document.getElementById('cancel-btn').addEventListener('click', closeModal);

  // Close on overlay click
  modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeModal();
    }
  });

  // Helper functions
  function closeModal() {
    modal.remove();
  }

  function showError(message) {
    document.getElementById('error-message').textContent = message;
  }
}
```

#### Option B: Inline Form

```javascript
function showEmailInputUI(data) {
  // Create inline form in a specific container
  const container = document.getElementById('email-form-container'); // Must exist in your HTML

  container.innerHTML = `
    <div class="email-input-form">
      <label>${data.label || 'Enter Your Email'}</label>
      <form id="email-form">
        <input
          type="email"
          id="email-input"
          placeholder="${data.placeholder || 'your.email@example.com'}"
          required
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  `;

  container.style.display = 'block';

  document.getElementById('email-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email-input').value;

    if (validateEmail(email)) {
      submitEmailToAgent(email);
      container.style.display = 'none';
    }
  });
}
```

### Step 4: Validate and Submit Email

```javascript
// Email validation using regex
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Send email to agent
function submitEmailToAgent(email) {
  console.log('📤 Submitting email to agent:', email);

  // Create message object
  const message = {
    type: 'email_submitted',
    email: email,
    timestamp: Date.now() // Optional: include timestamp
  };

  // Convert to JSON string
  const messageString = JSON.stringify(message);

  // Encode to bytes
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(messageString);

  // Publish to room
  try {
    room.localParticipant.publishData(messageBytes, {
      reliable: true,  // Ensure delivery
      topic: 'email'   // Optional: use topic for routing
    });

    console.log('✅ Email sent successfully');

    // Optional: Show success message to user
    showSuccessMessage('Email submitted! Please wait for verification code.');

  } catch (error) {
    console.error('❌ Failed to send email:', error);
    showErrorMessage('Failed to submit email. Please try again.');
  }
}

// Optional: User feedback functions
function showSuccessMessage(message) {
  // Implement your success notification (toast, alert, etc.)
  console.log('✅', message);
}

function showErrorMessage(message) {
  // Implement your error notification
  console.error('❌', message);
}
```

### Step 5: Add CSS Styling

```css
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-in-out;
}

/* Modal Content */
.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 90%;
  animation: slideIn 0.3s ease-out;
}

.modal-content h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  color: #333;
}

/* Form Styling */
#email-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

#email-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
}

#email-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

/* Buttons */
.button-group {
  display: flex;
  gap: 0.5rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  flex: 1;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background-color: #45a049;
}

.btn-secondary {
  background-color: #f1f1f1;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

/* Error Message */
.error-message {
  color: #f44336;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  min-height: 1.25rem;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

---

## Framework-Specific Examples

### React / Next.js

```jsx
import { useEffect, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';

export default function EmailInputModal({ room }) {
  const [isOpen, setIsOpen] = useState(false);
  const [emailLabel, setEmailLabel] = useState('');
  const [emailPlaceholder, setEmailPlaceholder] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!room) return;

    // Handler for data received from agent
    const handleDataReceived = (payload) => {
      try {
        const decoder = new TextDecoder();
        const dataString = decoder.decode(payload);
        const data = JSON.parse(dataString);

        console.log('📨 Received data:', data);

        if (data.type === 'request_input' && data.input_type === 'email') {
          setEmailLabel(data.label || 'Enter Your Email');
          setEmailPlaceholder(data.placeholder || 'your.email@example.com');
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error processing data:', error);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    // Cleanup
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Send email to agent
    const message = JSON.stringify({
      type: 'email_submitted',
      email: email
    });

    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    try {
      room.localParticipant.publishData(data, { reliable: true });
      console.log('✅ Email submitted:', email);

      // Close modal and reset
      setIsOpen(false);
      setEmail('');
      setError('');
    } catch (error) {
      console.error('Failed to send email:', error);
      setError('Failed to submit. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setIsOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{emailLabel}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={emailPlaceholder}
            required
            autoFocus
          />
          {error && <div className="error-message">{error}</div>}
          <div className="button-group">
            <button type="submit" className="btn-primary">Submit</button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Usage in parent component:**

```jsx
import { useState, useEffect } from 'react';
import { Room } from 'livekit-client';
import EmailInputModal from './EmailInputModal';

export default function VoiceAgent() {
  const [room, setRoom] = useState(null);

  useEffect(() => {
    const connectToRoom = async () => {
      const newRoom = new Room();
      await newRoom.connect(LIVEKIT_URL, TOKEN);
      setRoom(newRoom);
    };

    connectToRoom();

    return () => {
      room?.disconnect();
    };
  }, []);

  return (
    <div>
      {/* Your voice agent UI */}
      <EmailInputModal room={room} />
    </div>
  );
}
```

### Vue.js

```vue
<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h2>{{ emailLabel }}</h2>
      <form @submit.prevent="handleSubmit">
        <input
          v-model="email"
          type="email"
          :placeholder="emailPlaceholder"
          required
          ref="emailInput"
        />
        <div v-if="error" class="error-message">{{ error }}</div>
        <div class="button-group">
          <button type="submit" class="btn-primary">Submit</button>
          <button type="button" class="btn-secondary" @click="closeModal">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { RoomEvent } from 'livekit-client';

export default {
  name: 'EmailInputModal',
  props: {
    room: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const isOpen = ref(false);
    const emailLabel = ref('');
    const emailPlaceholder = ref('');
    const email = ref('');
    const error = ref('');

    const handleDataReceived = (payload) => {
      try {
        const decoder = new TextDecoder();
        const dataString = decoder.decode(payload);
        const data = JSON.parse(dataString);

        if (data.type === 'request_input' && data.input_type === 'email') {
          emailLabel.value = data.label || 'Enter Your Email';
          emailPlaceholder.value = data.placeholder || 'your.email@example.com';
          isOpen.value = true;
        }
      } catch (err) {
        console.error('Error processing data:', err);
      }
    };

    const validateEmail = (email) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = () => {
      error.value = '';

      if (!validateEmail(email.value)) {
        error.value = 'Please enter a valid email address';
        return;
      }

      const message = JSON.stringify({
        type: 'email_submitted',
        email: email.value
      });

      const encoder = new TextEncoder();
      const data = encoder.encode(message);

      try {
        props.room.localParticipant.publishData(data, { reliable: true });
        closeModal();
      } catch (err) {
        console.error('Failed to send email:', err);
        error.value = 'Failed to submit. Please try again.';
      }
    };

    const closeModal = () => {
      isOpen.value = false;
      email.value = '';
      error.value = '';
    };

    onMounted(() => {
      if (props.room) {
        props.room.on(RoomEvent.DataReceived, handleDataReceived);
      }
    });

    onUnmounted(() => {
      if (props.room) {
        props.room.off(RoomEvent.DataReceived, handleDataReceived);
      }
    });

    return {
      isOpen,
      emailLabel,
      emailPlaceholder,
      email,
      error,
      handleSubmit,
      closeModal
    };
  }
};
</script>
```

### Svelte

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { RoomEvent } from 'livekit-client';

  export let room;

  let isOpen = false;
  let emailLabel = '';
  let emailPlaceholder = '';
  let email = '';
  let error = '';

  function handleDataReceived(payload) {
    try {
      const decoder = new TextDecoder();
      const dataString = decoder.decode(payload);
      const data = JSON.parse(dataString);

      if (data.type === 'request_input' && data.input_type === 'email') {
        emailLabel = data.label || 'Enter Your Email';
        emailPlaceholder = data.placeholder || 'your.email@example.com';
        isOpen = true;
      }
    } catch (err) {
      console.error('Error processing data:', err);
    }
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function handleSubmit() {
    error = '';

    if (!validateEmail(email)) {
      error = 'Please enter a valid email address';
      return;
    }

    const message = JSON.stringify({
      type: 'email_submitted',
      email: email
    });

    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    try {
      room.localParticipant.publishData(data, { reliable: true });
      closeModal();
    } catch (err) {
      console.error('Failed to send email:', err);
      error = 'Failed to submit. Please try again.';
    }
  }

  function closeModal() {
    isOpen = false;
    email = '';
    error = '';
  }

  onMount(() => {
    if (room) {
      room.on(RoomEvent.DataReceived, handleDataReceived);
    }
  });

  onDestroy(() => {
    if (room) {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    }
  });
</script>

{#if isOpen}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      <h2>{emailLabel}</h2>
      <form on:submit|preventDefault={handleSubmit}>
        <input
          type="email"
          bind:value={email}
          placeholder={emailPlaceholder}
          required
          autofocus
        />
        {#if error}
          <div class="error-message">{error}</div>
        {/if}
        <div class="button-group">
          <button type="submit" class="btn-primary">Submit</button>
          <button type="button" class="btn-secondary" on:click={closeModal}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
```

---

## Data Message Formats

### Agent → Frontend (Request Email Input)

**Message Structure:**
```json
{
  "type": "request_input",
  "input_type": "email",
  "label": "Please enter your email address",
  "placeholder": "your.email@example.com"
}
```

**Field Descriptions:**
- `type` (string, required): Always `"request_input"` for UI requests
- `input_type` (string, required): Type of input - `"email"`, `"text"`, `"number"`, etc.
- `label` (string, optional): Label text to display above the input field
- `placeholder` (string, optional): Placeholder text for the input field

### Frontend → Agent (Submit Email)

**Message Structure:**
```json
{
  "type": "email_submitted",
  "email": "user@example.com",
  "timestamp": 1704067200000
}
```

**Field Descriptions:**
- `type` (string, required): Always `"email_submitted"` for email submissions
- `email` (string, required): The email address entered by the user
- `timestamp` (number, optional): Unix timestamp in milliseconds

---

## Testing & Debugging

### Enable Debug Logging

```javascript
// Add comprehensive logging
room.on(RoomEvent.Connected, () => {
  console.log('✅ Room connected');
  console.log('Room name:', room.name);
  console.log('Local participant:', room.localParticipant.identity);
});

room.on(RoomEvent.Disconnected, (reason) => {
  console.log('❌ Room disconnected:', reason);
});

room.on(RoomEvent.ParticipantConnected, (participant) => {
  console.log('👤 Participant connected:', participant.identity);
});

room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
  console.log('📨 === DATA RECEIVED ===');
  console.log('From:', participant?.identity || 'unknown');
  console.log('Kind:', kind);
  console.log('Topic:', topic || 'none');
  console.log('Payload type:', payload.constructor.name);
  console.log('Payload size:', payload.length, 'bytes');

  const decoder = new TextDecoder();
  const dataString = decoder.decode(payload);
  console.log('Raw data:', dataString);

  try {
    const data = JSON.parse(dataString);
    console.log('Parsed data:', data);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
  }
});
```

### Test Data Message Manually

You can test receiving messages by sending them from the browser console:

```javascript
// Send a test message to yourself (for testing)
const testMessage = JSON.stringify({
  type: 'request_input',
  input_type: 'email',
  label: 'Test Email Input',
  placeholder: 'test@example.com'
});

const encoder = new TextEncoder();
room.localParticipant.publishData(encoder.encode(testMessage), { reliable: true });
```

### Create a Debug Panel

```html
<div id="debug-panel" style="position: fixed; bottom: 0; right: 0; background: #000; color: #0f0; padding: 10px; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto; z-index: 10000;">
  <div id="debug-log"></div>
</div>

<script>
function debugLog(message) {
  const debugPanel = document.getElementById('debug-log');
  const timestamp = new Date().toLocaleTimeString();
  debugPanel.innerHTML += `[${timestamp}] ${message}<br>`;
  debugPanel.scrollTop = debugPanel.scrollHeight;
}

// Use it in your event handlers
room.on(RoomEvent.DataReceived, (payload) => {
  debugLog('Data received: ' + payload.length + ' bytes');
});
</script>
```

---

## Troubleshooting

### Issue: Frontend Not Receiving Data Messages

**Symptoms:**
- `RoomEvent.DataReceived` handler never fires
- No data messages appearing in console

**Solutions:**

1. **Verify room connection:**
```javascript
console.log('Room state:', room.state);
console.log('Is connected:', room.state === 'connected');
```

2. **Ensure event listener is attached after connection:**
```javascript
// ✅ CORRECT
await room.connect(url, token);
room.on(RoomEvent.DataReceived, handler);

// ❌ WRONG
room.on(RoomEvent.DataReceived, handler);
await room.connect(url, token);
```

3. **Check if agent is in the room:**
```javascript
room.on(RoomEvent.ParticipantConnected, (participant) => {
  console.log('Participant joined:', participant.identity);
  // You should see the agent participant here
});
```

4. **Verify the agent is sending data:**
Check agent logs for:
```
///// ////////// Sent email input UI request to client: {"type": "request_input", ...}
```

### Issue: `TypeError: Cannot read property 'publishData' of undefined`

**Cause:** Room or local participant is not initialized

**Solution:**
```javascript
// Add null checks
if (room && room.localParticipant) {
  room.localParticipant.publishData(data, { reliable: true });
} else {
  console.error('Room not connected');
}
```

### Issue: Email Not Reaching Agent

**Symptoms:**
- Email is submitted but agent doesn't receive it
- No errors in frontend console

**Solutions:**

1. **Verify data encoding:**
```javascript
const message = JSON.stringify({ type: 'email_submitted', email: email });
const encoder = new TextEncoder();
const data = encoder.encode(message);

console.log('Sending message:', message);
console.log('Encoded bytes:', data.length);

room.localParticipant.publishData(data, { reliable: true });
console.log('Data published successfully');
```

2. **Check agent's data handler:**
The agent should have a handler like this in `entrypoint`:
```python
@ctx.room.on("data_received")
def _on_data_received(data_packet: DataPacket):
    data_str = data_packet.data.decode('utf-8')
    data = json.loads(data_str)
    if data.get("type") == "email_submitted":
        # Process email
```

### Issue: Modal Not Displaying

**Symptoms:**
- Data is received but UI doesn't show

**Solutions:**

1. **Check CSS z-index:**
```css
.modal-overlay {
  z-index: 9999; /* Make sure it's higher than other elements */
}
```

2. **Verify element is added to DOM:**
```javascript
function showEmailInputUI(data) {
  const modal = createModal(data);
  document.body.appendChild(modal);

  console.log('Modal added to DOM:', document.getElementById('email-input-modal'));
}
```

3. **Check for display: none or visibility issues:**
```javascript
const modal = document.getElementById('email-input-modal');
console.log('Modal computed style:', window.getComputedStyle(modal).display);
```

### Issue: Multiple Modals Appearing

**Cause:** Handler is called multiple times or old modals aren't removed

**Solution:**
```javascript
function showEmailInputUI(data) {
  // Remove any existing modal first
  const existing = document.getElementById('email-input-modal');
  if (existing) {
    existing.remove();
  }

  // Then create new modal
  const modal = createModal(data);
  document.body.appendChild(modal);
}
```

### Issue: Email Validation Always Fails

**Solution:** Check your regex pattern:
```javascript
function validateEmail(email) {
  // Standard email regex
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  console.log('Validating:', email);
  console.log('Is valid:', regex.test(email));

  return regex.test(email);
}

// Test cases
console.log(validateEmail('test@example.com')); // true
console.log(validateEmail('invalid.email'));     // false
console.log(validateEmail('test@.com'));         // false
```

### Issue: CORS or Connection Errors

**Symptoms:**
- Can't connect to LiveKit server
- WebSocket connection fails

**Solutions:**

1. **Verify LiveKit URL format:**
```javascript
// ✅ CORRECT
const url = 'wss://your-server.livekit.cloud';

// ❌ WRONG
const url = 'https://your-server.livekit.cloud'; // Should be wss:// not https://
const url = 'your-server.livekit.cloud';         // Missing protocol
```

2. **Check token validity:**
```javascript
try {
  await room.connect(url, token);
} catch (error) {
  console.error('Connection error:', error.message);
  // Common: "token is expired" or "invalid token"
}
```

### Issue: Agent Context Not Available

**Symptoms:**
- Agent logs show: `Unable to display UI - context not available`

**Cause:** Agent's `ctx` property is not set

**Solution in agent code (already implemented in `a3.py`):**
```python
# In entrypoint function
initial_agent = IntakeAgent()
initial_agent.ctx = ctx  # ← Must set this BEFORE session.start()

await session.start(agent=initial_agent, room=ctx.room)
```

---

## Additional Features

### Loading State

```javascript
function submitEmailToAgent(email) {
  // Show loading state
  const submitBtn = document.querySelector('.btn-primary');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  const message = JSON.stringify({
    type: 'email_submitted',
    email: email
  });

  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  try {
    room.localParticipant.publishData(data, { reliable: true });

    // Show success
    submitBtn.textContent = 'Sent!';
    setTimeout(() => {
      closeModal();
    }, 500);

  } catch (error) {
    // Show error and re-enable
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
    showError('Failed to submit. Please try again.');
  }
}
```

### Timeout Handling

```javascript
function showEmailInputUI(data) {
  const modal = createModal(data);
  document.body.appendChild(modal);

  // Auto-close after 2 minutes if no response
  const timeout = setTimeout(() => {
    console.warn('Email input timed out');
    closeModal();
  }, 120000); // 2 minutes

  // Clear timeout when modal is closed
  const originalClose = closeModal;
  closeModal = () => {
    clearTimeout(timeout);
    originalClose();
  };
}
```

### Keyboard Shortcuts

```javascript
function showEmailInputUI(data) {
  const modal = createModal(data);
  document.body.appendChild(modal);

  // Close on Escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  // Cleanup
  const originalClose = closeModal;
  closeModal = () => {
    document.removeEventListener('keydown', handleKeyDown);
    originalClose();
  };
}
```

---

## Summary Checklist

✅ **Setup:**
- [ ] Install `livekit-client` package
- [ ] Create Room instance and connect
- [ ] Get LiveKit URL and token from backend

✅ **Implementation:**
- [ ] Add `RoomEvent.DataReceived` event listener
- [ ] Create email input UI (modal or inline)
- [ ] Implement email validation
- [ ] Implement `submitEmailToAgent()` function

✅ **Styling:**
- [ ] Add CSS for modal/form
- [ ] Make responsive for mobile
- [ ] Add loading/error states

✅ **Testing:**
- [ ] Test data message reception
- [ ] Test email submission
- [ ] Test error handling
- [ ] Test on different browsers/devices

✅ **Debugging:**
- [ ] Add console logging
- [ ] Verify room connection
- [ ] Check agent logs
- [ ] Test with manual data messages

---

## Support

If you encounter issues not covered in this guide:

1. **Check agent logs** for data transmission confirmation
2. **Enable verbose logging** in frontend console
3. **Verify LiveKit SDK version** compatibility
4. **Test with minimal example** first, then add complexity
5. **Check network tab** for WebSocket connections

---

**Last Updated:** 2025-10-07
**Agent Version:** Compatible with LiveKit Agents Python SDK v0.8+
**Client Version:** Compatible with livekit-client v2.0+
