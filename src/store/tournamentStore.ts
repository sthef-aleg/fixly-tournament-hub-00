import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Tournament, Team, Match, TournamentFormData, StandingsRow } from '@/types/tournament';

interface TournamentStore {
  tournaments: Tournament[];
  addTournament: (data: TournamentFormData) => Tournament;
  getTournament: (id: string) => Tournament | undefined;
  updateMatchScore: (tournamentId: string, matchId: string, homeScore: number, awayScore: number) => void;
  getStandings: (tournamentId: string) => StandingsRow[];
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 11);

// Round Robin fixture generator (rotation algorithm)
const generateLeagueFixtures = (teams: Team[], tournamentId: string): Match[] => {
  const matches: Match[] = [];
  const teamList = [...teams];
  
  // Add BYE team if odd number
  if (teamList.length % 2 !== 0) {
    teamList.push({ id: 'bye', name: 'BYE', tournamentId } as Team);
  }

  const numTeams = teamList.length;
  const numRounds = numTeams - 1;
  const half = numTeams / 2;

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < half; i++) {
      const home = teamList[i];
      const away = teamList[numTeams - 1 - i];
      
      // Skip BYE matches
      if (home.id !== 'bye' && away.id !== 'bye') {
        matches.push({
          id: generateId(),
          tournamentId,
          homeTeamId: home.id,
          awayTeamId: away.id,
          homeScore: null,
          awayScore: null,
          matchday: round + 1,
          status: 'scheduled',
        });
      }
    }

    // Rotate teams (keep first team fixed)
    const last = teamList.pop()!;
    teamList.splice(1, 0, last);
  }

  return matches;
};

// Elimination bracket generator
const generateEliminationFixtures = (teams: Team[], tournamentId: string): Match[] => {
  const matches: Match[] = [];
  let currentRoundTeams = [...teams];
  
  // Shuffle teams for random seeding
  currentRoundTeams.sort(() => Math.random() - 0.5);
  
  // Calculate nearest power of 2
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(currentRoundTeams.length)));
  const byes = nextPowerOf2 - currentRoundTeams.length;
  
  // Add BYE slots
  for (let i = 0; i < byes; i++) {
    currentRoundTeams.push({ id: 'bye', name: 'BYE', tournamentId } as Team);
  }

  let round = 1;
  let position = 0;

  while (currentRoundTeams.length > 1) {
    const roundMatches: Match[] = [];
    
    for (let i = 0; i < currentRoundTeams.length; i += 2) {
      const home = currentRoundTeams[i];
      const away = currentRoundTeams[i + 1];
      
      roundMatches.push({
        id: generateId(),
        tournamentId,
        homeTeamId: home.id,
        awayTeamId: away?.id || null,
        homeScore: null,
        awayScore: null,
        matchday: round,
        bracketRound: round,
        bracketPosition: position++,
        status: 'scheduled',
      });
    }
    
    matches.push(...roundMatches);
    currentRoundTeams = roundMatches.map(() => ({ id: 'tbd', name: 'Por definir', tournamentId } as Team));
    round++;
    position = 0;
  }

  return matches;
};

export const useTournamentStore = create<TournamentStore>()(
  persist(
    (set, get) => ({
      tournaments: [],

      addTournament: (data: TournamentFormData) => {
        const tournamentId = generateId();
        
        const teams: Team[] = data.teams.map((team) => ({
          id: generateId(),
          name: team.name,
          logo: team.logo,
          tournamentId,
        }));

        const matches = data.type === 'league'
          ? generateLeagueFixtures(teams, tournamentId)
          : generateEliminationFixtures(teams, tournamentId);

        const tournament: Tournament = {
          id: tournamentId,
          name: data.name,
          sport: data.sport,
          logo: data.logo,
          type: data.type,
          mode: data.mode,
          isPro: data.mode === 'pro',
          status: 'active',
          createdAt: new Date().toISOString(),
          teams,
          matches,
        };

        set((state) => ({
          tournaments: [...state.tournaments, tournament],
        }));

        return tournament;
      },

      getTournament: (id: string) => {
        return get().tournaments.find((t) => t.id === id);
      },

      updateMatchScore: (tournamentId: string, matchId: string, homeScore: number, awayScore: number) => {
        set((state) => ({
          tournaments: state.tournaments.map((tournament) => {
            if (tournament.id !== tournamentId) return tournament;
            
            return {
              ...tournament,
              matches: tournament.matches.map((match) => {
                if (match.id !== matchId) return match;
                
                return {
                  ...match,
                  homeScore,
                  awayScore,
                  status: 'finished' as const,
                  updatedAt: new Date().toISOString(),
                };
              }),
            };
          }),
        }));
      },

      getStandings: (tournamentId: string) => {
        const tournament = get().getTournament(tournamentId);
        if (!tournament) return [];

        const standings: Map<string, StandingsRow> = new Map();

        // Initialize standings for all teams
        tournament.teams.forEach((team) => {
          standings.set(team.id, {
            teamId: team.id,
            teamName: team.name,
            teamLogo: team.logo,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
          });
        });

        // Calculate from finished matches
        tournament.matches.forEach((match) => {
          if (match.status !== 'finished' || match.homeScore === null || match.awayScore === null) {
            return;
          }

          const homeRow = standings.get(match.homeTeamId);
          const awayRow = match.awayTeamId ? standings.get(match.awayTeamId) : null;

          if (homeRow) {
            homeRow.played++;
            homeRow.goalsFor += match.homeScore;
            homeRow.goalsAgainst += match.awayScore;
            
            if (match.homeScore > match.awayScore) {
              homeRow.won++;
              homeRow.points += 3;
            } else if (match.homeScore === match.awayScore) {
              homeRow.drawn++;
              homeRow.points += 1;
            } else {
              homeRow.lost++;
            }
          }

          if (awayRow) {
            awayRow.played++;
            awayRow.goalsFor += match.awayScore;
            awayRow.goalsAgainst += match.homeScore;
            
            if (match.awayScore > match.homeScore) {
              awayRow.won++;
              awayRow.points += 3;
            } else if (match.awayScore === match.homeScore) {
              awayRow.drawn++;
              awayRow.points += 1;
            } else {
              awayRow.lost++;
            }
          }
        });

        // Calculate goal difference and sort
        const result = Array.from(standings.values())
          .map((row) => ({
            ...row,
            goalDifference: row.goalsFor - row.goalsAgainst,
          }))
          .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
          });

        return result;
      },
    }),
    {
      name: 'fixly-tournaments',
    }
  )
);
