import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Archive, Edit } from "lucide-react";
import { getConfig, saveConfig, type ServicePrice } from "@/utils/storage";
import { toast } from "sonner";
import { ServiceForm } from "@/components/ServiceForm";

export default function Services() {
  const [services, setServices] = useState<ServicePrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServicePrice | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const config = await getConfig();
      setServices(config?.servicePrices || []);
    } catch (error) {
      toast.error("Falha ao carregar os serviços.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (service: ServicePrice | null = null) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setIsModalOpen(false);
  };

  const handleSaveService = async (serviceToSave: ServicePrice) => {
    const config = await getConfig();
    if (!config) {
        toast.error("Configuração não encontrada.");
        return;
    }

    let updatedServices: ServicePrice[];
    const isEditing = !!selectedService;

    if (isEditing) {
      // Ao editar, usamos o nome original (do selectedService) para encontrar o item certo
      updatedServices = services.map(s =>
        s.name === selectedService.name ? serviceToSave : s
      );
      // Verifica se o novo nome já existe em outro serviço
      if (services.some(s => s.name === serviceToSave.name && s.name !== selectedService.name)) {
        toast.error("Já existe outro serviço com este novo nome.");
        return;
      }
    } else {
      // Ao adicionar, verificamos se o nome já existe
      if (services.some(s => s.name === serviceToSave.name)) {
        toast.error("Já existe um serviço com este nome.");
        return;
      }
      updatedServices = [...services, serviceToSave];
    }

    await saveConfig({ ...config, servicePrices: updatedServices });
    setServices(updatedServices);
    toast.success(`Serviço "${serviceToSave.name}" salvo com sucesso!`);
    handleCloseModal();
  };

  const handleArchiveService = async (serviceToArchive: ServicePrice) => {
    if (serviceToArchive.required) {
        toast.error("Serviços obrigatórios não podem ser arquivados.");
        return;
    }
     const config = await getConfig();
     const updatedServices = services.map(s =>
        s.name === serviceToArchive.name ? { ...s, active: false } : s
     );
     await saveConfig({ ...config, servicePrices: updatedServices });
     setServices(updatedServices);
     toast.success(`Serviço "${serviceToArchive.name}" arquivado.`);
  };

  return (
    <Layout>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Serviços da Clínica</h1>
              <p className="text-muted-foreground">Gerencie os procedimentos oferecidos e seus preços.</p>
            </div>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenModal()}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Novo Serviço
              </Button>
            </DialogTrigger>
          </div>

          {isLoading ? (
            <p>Carregando serviços...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => (
                <Card key={index} className={!service.active ? 'opacity-50 bg-muted/50' : ''}>
                  <CardHeader>
                    <CardTitle>{service.name}</CardTitle>
                    <CardDescription>{service.category} {service.required ? '(Obrigatório)' : ''}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground min-h-[40px]">{service.description || 'Sem descrição.'}</p>
                    <p className="text-2xl font-bold">R$ {service.price.toFixed(2)}</p>
                    <div className="flex justify-end gap-2">
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(service)}>
                          <Edit className="h-3 w-3 mr-1" /> Editar
                        </Button>
                      </DialogTrigger>
                      {service.active && !service.required && (
                        <Button variant="secondary" size="sm" onClick={() => handleArchiveService(service)}>
                          <Archive className="h-3 w-3 mr-1" /> Arquivar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={() => handleCloseModal()}>
          <DialogHeader>
            <DialogTitle>{selectedService ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
          </DialogHeader>
          <ServiceForm
            service={selectedService}
            onSave={handleSaveService}
            onCancel={handleCloseModal}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}