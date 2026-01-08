
export enum Category {
  INBOX = 'Inbox',
  SENT = 'Sent',
  STARRED = 'Starred',
  SPAM = 'Spam',
  BLOCKED = 'Blocked',
  PROMOTIONS = 'Promotions',
  MAINTENANCE = 'Maintenance',
  TRASH = 'Trash'
}

export type Provider = 'gmail' | 'outlook' | 'icloud' | 'custom';
export type Season = 'winter' | 'spring' | 'summer' | 'autumn' | 'halloween' | 'christmas' | 'newyear';
export type SignatureStyle = 'Minimalist' | 'Corporate' | 'Creative';
export type ToneType = 'Executive' | 'Friendly' | 'Concise' | 'Urgent' | 'Persuasive';

export interface ThemeConfig {
  id: Season;
  name: string;
  primary: string;
  primaryHex: string;
  secondary: string;
  bgGradient: string;
  accent: string;
  accentHex: string;
  icon: string;
  isDark: boolean;
  surfaceHex: string;
  borderHex: string;
  textPrimaryHex: string;
  textSecondaryHex: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface Account {
  id: string;
  email: string;
  name: string;
  provider: Provider;
  color: string;
  initials: string;
  signature?: string;
}

export interface Email {
  id: string;
  accountId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  category: Category;
  userCategoryId?: string;
  summary?: string;
  sentiment?: string;
  tasks?: string[];
  isSpam?: boolean;
  suspiciousReason?: string;
  isMailingList?: boolean;
  locationMentioned?: string;
  isPotentialMistake?: boolean;
  rescueReason?: string;
  detectedLanguage?: string;
  isPriority?: boolean;
  visualUrl?: string;
}

export interface AIClassification {
  category: Category;
  userCategoryId?: string;
  summary: string;
  sentiment: string;
  isSpam: boolean;
  suspiciousReason?: string;
  isMailingList: boolean;
  confidence: number;
  isPotentialMistake?: boolean;
  rescueReason?: string;
  detectedLanguage?: string;
  isPriority?: boolean;
}

export interface MaintenanceAction {
  id: string;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  actionLabel: string;
  emailIds: string[];
}

export interface Watcher {
  id: string;
  query: string;
  target?: string;
  timestamp: number;
}
