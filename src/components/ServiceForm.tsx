import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type ServicePrice } from "@/utils/storage";

interface ServiceFormProps {
  service: ServicePrice | null;
  onSave: (service: ServicePrice) => void;
  onCancel: () => void;
}

export function ServiceForm({ service, onSave, onCancel }: ServiceFormProps) {
  const [formData, setFormData] = useState<ServicePrice>({
    name: "",
    description: "",
    price: 0,
    category: "Opcional",
    active: true,
    required: false, // Por padrão, novos serviços não são obrigatórios
    base: false,
  });

  useEffect(() => {
    if (service) {
      setFormData(service);
    }
  }, [service]);

  const handleChange = (field: keyof ServicePrice, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Serviço</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          disabled={formData.required}
        />
         {formData.required && <p className="text-xs text-muted-foreground">Serviços obrigatórios não podem ter o nome alterado.</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
            required
            min="0"
            step="0.01"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleChange('category', value)}
            disabled={formData.required}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Consulta">Consulta</SelectItem>
              <SelectItem value="Clareamento">Clareamento</SelectItem>
              <SelectItem value="Facetas dentárias">Facetas dentárias</SelectItem>
              <SelectItem value="Gengivoplastia">Gengivoplastia</SelectItem>
              <SelectItem value="Opcional">Opcional</SelectItem>
            </SelectContent>
          </Select>
           {formData.required && <p className="text-xs text-muted-foreground">A categoria de serviços obrigatórios é fixa.</p>}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => handleChange('active', checked)}
        />
        <Label htmlFor="active">Serviço Ativo</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}