export interface AgentConfig {
  id: string;
  name: string;
  avatar: string; // Emoji fallback
  imageUrl?: string; // URL for the full body/portrait image
  color: string; // Tailwind color class fragment, e.g., 'blue'
  persona: string;
  isJudge?: boolean;
}

export interface Attachment {
  type: 'image' | 'video';
  url: string;
  mimeType?: string;
  title?: string;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: number;
  round?: number;
  attachments?: Attachment[];
  groundingSources?: GroundingSource[];
}

export interface DebateSettings {
  topic: string;
  rounds: number;
}

export enum DebateStatus {
  IDLE = 'IDLE',
  PREPARING = 'PREPARING',
  DEBATING = 'DEBATING',
  JUDGING = 'JUDGING',
  FINISHED = 'FINISHED',
  ERROR = 'ERROR'
}

export type AgentRole = 'Gemini' | 'Qwen' | 'ChatGPT' | 'Grok' | 'Judge';