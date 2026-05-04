export interface ClarificationOption {
  optionId: string;
  label: string;
  entityId?: string;
  confidence?: number;
}

export type ClarificationQuestionType =
  | 'entity_match'
  | 'date_confirm'
  | 'venue_location'
  | 'artist_identity'
  | 'event_time';

export type ClarificationStatus = 'open' | 'resolved' | 'dismissed';

export interface ClarificationRequest {
  clarificationId: string;
  candidateId?: string;
  question: string;
  questionType: ClarificationQuestionType;
  options: ClarificationOption[];
  status: ClarificationStatus;
  resolvedBy?: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
}
