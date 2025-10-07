# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Next.js 15 frontend application for LiveKit voice agents, built with React 19, TypeScript, and Tailwind CSS. This is a voice assistant interface that connects to LiveKit's real-time communication infrastructure to enable voice interactions, video streaming, screen sharing, and transcriptions with AI agents.

## Development Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Run development server (with Turbopack)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint

# Format code
pnpm format

# Check formatting
pnpm format:check
```

## Environment Setup

Copy `.env.example` to `.env.local` and configure:
- `LIVEKIT_API_KEY`: Your LiveKit API key
- `LIVEKIT_API_SECRET`: Your LiveKit API secret
- `LIVEKIT_URL`: Your LiveKit server URL (format: `wss://<project-subdomain>.livekit.cloud`)

## Architecture

### Application Flow

1. **Welcome → Session Connection**: User starts call from `Welcome` component, triggering connection setup
2. **Token Generation**: `/api/connection-details` endpoint generates LiveKit access token with room config
3. **Room Connection**: App connects to LiveKit room using token and enables microphone
4. **Session View**: Once connected, `SessionView` manages the active session with agent

### Key Components Structure

**Root Application (`components/app.tsx`)**
- Manages Room instance and session lifecycle
- Handles connection/disconnection events
- Orchestrates welcome screen and session view transitions
- Implements pre-connect audio buffer when enabled

**Session View (`components/session-view.tsx`)**
- Main UI during active voice session
- Displays chat/transcription messages
- Renders media tiles (video, avatars)
- Contains agent control bar
- Monitors agent availability (20s timeout if agent doesn't join/initialize)

**Agent Control Bar (`components/livekit/agent-control-bar/`)**
- Audio/video device controls and selection
- Screen sharing toggle
- Chat input panel (expandable)
- Call disconnect button
- Audio visualizer for microphone activity

**LiveKit Components (`components/livekit/`)**
- `media-tiles.tsx`: Displays participant video/avatar tiles
- `agent-tile.tsx`: Special tile for agent with avatar support
- `video-tile.tsx`: User video tiles
- `avatar-tile.tsx`: Fallback avatar when no video
- `chat/`: Chat message rendering and input
- `device-select.tsx`: Audio/video device selector
- `track-toggle.tsx`: Media track enable/disable controls

### Hooks

**`useConnectionDetails`**: Fetches connection details from API, manages token expiration/refresh
**`useChatAndTranscription`**: Merges chat messages and transcriptions into unified timeline
**`useDebug`**: Debug logging (enabled in non-production)

### Configuration

All UI customization is centralized in `app-config.ts` (type: `AppConfig`):
- Branding: `companyName`, `logo`, `logoDark`
- Colors: `accent`, `accentDark`
- Feature flags: `supportsChatInput`, `supportsVideoInput`, `supportsScreenShare`, `isPreConnectBufferEnabled`
- Text labels: `pageTitle`, `pageDescription`, `startButtonText`
- Agent config: `agentName` (optional, specifies which agent to spawn)

### API Routes

**`/api/connection-details` (POST)**
- Generates random room name and participant identity
- Creates LiveKit access token with 15-minute TTL
- Accepts optional `room_config.agents[].agent_name` in request body
- Returns `ConnectionDetails`: `serverUrl`, `roomName`, `participantToken`, `participantName`

### Data Flow

1. Chat and transcription messages merge via `useChatAndTranscription`
2. Transcriptions come from LiveKit's agent voice output
3. Chat messages sent via `ChatInput` → `send()` → LiveKit data channel
4. Combined messages sorted by timestamp and displayed in `ChatMessageView`

## Tech Stack Notes

- **Next.js 15**: App Router with React Server Components
- **React 19**: Latest features
- **LiveKit Client SDK**: Real-time voice/video communication
- **Motion (Framer Motion)**: Animations for transitions
- **Tailwind CSS 4**: Styling with custom design system
- **shadcn/ui**: Base UI components (button, toggle, select, etc.)
- **pnpm 9.15.9**: Package manager
- **Path alias**: `@/*` maps to repository root

## Important Patterns

- **Inert attribute**: Used to disable interaction with hidden UI (welcome screen when session active, chat input when closed)
- **LiveKit RoomContext**: Provides room instance to all LiveKit components
- **Agent state monitoring**: Components check `agentState` to determine if agent is available (`listening`, `thinking`, `speaking`)
- **Pre-connect buffer**: When enabled (`isPreConnectBufferEnabled`), microphone starts capturing before room connection completes for instant agent interaction
