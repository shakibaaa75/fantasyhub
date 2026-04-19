export interface Tag {
  name: string;
  icon: string;
  category: 'creative' | 'tech' | 'life' | 'fun';
}

export type View = 'welcome' | 'tags' | 'searching' | 'match' | 'chat';

export interface ChatMsg {
  id: string;
  text: string;
  sender: 'you' | 'stranger';
  time: string;
}

export type ReportReason = 'harassment' | 'inappropriate' | 'spam' | 'other';