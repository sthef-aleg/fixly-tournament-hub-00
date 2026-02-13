import Layout from "@/components/layout/Layout";
import CreateWizard from "@/components/tournament/CreateWizard";

const CreateTournament = () => {
  return (
    <Layout>
      <div className="container py-12 md:py-16">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Crear Nuevo Torneo
          </h1>
          <p className="text-accent font-display font-semibold text-sm mb-1">Mundo Exa</p>
          <p className="text-muted-foreground max-w-md mx-auto">
            Configurá tu torneo en 3 simples pasos y generá el fixture automáticamente.
          </p>
        </div>

        <CreateWizard />
      </div>
    </Layout>
  );
};

export default CreateTournament;
