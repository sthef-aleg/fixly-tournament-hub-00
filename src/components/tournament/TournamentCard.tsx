import { Trophy, Users, Calendar, Lock, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface TournamentCardProps {
  tournament: {
    id: string;
    name: string;
    sport: string;
    logo?: string | null;
    type: string;
    is_pro: boolean;
    status: string;
  };
}

const TournamentCard = ({ tournament }: TournamentCardProps) => {
  const statusStyles: Record<string, string> = {
    draft: "status-scheduled",
    active: "status-live",
    finished: "status-finished",
  };

  const statusLabels: Record<string, string> = {
    draft: "Borrador",
    active: "En Curso",
    finished: "Finalizado",
  };

  return (
    <Link to={`/tournament/${tournament.id}`}>
      <div className="card-athletic p-5 cursor-pointer group">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 h-14 w-14 rounded-xl gradient-navy flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            {tournament.logo ? (
              <img src={tournament.logo} alt={tournament.name} className="h-10 w-10 object-contain" />
            ) : (
              <Trophy className="h-7 w-7 text-accent" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-bold text-lg text-foreground truncate">
                {tournament.name}
              </h3>
              {tournament.is_pro ? (
                <Lock className="h-4 w-4 text-accent flex-shrink-0" />
              ) : (
                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {tournament.sport} • {tournament.type === 'league' ? 'Liga' : 'Eliminación'}
            </p>
          </div>

          <Badge className={`${statusStyles[tournament.status] || 'status-scheduled'} text-xs font-semibold px-2.5 py-1`}>
            {statusLabels[tournament.status] || tournament.status}
          </Badge>
        </div>
      </div>
    </Link>
  );
};

export default TournamentCard;
