export interface ConferenceEntry {
  id: string;
  timestamp: number;
  firstName: string;
  lastName: string;
  conferenceName: string;
  learned: string;
}

export interface PitEntry {
  id: string;
  timestamp: number;
  firstName: string;
  lastName: string;
  teamNameAndNumber: string;
  photoUrls: string[];
  instagram: string;
  learned: string;
}
