import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TournamentFormData, TournamentType, TournamentMode } from "@/types/tournament";
import { 
  Trophy, ArrowRight, ArrowLeft, Check, Layers, GitBranch, Globe, Lock, Plus, Trash2, Users, Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCreateTournament } from "@/hooks/useTournaments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { id: 1, title: "Datos Básicos", icon: Trophy },
  { id: 2, title: "Tipo de Torneo", icon: Layers },
  { id: 3, title: "Equipos", icon: Users },
];

const CreateWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createTournament = useCreateTournament();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TournamentFormData>({
    name: "",
    sport: "",
    type: "league",
    mode: "community",
    teams: [{ name: "" }, { name: "" }],
  });

  const updateFormData = (updates: Partial<TournamentFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const addTeam = () => {
    setFormData((prev) => ({ ...prev, teams: [...prev.teams, { name: "" }] }));
  };

  const removeTeam = (index: number) => {
    if (formData.teams.length > 2) {
      setFormData((prev) => ({ ...prev, teams: prev.teams.filter((_, i) => i !== index) }));
    }
  };

  const updateTeam = (index: number, name: string) => {
    setFormData((prev) => ({
      ...prev,
      teams: prev.teams.map((team, i) => (i === index ? { ...team, name } : team)),
    }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return formData.name.trim() !== "" && formData.sport.trim() !== "";
      case 2: return true;
      case 3: return formData.teams.filter((t) => t.name.trim() !== "").length >= 2;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Error", description: "Debes iniciar sesión para crear un torneo.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    try {
      const validTeams = formData.teams.filter((t) => t.name.trim() !== "");
      const tournament = await createTournament.mutateAsync({ ...formData, teams: validTeams });
      navigate(`/tournament/${tournament.id}`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-10">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
              currentStep >= step.id ? "gradient-navy shadow-md" : "bg-secondary"
            }`}>
              {currentStep > step.id ? (
                <Check className="h-5 w-5 text-accent" />
              ) : (
                <step.icon className={`h-5 w-5 ${currentStep >= step.id ? "text-accent" : "text-muted-foreground"}`} />
              )}
            </div>
            {index < STEPS.length - 1 && (
              <div className={`w-16 md:w-24 h-1 mx-2 rounded-full transition-colors duration-300 ${
                currentStep > step.id ? "bg-accent" : "bg-secondary"
              }`} />
            )}
          </div>
        ))}
      </div>

      <h2 className="font-display text-2xl font-bold text-center mb-8 animate-fade-in">
        {STEPS[currentStep - 1].title}
      </h2>

      <div className="card-athletic p-8 animate-fade-in">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium">Nombre del Torneo</Label>
              <Input id="name" placeholder="Ej: Copa Primavera 2024" value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })} className="h-12 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sport" className="text-base font-medium">Deporte</Label>
              <Input id="sport" placeholder="Ej: Fútbol, Básquet, Voleibol..." value={formData.sport}
                onChange={(e) => updateFormData({ sport: e.target.value })} className="h-12 text-base" />
            </div>
            <div className="space-y-3">
              <Label className="text-base font-medium">Modo de Torneo</Label>
              <RadioGroup value={formData.mode}
                onValueChange={(value: TournamentMode) => updateFormData({ mode: value })}
                className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Label htmlFor="community" className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.mode === "community" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
                  <RadioGroupItem value="community" id="community" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="h-4 w-4 text-accent" />
                      <span className="font-semibold">Torneo Abierto</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Cualquiera puede editar resultados.</p>
                  </div>
                </Label>
                <Label htmlFor="pro" className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.mode === "pro" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
                  <RadioGroupItem value="pro" id="pro" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="h-4 w-4 text-accent" />
                      <span className="font-semibold">Torneo Privado</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Solo tú puedes editar.</p>
                  </div>
                </Label>
              </RadioGroup>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <Label className="text-base font-medium">Formato del Torneo</Label>
            <RadioGroup value={formData.type}
              onValueChange={(value: TournamentType) => updateFormData({ type: value })}
              className="space-y-4">
              <Label htmlFor="league" className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                formData.type === "league" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
                <RadioGroupItem value="league" id="league" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-lg gradient-navy flex items-center justify-center">
                      <Layers className="h-5 w-5 text-accent" />
                    </div>
                    <span className="font-display font-bold text-lg">Liga / Round Robin</span>
                  </div>
                  <p className="text-muted-foreground">Todos contra todos. Sistema de puntos con tabla de posiciones.</p>
                </div>
              </Label>
              <Label htmlFor="elimination" className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                formData.type === "elimination" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
                <RadioGroupItem value="elimination" id="elimination" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-lg gradient-navy flex items-center justify-center">
                      <GitBranch className="h-5 w-5 text-accent" />
                    </div>
                    <span className="font-display font-bold text-lg">Eliminación Directa</span>
                  </div>
                  <p className="text-muted-foreground">Formato mata-mata. Llaves (brackets) hasta la final.</p>
                </div>
              </Label>
            </RadioGroup>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">
                Equipos ({formData.teams.filter((t) => t.name.trim()).length})
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addTeam} className="gap-1.5">
                <Plus className="h-4 w-4" /> Agregar
              </Button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {formData.teams.map((team, index) => (
                <div key={index} className="flex items-center gap-3 animate-fade-in">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-secondary text-muted-foreground font-semibold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <Input placeholder={`Equipo ${index + 1}`} value={team.name}
                    onChange={(e) => updateTeam(index, e.target.value)} className="flex-1" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeTeam(index)}
                    disabled={formData.teams.length <= 2}
                    className="text-muted-foreground hover:text-destructive flex-shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {formData.teams.length % 2 !== 0 && (
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm text-accent font-medium">
                  ⚡ Número impar de equipos: Se asignará una "Fecha Libre" automáticamente.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}
          disabled={currentStep === 1} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button variant="action" onClick={handleNext}
          disabled={!isStepValid() || createTournament.isPending} className="gap-2">
          {createTournament.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Creando...</>
          ) : currentStep === 3 ? (
            <><Check className="h-4 w-4" /> Crear Torneo</>
          ) : (
            <>Siguiente <ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateWizard;
