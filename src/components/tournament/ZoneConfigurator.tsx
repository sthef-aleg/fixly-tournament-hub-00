import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Eye, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PRESET_COLORS = [
  { name: "Azul", value: "#1565C0", label: "Copa / Clasificación" },
  { name: "Celeste", value: "#0288D1", label: "Repechaje" },
  { name: "Naranja", value: "#EF6C00", label: "Promoción" },
  { name: "Verde", value: "#2E7D32", label: "Ascenso" },
  { name: "Rojo", value: "#C62828", label: "Descenso" },
  { name: "Violeta", value: "#6A1B9A", label: "Zona especial" },
  { name: "Dorado", value: "#F9A825", label: "Campeón" },
  { name: "Gris", value: "#546E7A", label: "Neutral" },
];

interface ZoneEntry {
  id?: string;
  start_position: number;
  end_position: number;
  color: string;
  label: string;
}

interface ZoneConfiguratorProps {
  zones: ZoneEntry[];
  totalTeams: number;
  onSave: (zones: ZoneEntry[]) => Promise<void>;
  isSaving?: boolean;
}

const ZoneConfigurator = ({ zones: initialZones, totalTeams, onSave, isSaving }: ZoneConfiguratorProps) => {
  const [zones, setZones] = useState<ZoneEntry[]>(
    initialZones.length > 0 ? initialZones : []
  );

  const addZone = () => {
    const lastEnd = zones.length > 0 ? Math.max(...zones.map(z => z.end_position)) : 0;
    const newStart = lastEnd + 1;
    const newEnd = Math.min(newStart + 1, totalTeams);
    if (newStart > totalTeams) {
      toast.error("Ya cubriste todas las posiciones");
      return;
    }
    setZones([...zones, {
      start_position: newStart,
      end_position: newEnd,
      color: PRESET_COLORS[zones.length % PRESET_COLORS.length].value,
      label: "",
    }]);
  };

  const removeZone = (index: number) => {
    setZones(zones.filter((_, i) => i !== index));
  };

  const updateZone = (index: number, field: keyof ZoneEntry, value: string | number) => {
    setZones(zones.map((z, i) => i === index ? { ...z, [field]: value } : z));
  };

  const validate = (): string | null => {
    for (const z of zones) {
      if (z.start_position < 1) return "La posición inicial debe ser al menos 1";
      if (z.end_position > totalTeams) return `La posición final no puede superar ${totalTeams}`;
      if (z.end_position < z.start_position) return "La posición final no puede ser menor a la inicial";
    }
    // Check overlaps
    const sorted = [...zones].sort((a, b) => a.start_position - b.start_position);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start_position <= sorted[i - 1].end_position) {
        return "Las zonas no pueden superponerse";
      }
    }
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) { toast.error(error); return; }
    await onSave(zones);
    toast.success("Zonas guardadas correctamente");
  };

  // Preview: generate sample rows
  const getZoneForPos = (pos: number) => zones.find(z => pos >= z.start_position && pos <= z.end_position);

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <Eye className="h-5 w-5 text-accent" />
          Zonas de la Tabla
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Define rangos de posiciones y asígnales un color para la tabla de posiciones.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Zone entries */}
        <div className="space-y-3">
          {zones.map((zone, index) => (
            <div key={index} className="flex flex-wrap items-end gap-2 p-3 rounded-lg bg-secondary/50">
              {/* Color picker */}
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {PRESET_COLORS.map((pc) => (
                    <button
                      key={pc.value}
                      type="button"
                      onClick={() => updateZone(index, "color", pc.value)}
                      className={`h-7 w-7 rounded-md border-2 transition-all ${
                        zone.color === pc.value ? "border-foreground scale-110 shadow-md" : "border-transparent"
                      }`}
                      style={{ backgroundColor: pc.value }}
                      title={pc.name}
                    />
                  ))}
                </div>
              </div>

              {/* Positions */}
              <div className="flex gap-2 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs">Desde</Label>
                  <Input
                    type="number"
                    min={1}
                    max={totalTeams}
                    value={zone.start_position}
                    onChange={(e) => updateZone(index, "start_position", parseInt(e.target.value) || 1)}
                    className="w-16 h-9 text-center"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hasta</Label>
                  <Input
                    type="number"
                    min={zone.start_position}
                    max={totalTeams}
                    value={zone.end_position}
                    onChange={(e) => updateZone(index, "end_position", parseInt(e.target.value) || zone.start_position)}
                    className="w-16 h-9 text-center"
                  />
                </div>
              </div>

              {/* Label */}
              <div className="flex-1 min-w-[120px] space-y-1.5">
                <Label className="text-xs">Etiqueta</Label>
                <Input
                  value={zone.label}
                  onChange={(e) => updateZone(index, "label", e.target.value)}
                  placeholder="Ej: Libertadores"
                  className="h-9"
                  maxLength={30}
                />
              </div>

              {/* Delete */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeZone(index)}
                className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" size="sm" onClick={addZone} className="gap-2">
          <Plus className="h-4 w-4" /> Añadir Zona
        </Button>

        {/* Live Preview */}
        {zones.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Vista previa</Label>
            <div className="rounded-lg border border-border overflow-hidden">
              {Array.from({ length: Math.min(totalTeams, 20) }, (_, i) => {
                const pos = i + 1;
                const zone = getZoneForPos(pos);
                return (
                  <div
                    key={pos}
                    className="flex items-center gap-3 px-3 py-1.5 text-xs"
                    style={zone ? {
                      borderLeft: `4px solid ${zone.color}`,
                      backgroundColor: `${zone.color}10`,
                    } : { borderLeft: "4px solid transparent" }}
                  >
                    <span className="font-semibold w-5 text-right text-muted-foreground">{pos}</span>
                    <span className="text-muted-foreground">Equipo {pos}</span>
                    {zone?.label && (
                      <span
                        className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${zone.color}20`, color: zone.color }}
                      >
                        {zone.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Save */}
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 w-full sm:w-auto" variant="action">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar Zonas
        </Button>
      </CardContent>
    </Card>
  );
};

export default ZoneConfigurator;
