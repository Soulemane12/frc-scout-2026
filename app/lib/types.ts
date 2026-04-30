export interface ConferenceEntry {
  id: string;
  timestamp: number;
  firstName: string;
  lastName: string;
  division: string;
  teamNumber: string;
  teamName: string;
  conferenceName: string;
  learned: string;
}

export interface PitEntry {
  id: string;
  timestamp: number;
  firstName: string;
  lastName: string;
  division: string;
  teamNumber: string;
  teamName: string;
  photoUrls: string[];
  instagram: string;
  learned: string;
}
