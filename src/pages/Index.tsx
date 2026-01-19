import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import TournamentCard from "@/components/tournament/TournamentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTournamentStore } from "@/store/tournamentStore";
import { Search, Plus, Trophy, Zap } from "lucide-react";

const Index = () => {
  const { tournaments } = useTournamentStore();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTournaments = tournaments.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.sport.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      {/* Hero Section */}
      <section className="gradient-navy py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent mb-6 animate-fade-in">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-semibold">Gestión de torneos simplificada</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-fade-in">
              Organiza tus torneos
              <span className="text-gradient block mt-2">como un profesional</span>
            </h1>
            
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto animate-fade-in">
              Crea fixtures automáticos, gestiona resultados en tiempo real y comparte 
              con tu comunidad. Todo desde una sola plataforma.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Link to="/create">
                <Button variant="action" size="xl" className="gap-2 w-full sm:w-auto">
                  <Plus className="h-5 w-5" />
                  Crear Torneo
                </Button>
              </Link>
              <Button variant="outline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 w-full sm:w-auto">
                Ver Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tournaments Section */}
      <section className="py-12 md:py-16">
        <div className="container">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Mis Torneos
              </h2>
              <p className="text-muted-foreground mt-1">
                {tournaments.length} {tournaments.length === 1 ? 'torneo' : 'torneos'} creados
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar torneos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Link to="/create" className="hidden md:block">
                <Button variant="action" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo
                </Button>
              </Link>
            </div>
          </div>

          {/* Tournament Grid */}
          {filteredTournaments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl gradient-navy mb-6">
                <Trophy className="h-10 w-10 text-accent" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                No tienes torneos aún
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Crea tu primer torneo y comienza a gestionar fixtures, 
                resultados y posiciones de forma automática.
              </p>
              <Link to="/create">
                <Button variant="action" size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Crear mi primer torneo
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No se encontraron torneos con "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      {tournaments.length === 0 && (
        <section className="py-12 md:py-16 bg-secondary/50">
          <div className="container">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="card-athletic p-6 text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl gradient-navy mb-4">
                  <Zap className="h-7 w-7 text-accent" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">Fixtures Automáticos</h3>
                <p className="text-muted-foreground text-sm">
                  Genera enfrentamientos automáticamente con algoritmos optimizados.
                </p>
              </div>

              <div className="card-athletic p-6 text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl gradient-navy mb-4">
                  <Trophy className="h-7 w-7 text-accent" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">Liga o Eliminación</h3>
                <p className="text-muted-foreground text-sm">
                  Elige entre Round Robin o Brackets según tu formato preferido.
                </p>
              </div>

              <div className="card-athletic p-6 text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl gradient-navy mb-4">
                  <Search className="h-7 w-7 text-accent" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">Modo Comunidad</h3>
                <p className="text-muted-foreground text-sm">
                  Permite que todos actualicen resultados o controla todo como admin.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default Index;
