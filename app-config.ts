import type { AppConfig } from './lib/types';

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'Watson',
  pageTitle: 'Watson Voice Assistant',
  pageDescription: 'Your AI-powered voice assistant',

  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: true,
  isPreConnectBufferEnabled: true,

  logo: '/watson-logo.svg',
  accent: '#0f62fe',
  logoDark: '/watson-logo-dark.svg',
  accentDark: '#4589ff',
  startButtonText: 'Start conversation',

  agentName: undefined,
};
