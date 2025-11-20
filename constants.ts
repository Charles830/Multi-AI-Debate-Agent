import { AgentConfig } from './types';

// Note: We are now using jsDelivr CDN for the Fluent Emojis to ensure they load reliably in all regions.
// These characters are chosen to match the "Suit/Professional" look of the requested images.

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'qwen',
    name: 'Qwen',
    avatar: '🟣',
    // Updated to use lh3.googleusercontent.com for better direct embedding reliability
    imageUrl: 'https://lh3.googleusercontent.com/d/18WsiVigxG43J9N5NKmfYTVpPi33zkvYT', 
    color: 'purple',
    persona: '你善于分析，关注东方哲学和全球经济趋势。你优先考虑社会和谐与务实的解决方案，引经据典。',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    avatar: '🟢',
    // Updated to use lh3.googleusercontent.com for better direct embedding reliability
    imageUrl: 'https://lh3.googleusercontent.com/d/1aXREicarQee8Dt7ZNnqJ-NgIYCkA1COP',
    color: 'teal',
    persona: '你外交手腕圆滑，富有同理心，面面俱到。你试图从各个角度看问题，但倾向于以人为本和道德考量，语气温和。',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    avatar: '🔵',
    // Updated to use lh3.googleusercontent.com for better direct embedding reliability
    imageUrl: 'https://lh3.googleusercontent.com/d/1BCrGD4kAXwfceoKWpFwZ-EiznFWBhtIG',
    color: 'blue',
    persona: '你逻辑严密，以数据为驱动，立足于科学。你关注事实、技术影响和未来的可能性，说话风格客观冷静。',
  },
  {
    id: 'grok',
    name: 'Grok',
    avatar: '⚫',
    // Updated to use lh3.googleusercontent.com for better direct embedding reliability
    imageUrl: 'https://lh3.googleusercontent.com/d/138xUNc_ar0wMa3pcwdW3AriYTy7RMo_o',
    color: 'slate',
    persona: '你风趣、叛逆，有时甚至具有挑衅性。你崇尚绝对的言论自由，用讽刺和犀利的逻辑挑战既定叙事，喜欢用幽默的语气。',
  },
];

export const JUDGE_AGENT: AgentConfig = {
  id: 'judge',
  name: '裁决者',
  avatar: '⚖️',
  color: 'amber',
  persona: '你是一位公正的最高法官。你根据逻辑、修辞、事实准确性和人设的一致性来评估论点。你必须果断地判定胜者。',
  isJudge: true,
};

export const DEFAULT_TOPIC = "AI的发展是否应该暂停以确保安全？";
export const DEFAULT_ROUNDS = 2;