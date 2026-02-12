import { useParams } from "react-router-dom";
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { useTournamentDetail, useUpdateMatchScore, computeStandings } from "@/hooks/useTournaments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Trophy, Calendar, Table, GitBranch, Lock, Globe, Check, Loader2
} from "lucide-react";

const TournamentView = () => {
  const { id } = useParams<{ id: string }>();
  const { data: tournament, isLoading } = useTournamentDetail(id || "");
  const updateMatchScore = useUpdateMatchScore();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!tournament) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Torneo no encontrado</h1>
          <p className="text-muted-foreground">El torneo que buscas no existe o fue eliminado.</p>
        </div>
      </Layout>
    );
  }

  const standings = tournament.type === 'league' 
    ? computeStandings(tournament.teams, tournament.matches)
    : [];

  // Group matches by matchday
  const matchesByDay = tournament.matches.reduce((acc: Record<number, typeof tournament.matches>, match: any) => {
    const day = match.matchday;
    if (!acc[day]) acc[day] = [];
    acc[day].push(match);
    return acc;
  }, {} as Record<number, typeof tournament.matches>);

  // Get zone color for a position
  const getZoneForPosition = (position: number) => {
    return tournament.zones?.find(
      (z: any) => position >= z.start_position && position <= z.end_position
    );
  };

  return (
    <Layout>
      {/* Header */}
      <section className="gradient-navy py-10">
        <div className="container">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
              {tournament.logo ? (
                <img src={tournament.logo} alt={tournament.name} className="h-10 w-10 object-contain" />
              ) : (
                <Trophy className="h-8 w-8 text-accent" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground">
                  {tournament.name}
                </h1>
                {tournament.is_pro ? (
                  <Lock className="h-5 w-5 text-accent" />
                ) : (
                  <Globe className="h-5 w-5 text-primary-foreground/60" />
                )}
              </div>
              <div className="flex items-center gap-3 text-primary-foreground/70 text-sm">
                <span>{tournament.sport}</span>
                <span>•</span>
                <span>{tournament.type === 'league' ? 'Liga' : 'Eliminación'}</span>
                <span>•</span>
                <span>{tournament.teams.length} equipos</span>
              </div>
            </div>
            <Badge className={`${tournament.status === 'active' ? 'status-live' : 'status-finished'} px-3 py-1`}>
              {tournament.status === 'active' ? 'En Curso' : 'Finalizado'}
            </Badge>
          </div>
        </div>
      </section>

      {/* Tabs Content */}
      <section className="py-8">
        <div className="container">
          <Tabs defaultValue="fixture" className="w-full">
            <TabsList className="w-full justify-start mb-6 bg-secondary p-1 rounded-xl">
              <TabsTrigger value="fixture" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg">
                <Calendar className="h-4 w-4" /> Fixture
              </TabsTrigger>
              {tournament.type === 'league' && (
                <TabsTrigger value="standings" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg">
                  <Table className="h-4 w-4" /> Posiciones
                </TabsTrigger>
              )}
              {tournament.type === 'elimination' && (
                <TabsTrigger value="brackets" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg">
                  <GitBranch className="h-4 w-4" /> Llaves
                </TabsTrigger>
              )}
            </TabsList>

            {/* Fixture Tab */}
            <TabsContent value="fixture" className="space-y-6 animate-fade-in">
              {Object.entries(matchesByDay).map(([day, matches]) => (
                <div key={day}>
                  <h3 className="font-display font-bold text-lg mb-4">
                    {tournament.type === 'elimination' ? `Ronda ${day}` : `Fecha ${day}`}
                  </h3>
                  <div className="space-y-3">
                    {(matches as any[]).map((match: any) => (
                      <MatchCard 
                        key={match.id} 
                        match={match} 
                        teams={tournament.teams}
                        onUpdateScore={(homeScore, awayScore) => 
                          updateMatchScore.mutate({
                            matchId: match.id,
                            homeScore,
                            awayScore,
                            tournamentId: tournament.id,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Standings Tab */}
            <TabsContent value="standings" className="animate-fade-in">
              <div className="card-athletic overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold">#</th>
                        <th className="text-left py-3 px-4 font-semibold">Equipo</th>
                        <th className="text-center py-3 px-2 font-semibold">PJ</th>
                        <th className="text-center py-3 px-2 font-semibold">PG</th>
                        <th className="text-center py-3 px-2 font-semibold">PE</th>
                        <th className="text-center py-3 px-2 font-semibold">PP</th>
                        <th className="text-center py-3 px-2 font-semibold">GF</th>
                        <th className="text-center py-3 px-2 font-semibold">GC</th>
                        <th className="text-center py-3 px-2 font-semibold">Dif</th>
                        <th className="text-center py-3 px-4 font-semibold text-accent">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {standings.map((row, index) => {
                        const zone = getZoneForPosition(index + 1);
                        return (
                          <tr 
                            key={row.teamId} 
                            className="hover:bg-secondary/50 transition-colors"
                            style={zone ? { 
                              backgroundColor: `${zone.color}15`,
                              borderLeft: `4px solid ${zone.color}`,
                            } : undefined}
                          >
                            <td className="py-3 px-4 font-semibold">{index + 1}</td>
                            <td className="py-3 px-4 font-medium">
                              <div className="flex items-center gap-2">
                                {row.teamName}
                                {zone?.label && (
                                  <span 
                                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                    style={{ backgroundColor: `${zone.color}20`, color: zone.color }}
                                  >
                                    {zone.label}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="text-center py-3 px-2">{row.played}</td>
                            <td className="text-center py-3 px-2 text-status-finished">{row.won}</td>
                            <td className="text-center py-3 px-2">{row.drawn}</td>
                            <td className="text-center py-3 px-2 text-destructive">{row.lost}</td>
                            <td className="text-center py-3 px-2">{row.goalsFor}</td>
                            <td className="text-center py-3 px-2">{row.goalsAgainst}</td>
                            <td className="text-center py-3 px-2 font-medium">
                              {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                            </td>
                            <td className="text-center py-3 px-4 font-bold text-accent">{row.points}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Brackets Tab */}
            <TabsContent value="brackets" className="animate-fade-in">
              <div className="text-center py-12">
                <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-xl font-bold mb-2">Visualización de Brackets</h3>
                <p className="text-muted-foreground">
                  La vista gráfica de llaves estará disponible próximamente.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

// Match Card Component
interface MatchCardProps {
  match: any;
  teams: { id: string; name: string; logo?: string | null }[];
  onUpdateScore: (homeScore: number, awayScore: number) => void;
}

const MatchCard = ({ match, teams, onUpdateScore }: MatchCardProps) => {
  const [editing, setEditing] = useState(false);
  const [homeScore, setHomeScore] = useState(match.home_score?.toString() || "");
  const [awayScore, setAwayScore] = useState(match.away_score?.toString() || "");

  const homeTeam = teams.find((t) => t.id === match.home_team_id);
  const awayTeam = teams.find((t) => t.id === match.away_team_id);

  const handleSave = () => {
    const home = parseInt(homeScore) || 0;
    const away = parseInt(awayScore) || 0;
    onUpdateScore(home, away);
    setEditing(false);
  };

  // Skip matches without both teams
  if (!homeTeam || !awayTeam) {
    return (
      <div className="card-athletic p-4 opacity-60">
        <div className="flex items-center justify-center gap-4">
          <span className="font-medium">{homeTeam?.name || awayTeam?.name || 'Por definir'}</span>
          <Badge variant="outline" className="text-xs">Fecha Libre</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="card-athletic p-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 text-right">
          <span className="font-medium">{homeTeam.name}</span>
        </div>

        <div className="flex items-center gap-2 min-w-[120px] justify-center">
          {editing ? (
            <>
              <Input type="number" min="0" value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-12 h-10 text-center font-bold" />
              <span className="text-muted-foreground">-</span>
              <Input type="number" min="0" value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-12 h-10 text-center font-bold" />
              <Button size="icon" variant="action" onClick={handleSave} className="h-10 w-10">
                <Check className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
              {match.status === 'finished' ? (
                <span className="font-bold text-lg">{match.home_score} - {match.away_score}</span>
              ) : (
                <span className="text-muted-foreground text-sm">Cargar resultado</span>
              )}
            </button>
          )}
        </div>

        <div className="flex-1 text-left">
          <span className="font-medium">{awayTeam.name}</span>
        </div>

        <Badge className={`text-xs ${
          match.status === 'finished' ? 'status-finished' : 
          match.status === 'live' ? 'status-live' : 'status-scheduled'
        }`}>
          {match.status === 'finished' ? 'Final' : 
           match.status === 'live' ? 'En Vivo' : 'Prog.'}
        </Badge>
      </div>
    </div>
  );
};

export default TournamentView;
