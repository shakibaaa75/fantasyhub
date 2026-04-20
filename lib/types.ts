export interface Tag {
  name: string;
  icon: string;
  category: 'creative' | 'tech' | 'life' | 'fun';
}

export type View = 'welcome' | 'tags' | 'searching' | 'match' | 'chat';

// Auth views are handled as modals, not page navigation
export type AuthView = 'login' | 'register' | null;

export interface ChatMsg {
  id: string;
  text: string;
  sender: 'you' | 'stranger';
  time: string;
}

export type ReportReason = 'harassment' | 'inappropriate' | 'spam' | 'other';