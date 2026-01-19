export type TournamentType = 'league' | 'elimination';
export type TournamentMode = 'community' | 'pro';
export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface Team {
  id: string;
  name: string;
  logo?: string;
  tournamentId: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string | null; // null for bye matches
  homeScore: number | null;
  awayScore: number | null;
  matchday: number;
  status: MatchStatus;
  bracketRound?: number;
  bracketPosition?: number;
  scheduledAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface Tournament {
  id: string;
  name: string;
  sport: string;
  logo?: string;
  type: TournamentType;
  mode: TournamentMode;
  isPro: boolean;
  ownerId?: string;
  status: 'draft' | 'active' | 'finished';
  createdAt: string;
  teams: Team[];
  matches: Match[];
}

export interface StandingsRow {
  teamId: string;
  teamName: string;
  teamLogo?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface TournamentFormData {
  name: string;
  sport: string;
  logo?: string;
  type: TournamentType;
  mode: TournamentMode;
  teams: { name: string; logo?: string }[];
}
