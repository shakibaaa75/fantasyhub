export interface Tag {
  name: string;
  icon: string;
  category: 'creative' | 'tech' | 'life' | 'fun' | 'video';
}

export type View = 'welcome' | 'tags' | 'searching' | 'match' | 'chat' | 'video';

// Auth views are handled as modals, not page navigation
export type AuthView = 'login' | 'register' | null;

export interface ChatMsg {
  id: string;
  text: string;
  sender: 'you' | 'stranger';
  time: string;
}

export type ReportReason = 'harassment' | 'inappropriate' | 'spam' | 'other';

// Video call types
export type VideoQuality = 'hd' | 'sd' | 'low';

export interface MatchData {
  match_id: string;
  shared_tags: string[];
  similarity: number;
  stranger_id: string;
  mode: 'chat' | 'video';
  initiator: boolean;
  video_quality?: VideoQuality;
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice_candidate';
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
}