import { Trophy, Users, Calendar, Lock, Globe } from "lucide-react";
import { Tournament } from "@/types/tournament";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface TournamentCardProps {
  tournament: Tournament;
}

const TournamentCard = ({ tournament }: TournamentCardProps) => {
  const statusStyles = {
    draft: "status-scheduled",
    active: "status-live",
    finished: "status-finished",
  };

  const statusLabels = {
    draft: "Borrador",
    active: "En Curso",
    finished: "Finalizado",
  };

  return (
    <Link to={`/tournament/${tournament.id}`}>
      <div className="card-athletic p-5 cursor-pointer group">
        <div className="flex items-start gap-4">
          {/* Tournament Logo */}
          <div className="flex-shrink-0 h-14 w-14 rounded-xl gradient-navy flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            {tournament.logo ? (
              <img
                src={tournament.logo}
                alt={tournament.name}
                className="h-10 w-10 object-contain"
              />
            ) : (
              <Trophy className="h-7 w-7 text-accent" />
            )}
          </div>

          {/* Tournament Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-bold text-lg text-foreground truncate">
                {tournament.name}
              </h3>
              {tournament.isPro ? (
                <Lock className="h-4 w-4 text-accent flex-shrink-0" />
              ) : (
                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {tournament.sport} • {tournament.type === 'league' ? 'Liga' : 'Eliminación'}
            </p>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{tournament.teams.length} equipos</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{tournament.matches.length} partidos</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <Badge className={`${statusStyles[tournament.status]} text-xs font-semibold px-2.5 py-1`}>
            {statusLabels[tournament.status]}
          </Badge>
        </div>
      </div>
    </Link>
  );
};

export default TournamentCard;
