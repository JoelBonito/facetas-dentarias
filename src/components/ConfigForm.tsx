import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { saveConfig, getConfig, DEFAULT_PROMPT, type Config, DEFAULT_SERVICES } from "@/utils/storage";
import { Switch } from "@/components/ui/switch";
import { useConfig } from "@/contexts/ConfigContext";

export default function ConfigForm() {
  const navigate = useNavigate();
  const { refreshConfig } = useConfig();
  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<Config>>({
    apiKey: "",
    backendUrl: import.meta.env.VITE_SUPABASE_URL || "",
    temperature: 0.4,
    topK: 32,
    topP: 1.0,
    maxTokens: 8192,
    promptTemplate: DEFAULT_PROMPT,
    crmEnabled: true,
    whiteningSimulatorEnabled: true,
  });

  useEffect(() => {
    getConfig().then(config => {
      if (config) {
        setFormData({
          ...config,
          whiteningSimulatorEnabled: config.whiteningSimulatorEnabled !== false,
        });
      }
    });
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.apiKey || formData.apiKey.length < 20) {
      newErrors.apiKey = "API Key inválida (mínimo 20 caracteres)";
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }
    const currentConfig = await getConfig();
    const newConfig: Config = {
      ...(currentConfig || {} as Config),
      ...formData,
      servicePrices: currentConfig?.servicePrices || DEFAULT_SERVICES, // Preserva os preços existentes
    };
    try {
      await saveConfig(newConfig);
      await refreshConfig();
      toast.success("Configuração salva com sucesso!");
      setTimeout(() => navigate("/"), 500);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configuração");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* CREDENCIAIS */}
      <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">🔑 Configurações da API Gemini</h2>
        <div className="space-y-2">
          <Label htmlFor="apiKey">Google Gemini API Key *</Label>
          <div className="relative">
            <Input id="apiKey" type={showApiKey ? "text" : "password"} value={formData.apiKey} onChange={e => setFormData({...formData, apiKey: e.target.value})} placeholder="AIza..." />
            <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
           {errors.apiKey && <p className="text-sm text-destructive">{errors.apiKey}</p>}
        </div>
      </div>

      {/* MÓDULOS DO SISTEMA */}
      <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">📊 Módulos do Sistema</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
                <Label htmlFor="crmEnabled" className="text-base font-semibold">Módulo CRM</Label>
                <p className="text-sm text-muted-foreground">Ativar ou desativar o módulo de gestão de leads.</p>
            </div>
            <Switch id="crmEnabled" checked={formData.crmEnabled} onCheckedChange={checked => setFormData(prev => ({ ...prev, crmEnabled: checked }))} />
          </div>
          <div className="flex items-center justify-between">
             <div className="space-y-1">
                <Label htmlFor="whiteningSimulatorEnabled" className="text-base font-semibold">Simulador de Clareamento</Label>
                <p className="text-sm text-muted-foreground">Ativar ou desativar a opção de simulação de clareamento.</p>
            </div>
            <Switch id="whiteningSimulatorEnabled" checked={formData.whiteningSimulatorEnabled} onCheckedChange={checked => setFormData(prev => ({ ...prev, whiteningSimulatorEnabled: checked }))} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pb-6">
        <Button type="submit" className="bg-primary hover:bg-primary/90">
          <Save className="h-4 w-4 mr-2" />
          Salvar Configuração
        </Button>
      </div>
    </form>
  );
}