import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TournamentFormData, Tournament, Team, Match, StandingsRow } from "@/types/tournament";

// Generate unique ID (for fixture logic only)
const generateId = () => crypto.randomUUID();

// Round Robin fixture generator
const generateLeagueFixtures = (teams: { id: string; name: string }[], tournamentId: string) => {
  const matches: Omit<Match, 'id'>[] = [];
  const teamList = [...teams];

  if (teamList.length % 2 !== 0) {
    teamList.push({ id: 'bye', name: 'BYE' });
  }

  const numTeams = teamList.length;
  const numRounds = numTeams - 1;
  const half = numTeams / 2;

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < half; i++) {
      const home = teamList[i];
      const away = teamList[numTeams - 1 - i];

      if (home.id !== 'bye' && away.id !== 'bye') {
        matches.push({
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
    const last = teamList.pop()!;
    teamList.splice(1, 0, last);
  }

  return matches;
};

// Elimination bracket generator
const generateEliminationFixtures = (teams: { id: string; name: string }[], tournamentId: string) => {
  const matches: Omit<Match, 'id'>[] = [];
  let currentRoundTeams = [...teams];
  currentRoundTeams.sort(() => Math.random() - 0.5);

  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(currentRoundTeams.length)));
  const byes = nextPowerOf2 - currentRoundTeams.length;

  for (let i = 0; i < byes; i++) {
    currentRoundTeams.push({ id: 'bye', name: 'BYE' });
  }

  let round = 1;
  let position = 0;

  while (currentRoundTeams.length > 1) {
    const roundMatches: Omit<Match, 'id'>[] = [];

    for (let i = 0; i < currentRoundTeams.length; i += 2) {
      const home = currentRoundTeams[i];
      const away = currentRoundTeams[i + 1];

      roundMatches.push({
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
    currentRoundTeams = roundMatches.map(() => ({ id: 'tbd', name: 'Por definir' }));
    round++;
    position = 0;
  }

  return matches;
};

// ---- HOOKS ----

export const useTournaments = () => {
  return useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useTournamentDetail = (id: string) => {
  return useQuery({
    queryKey: ["tournament", id],
    queryFn: async () => {
      const [tournamentRes, teamsRes, matchesRes, zonesRes] = await Promise.all([
        supabase.from("tournaments").select("*").eq("id", id).single(),
        supabase.from("teams").select("*").eq("tournament_id", id),
        supabase.from("matches").select("*").eq("tournament_id", id).order("matchday"),
        supabase.from("tournament_zones").select("*").eq("tournament_id", id).order("start_position"),
      ]);

      if (tournamentRes.error) throw tournamentRes.error;

      return {
        ...tournamentRes.data,
        teams: teamsRes.data || [],
        matches: matchesRes.data || [],
        zones: zonesRes.data || [],
      };
    },
    enabled: !!id,
  });
};

export const useCreateTournament = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: TournamentFormData) => {
      if (!user) throw new Error("Debes iniciar sesión para crear un torneo");

      // 1. Create tournament
      const { data: tournament, error: tError } = await supabase
        .from("tournaments")
        .insert({
          name: data.name,
          sport: data.sport,
          logo: data.logo || null,
          type: data.type,
          mode: data.mode,
          is_pro: data.mode === "pro",
          owner_id: user.id,
          status: "active",
        })
        .select()
        .single();

      if (tError) throw tError;

      // 2. Create teams
      const teamsToInsert = data.teams
        .filter((t) => t.name.trim())
        .map((t) => ({
          tournament_id: tournament.id,
          name: t.name,
          logo: t.logo || null,
        }));

      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .insert(teamsToInsert)
        .select();

      if (teamsError) throw teamsError;

      // 3. Generate and create matches
      const teamRefs = teams!.map((t) => ({ id: t.id, name: t.name }));
      const fixtureMatches =
        data.type === "league"
          ? generateLeagueFixtures(teamRefs, tournament.id)
          : generateEliminationFixtures(teamRefs, tournament.id);

      const matchesToInsert = fixtureMatches.map((m) => ({
        tournament_id: m.tournamentId,
        home_team_id: m.homeTeamId === 'bye' || m.homeTeamId === 'tbd' ? null : m.homeTeamId,
        away_team_id: m.awayTeamId === 'bye' || m.awayTeamId === 'tbd' ? null : m.awayTeamId,
        home_score: m.homeScore,
        away_score: m.awayScore,
        matchday: m.matchday,
        status: m.status,
        bracket_round: m.bracketRound || null,
        bracket_position: m.bracketPosition ?? null,
      }));

      if (matchesToInsert.length > 0) {
        const { error: matchError } = await supabase
          .from("matches")
          .insert(matchesToInsert);
        if (matchError) throw matchError;
      }

      return tournament;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
};

export const useUpdateMatchScore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      homeScore,
      awayScore,
      tournamentId,
    }: {
      matchId: string;
      homeScore: number;
      awayScore: number;
      tournamentId: string;
    }) => {
      const { error } = await supabase
        .from("matches")
        .update({
          home_score: homeScore,
          away_score: awayScore,
          status: "finished",
          updated_at: new Date().toISOString(),
        })
        .eq("id", matchId);

      if (error) throw error;
      return { tournamentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", data.tournamentId] });
    },
  });
};

export const useSaveZones = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tournamentId,
      zones,
    }: {
      tournamentId: string;
      zones: { start_position: number; end_position: number; color: string; label: string }[];
    }) => {
      // Delete existing zones
      const { error: delError } = await supabase
        .from("tournament_zones")
        .delete()
        .eq("tournament_id", tournamentId);
      if (delError) throw delError;

      // Insert new zones
      if (zones.length > 0) {
        const { error: insError } = await supabase
          .from("tournament_zones")
          .insert(zones.map((z) => ({ ...z, tournament_id: tournamentId })));
        if (insError) throw insError;
      }

      return { tournamentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", data.tournamentId] });
    },
  });
};

// Compute standings from tournament data (client-side)
export const computeStandings = (
  teams: { id: string; name: string; logo?: string | null }[],
  matches: { status: string; home_team_id: string | null; away_team_id: string | null; home_score: number | null; away_score: number | null }[]
): StandingsRow[] => {
  const standings = new Map<string, StandingsRow>();

  teams.forEach((team) => {
    standings.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      teamLogo: team.logo || undefined,
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

  matches.forEach((match) => {
    if (match.status !== "finished" || match.home_score === null || match.away_score === null) return;

    const homeRow = match.home_team_id ? standings.get(match.home_team_id) : null;
    const awayRow = match.away_team_id ? standings.get(match.away_team_id) : null;

    if (homeRow) {
      homeRow.played++;
      homeRow.goalsFor += match.home_score;
      homeRow.goalsAgainst += match.away_score;
      if (match.home_score > match.away_score) { homeRow.won++; homeRow.points += 3; }
      else if (match.home_score === match.away_score) { homeRow.drawn++; homeRow.points += 1; }
      else { homeRow.lost++; }
    }

    if (awayRow) {
      awayRow.played++;
      awayRow.goalsFor += match.away_score;
      awayRow.goalsAgainst += match.home_score;
      if (match.away_score > match.home_score) { awayRow.won++; awayRow.points += 3; }
      else if (match.away_score === match.home_score) { awayRow.drawn++; awayRow.points += 1; }
      else { awayRow.lost++; }
    }
  });

  return Array.from(standings.values())
    .map((row) => ({ ...row, goalDifference: row.goalsFor - row.goalsAgainst }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
};
