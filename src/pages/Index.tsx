import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Save, Zap, FileText, Loader2, Sparkles, Smile, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import ImageUpload from "@/components/ImageUpload";
import ComparisonView from "@/components/ComparisonView";
import { PatientSelector } from "@/components/PatientSelector";
import { QuickPatientForm } from "@/components/QuickPatientForm";
import { PDFViewerModal } from "@/components/PDFViewerModal";
import { hasConfig, getConfig } from "@/utils/storage";
import { getTimestamp } from "@/utils/formatters";
import { generateBudgetPDF, generateBudgetNumber } from "@/services/pdfService";
import { getPatientById } from "@/services/patientService";
import { useConfig } from "@/contexts/ConfigContext";
import { usePatientForm } from "@/hooks/usePatientForm";
import { generateTechnicalReportPDF, generateReportNumber } from "@/services/technicalReportService";

/**
 * Extrai dados da análise dental de forma compatível com ambas estruturas
 * (nova estrutura de pontuação + retrocompatibilidade)
 */
function extractAnalysisData(analiseJSON: any) {
  const analise = analiseJSON?.analise || analiseJSON;
  
  return {
    tom_pele: analise?.tom_pele || 'não especificado',
    cor_olhos: analise?.cor_olhos || 'não especificado',
    
    // Nova estrutura (sistema de pontuação)
    quantidade_facetas: 
      analise?.decisao_clinica?.quantidade_facetas ||
      analise?.quantidade_facetas || 0,
    
    conducta: analise?.decisao_clinica?.conducta || '',
    
    dentes_tratados: 
      analise?.decisao_clinica?.dentes_tratados ||
      analise?.dentes_tratados || [],
    
    procedimentos_recomendados: 
      analise?.procedimentos_recomendados || [],
    
    cor_recomendada: analise?.cor_recomendada || 'BL2',
    
    pontuacao_total: analise?.estado_geral?.pontuacao_total || 0
  };
}

// Tipos simplificados
type SimulatorState = 'selection' | 'input' | 'processing' | 'completed';
type SimulationType = 'clareamento' | 'facetas';

interface AnalysisResult {
  success: boolean;
  relatorio_tecnico?: string;
  orcamento?: string;
  analise_data?: any;
  metadata?: {
    total_chars?: number;
    finish_reason?: string;
    truncated?: boolean;
    model?: string;
    timestamp?: string;
  };
}

export default function Index() {
  const navigate = useNavigate();
  const location = useLocation();
  const { createPatient } = usePatientForm();
  const { config } = useConfig(); // Usar o contexto de configuração

  // Estados principais
  const [currentState, setCurrentState] = useState<SimulatorState>('selection');
  const [simulationType, setSimulationType] = useState<SimulationType | null>(null);
  const [hasApiConfig, setHasApiConfig] = useState(false);
  
  // Paciente
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [showQuickPatientForm, setShowQuickPatientForm] = useState(false);
  
  // Imagens
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  
  // Análise e simulação
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [currentSimulationId, setCurrentSimulationId] = useState<string | null>(null);
  const [analiseJSON, setAnaliseJSON] = useState<any>(null);
  const [orcamentoDinamico, setOrcamentoDinamico] = useState<any>(null);
  
  // Loading states
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [savingSimulation, setSavingSimulation] = useState(false);
  
  // PDFs
  const [budgetPdfUrl, setBudgetPdfUrl] = useState<string | null>(null);
  const [reportPdfUrl, setReportPdfUrl] = useState<string | null>(null);
  const [showBudgetPdfModal, setShowBudgetPdfModal] = useState(false);
  const [showReportPdfModal, setShowReportPdfModal] = useState(false);

  // Auth e Config check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }

      hasConfig().then((exists) => {
        setHasApiConfig(exists);
        if (!exists) {
          navigate("/config");
        }
      });
    });

    const state = location.state as { selectedPatient?: any };
    if (state?.selectedPatient) {
      setSelectedPatientId(state.selectedPatient.id);
      setPatientName(state.selectedPatient.name);
      setPatientPhone(state.selectedPatient.phone || "");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  // Timer para loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentState === 'processing') {
      const startTime = Date.now();
      interval = setInterval(() => {
        setProcessingTime(Date.now() - startTime);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [currentState]);

  // Load patient data
  useEffect(() => {
    if (selectedPatientId) {
      loadPatientData(selectedPatientId);
    }
  }, [selectedPatientId]);

  // Função utilitária para converter URL para Base64
  const urlToBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Erro ao converter URL para Base64:', error);
      throw error;
    }
  };

  const loadPatientData = async (patientId: string) => {
    try {
      const patient = await getPatientById(patientId);
      if (patient) {
        setPatientName(patient.name);
        setPatientPhone(patient.phone || "");
      }
    } catch (error) {
      console.error('Error loading patient:', error);
    }
  };

  const fetchActiveServices = async () => {
    try {
      const config = await getConfig();
      if (!config || !config.servicePrices) {
        console.warn('⚠️ Nenhuma configuração de serviços encontrada');
        return [];
      }
      
      // Filtrar apenas serviços ativos (considera true se campo não existir)
      const ativos = config.servicePrices.filter(s => s.active !== false);
      console.log(`✅ ${ativos.length} serviços ativos encontrados`);
      return ativos;
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      return [];
    }
  };

  const buildDynamicBudget = async (analiseJSON: any, simulationType: SimulationType | null) => {
    console.log(`🔍 Iniciando montagem de orçamento para tipo: ${simulationType}`);
    
    const servicosAtivos = await fetchActiveServices();
    
    if (servicosAtivos.length === 0) {
      toast.warning('Nenhum serviço ativo configurado. Configure na aba Configurações.');
      return {
        itens: [],
        opcionais: [],
        subtotal: 0,
        desconto_percentual: 10,
        desconto_valor: 0,
        total: 0
      };
    }
    
    const getServiceByCategory = (categoryName: string) => {
      const service = servicosAtivos.find(
        s => s.category === categoryName && s.active && s.price > 0
      );
      if (!service) {
        console.warn(`⚠️ Serviço da categoria '${categoryName}' não encontrado ou inativo/preço zero`);
      }
      return service;
    };
    
    const orcamentoItens: any[] = [];
    const opcionais: any[] = [];
    const analise = analiseJSON?.analise || analiseJSON;

    if (simulationType === 'clareamento') {
      console.log('Construindo orçamento para CLAREAMENTO...');

      const clareamento = getServiceByCategory('Clareamento');
      if (clareamento) {
        orcamentoItens.push({
          servico: clareamento.name,
          quantidade: 1,
          valor_unitario: clareamento.price,
          valor_total: clareamento.price,
          category: clareamento.category
        });
        console.log(`✓ Clareamento: 1x R$ ${clareamento.price.toFixed(2)}`);
      }

      const consulta = getServiceByCategory('Consulta');
      if (consulta) {
        orcamentoItens.push({
          servico: consulta.name,
          quantidade: 1,
          valor_unitario: consulta.price,
          valor_total: consulta.price,
          category: consulta.category
        });
        console.log(`✓ Consulta: 1x R$ ${consulta.price.toFixed(2)}`);
      } else {
        console.error('❌ CRÍTICO: Serviço de "Consulta" não encontrado!');
        toast.error('Erro: Configure o serviço "Consulta" nas Configurações.');
      }

    } else { // 'facetas' or null (legacy)
      console.log('Construindo orçamento para FACETAS...');
      const facetaCount = analise?.decisao_clinica?.quantidade_facetas || analise?.quantidade_facetas || 0;
      const isClareamentoRecomendado = analise?.procedimentos_recomendados?.some((p: string) => p.toLowerCase().includes('clareamento'));

      if (facetaCount > 0) {
        const faceta = getServiceByCategory('Facetas dentárias');
        if (faceta) {
          orcamentoItens.push({
            servico: faceta.name,
            quantidade: facetaCount,
            valor_unitario: faceta.price,
            valor_total: faceta.price * facetaCount,
            category: faceta.category
          });
        }
      }

      if (isClareamentoRecomendado || [2, 4].includes(facetaCount)) {
        const clareamento = getServiceByCategory('Clareamento');
        if (clareamento) {
          orcamentoItens.push({
            servico: clareamento.name,
            quantidade: 1,
            valor_unitario: clareamento.price,
            valor_total: clareamento.price,
            category: clareamento.category
          });
        }
      }

      if (facetaCount > 0 || isClareamentoRecomendado) {
        const consulta = getServiceByCategory('Consulta');
        if (consulta) {
          orcamentoItens.push({
            servico: consulta.name,
            quantidade: 1,
            valor_unitario: consulta.price,
            valor_total: consulta.price,
            category: consulta.category
          });
        } else {
          console.error('❌ CRÍTICO: Serviço de "Consulta" não encontrado!');
          toast.error('Erro: Configure o serviço "Consulta" nas Configurações.');
        }
      }

      if (analise.gengivoplastia_recomendada || analise.procedimentos_recomendados?.some((p: string) => p.toLowerCase().includes('gengivo'))) {
        const gengivo = getServiceByCategory('Gengivoplastia');
        if (gengivo) {
          opcionais.push({
            servico: gengivo.name,
            valor: gengivo.price,
            justificativa: analise.gengivoplastia_justificativa || 'Recomendado para correção da linha gengival',
            category: gengivo.category
          });
        }
      }
    }
    
    // Calcular totais
    const subtotal = orcamentoItens.reduce((sum, i) => sum + i.valor_total, 0);
    const desconto_percentual = 10;
    const desconto_valor = subtotal * (desconto_percentual / 100);
    const total = subtotal - desconto_valor;
    
    if (total === 0 && orcamentoItens.length > 0) {
      console.error('❌ ORÇAMENTO COM VALOR ZERO! Verifique configuração de serviços');
      toast.error('Erro ao calcular orçamento: verifique os preços nas Configurações');
    }
    
    console.log(`💰 Orçamento montado: ${orcamentoItens.length} itens, Subtotal: R$ ${subtotal.toFixed(2)}, Total: R$ ${total.toFixed(2)}`);
    
    return {
      itens: orcamentoItens,
      opcionais,
      subtotal,
      desconto_percentual,
      desconto_valor,
      total
    };
  };

  const handleQuickPatientCreate = async (data: { name: string; phone: string }) => {
    try {
      const patient = await createPatient(data);
      setSelectedPatientId(patient.id);
      setPatientName(patient.name);
      setPatientPhone(patient.phone);
      toast.success("Paciente criado com sucesso!");
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error("Erro ao criar paciente");
    }
  };

  const handleImageSelect = (base64: string) => {
    setOriginalImage(base64);
  };

  const handleClearImage = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setAnalysisData(null);
    setCurrentSimulationId(null);
    setCurrentState('input'); // Volta para a tela de input, não de seleção
  };

  // NOVO FLUXO DE GERAÇÃO EM DUAS ETAPAS
  const handleProcessAndGenerate = async () => {
    if (!originalImage || !patientName || !simulationType) {
      toast.error("Preencha o nome do paciente, a foto e selecione o tipo de simulação.");
      return;
    }

    setCurrentState('processing');
    setProcessingTime(0);
    let processedImageUrl: string | null = null;
    let afterImageBase64: string | null = null;

    try {
      const config = await getConfig();
      if (!config) throw new Error("Configuração não encontrada");
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // ========================================
      // PASSO 1: GERAR IMAGEM SIMULADA (5-8 segundos)
      // ========================================
      setProcessingStep('Gerando simulação visual...');
      const imageResponse = await fetch(`${supabaseUrl}/functions/v1/process-dental-facets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${config.apiKey}` },
        body: JSON.stringify({
          action: 'generate_image',
          imageBase64: originalImage,
          simulationType: simulationType,
        }),
      });

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro na geração da imagem: ${imageResponse.status}`);
      }
      
      const imageResult = await imageResponse.json();
      afterImageBase64 = imageResult.processedImageBase64; // Base64 da imagem gerada
      if (!afterImageBase64) throw new Error("A IA não retornou uma imagem simulada.");

      setProcessedImage(afterImageBase64); // Atualiza a UI com a imagem simulada
      toast.success("Simulação visual gerada com sucesso!");

      // ========================================
      // PASSO 2: GERAR RELATÓRIO E ORÇAMENTO (3-5 segundos)
      // ========================================
      setProcessingStep('Gerando relatório e orçamento...');
      const documentsResponse = await fetch(`${supabaseUrl}/functions/v1/process-dental-facets`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${config.apiKey}` },
          body: JSON.stringify({
              action: 'generate_documents',
              beforeImageBase64: originalImage,
              afterImageBase64: afterImageBase64,
              simulationType: simulationType,
          }),
      });

      if (!documentsResponse.ok) {
          const errorData = await documentsResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Erro na geração de documentos: ${documentsResponse.status}`);
      }

      const documentsResult = await documentsResponse.json();
      if (!documentsResult.success || !documentsResult.analysisData) {
          throw new Error("A IA não retornou os dados da análise.");
      }

      const analysisResult = documentsResult.analysisData;
      const analiseJSON = analysisResult.analise;
      setAnaliseJSON(analiseJSON);
      
      const relatorioTexto = "Relatório técnico gerado via JSON."; // Placeholder, o PDF usará o JSON
      const analysisDataCompat: AnalysisResult = {
        success: true,
        relatorio_tecnico: relatorioTexto,
        orcamento: '',
        analise_data: analiseJSON,
      };
      setAnalysisData(analysisDataCompat);

      const dynamicBudget = await buildDynamicBudget(analiseJSON, simulationType);
      setOrcamentoDinamico(dynamicBudget);

      // ========================================
      // PASSO 3: SALVAR TUDO E GERAR PDFs
      // ========================================
      setProcessingStep('Finalizando e gerando PDFs...');
      const { data: { user } } = await supabase.auth.getUser();
      let simulationId: string | null = null;

      if (user) {
          const timestamp = getTimestamp();

          // Salvar imagem original
          const originalBlob = await (await fetch(originalImage)).blob();
          const originalFileName = `${user.id}/original-${timestamp}.jpeg`;
          await supabase.storage.from('original-images').upload(originalFileName, originalBlob, { contentType: 'image/jpeg', upsert: true });
          const { data: { publicUrl: originalUrl } } = supabase.storage.from('original-images').getPublicUrl(originalFileName);

          // Salvar imagem processada
          const processedBlob = await (await fetch(afterImageBase64)).blob();
          const processedFileName = `${user.id}/processed-${timestamp}.jpeg`;
          await supabase.storage.from('processed-images').upload(processedFileName, processedBlob, { contentType: 'image/jpeg', upsert: true });
          const { data: { publicUrl: processedUrl } } = supabase.storage.from('processed-images').getPublicUrl(processedFileName);
          processedImageUrl = processedUrl;

          const { data: simulation } = await supabase.from('simulations').insert({
              user_id: user.id,
              patient_id: selectedPatientId,
              patient_name: patientName,
              patient_phone: patientPhone || null,
              original_image_url: originalUrl,
              processed_image_url: processedImageUrl,
              technical_notes: JSON.stringify(analiseJSON.relatorio_tecnico),
              budget_data: analiseJSON.orcamento,
              status: 'completed',
              simulation_type: simulationType,
          }).select().single();
          simulationId = simulation.id;
          setCurrentSimulationId(simulationId);
      }
      
      // Gerar PDFs
      const reportPdf = await generateTechnicalReportPDF({
          reportNumber: generateReportNumber(),
          patientName,
          date: new Date(),
          reportContent: analiseJSON.relatorio_tecnico, // Passando o JSON completo
          simulationId: simulationId || '',
          beforeImage: originalImage,
          afterImage: afterImageBase64
      });

      let budgetPdf: string | null = null;
      if (dynamicBudget && dynamicBudget.itens?.length > 0) {
        budgetPdf = await generateBudgetPDF({
            budgetNumber: generateBudgetNumber(),
            patientName,
            date: new Date(),
            itens: dynamicBudget.itens,
            opcionais: dynamicBudget.opcionais || [],
            subtotal: dynamicBudget.subtotal,
            desconto_percentual: dynamicBudget.desconto_percentual,
            desconto_valor: dynamicBudget.desconto_valor,
            total: dynamicBudget.total,
            beforeImage: originalImage,
            afterImage: afterImageBase64
        });
      }

      // Atualizar simulação com URLs dos PDFs
      if (simulationId) {
          await supabase.from('simulations').update({
              technical_report_url: reportPdf,
              budget_pdf_url: budgetPdf,
          }).eq('id', simulationId);
      }

      setReportPdfUrl(reportPdf);
      setBudgetPdfUrl(budgetPdf);
      setCurrentState('completed');
      toast.success("Simulação, relatório e orçamento concluídos!");

    } catch (err) {
      console.error("Erro no fluxo de geração:", err);
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido";
      toast.error(errorMessage);
      setCurrentState('input'); // Volta para a tela de input em caso de erro
    }
  };

  const handleViewTechnicalReport = () => {
    if (reportPdfUrl) {
      setShowReportPdfModal(true);
    }
  };

  const handleViewBudget = () => {
    if (budgetPdfUrl) {
      setShowBudgetPdfModal(true);
    }
  };

  const handleSaveSimulation = async () => {
    if (!currentSimulationId || !patientName || !analysisData || !originalImage || !processedImage || !reportPdfUrl || !budgetPdfUrl) {
      toast.error("Dados insuficientes para salvar simulação");
      return;
    }

    setSavingSimulation(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Extrair números dos PDFs já gerados
      const { data: simulation } = await supabase
        .from('simulations')
        .select('*')
        .eq('id', currentSimulationId)
        .single();

      const reportNumber = generateReportNumber();
      const budgetNumber = generateBudgetNumber();

      // Atualizar status da simulação
      await supabase.from('simulations').update({
        status: 'saved'
      }).eq('id', currentSimulationId);

      // Salvar na tabela reports
      await supabase.from('reports').insert({
        simulation_id: currentSimulationId,
        patient_id: selectedPatientId,
        user_id: user.id,
        patient_name: patientName,
        report_number: reportNumber,
        pdf_url: reportPdfUrl,
        before_image: originalImage,
        after_image: processedImage
      });

      // Salvar na tabela budgets com dados estruturados
      const budgetData = orcamentoDinamico || {
        subtotal: 0,
        total: 0,
        itens: [],
        desconto_percentual: 10
      };
      
      await supabase.from('budgets').insert({
        patient_id: selectedPatientId,
        user_id: user.id,
        patient_name: patientName,
        budget_number: budgetNumber,
        pdf_url: budgetPdfUrl,
        before_image: originalImage,
        after_image: processedImage,
          teeth_count: analiseJSON?.analise?.decisao_clinica?.quantidade_facetas || 
                       analiseJSON?.analise?.quantidade_facetas || 0,
        subtotal: budgetData.subtotal,
        final_price: budgetData.total,
        price_per_tooth: budgetData.itens?.find((i: any) => i.dentes)?.valor_unitario || 0,
        payment_conditions: {
          desconto: budgetData.desconto_percentual,
          opcao_vista: budgetData.total,
          analise: analiseJSON
        }
      });

      if (selectedPatientId) {
        await supabase.from('patients').update({
          last_simulation_date: new Date().toISOString()
        }).eq('id', selectedPatientId);
      }

      await supabase.from('crm_leads').insert({
        patient_id: selectedPatientId,
        simulation_id: currentSimulationId,
        user_id: user.id,
        patient_name: patientName,
        patient_phone: patientPhone || null,
        before_image: originalImage,
        after_image: processedImage,
        status: 'new',
        source: 'simulator',
        simulation_type: simulationType, // Adicionado
      });

      toast.success("Simulação salva!");
      handleNewSimulation();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar simulação');
    } finally {
      setSavingSimulation(false);
    }
  };

  const handleNewSimulation = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setAnalysisData(null);
    setCurrentSimulationId(null);
    setProcessingTime(0);
    setProcessingStep('');
    setCurrentState('selection'); // Volta para a tela de SELEÇÃO
    setSimulationType(null); // Reseta o tipo de simulação
    setBudgetPdfUrl(null);
    setReportPdfUrl(null);
    setSelectedPatientId(null);
    setPatientName("");
    setPatientPhone("");
    setAnaliseJSON(null);
    setOrcamentoDinamico(null);
  };

  if (!hasApiConfig) {
    return null;
  }

  const handleSelectSimulationType = (type: SimulationType) => {
    setSimulationType(type);
    setCurrentState('input');
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            TruSmile - Simulador de Sorriso
          </h1>
          <p className="text-muted-foreground">
            Transforme sorrisos com IA
          </p>
        </div>

        {/* TELA 0: SELEÇÃO DO TIPO DE SIMULAÇÃO */}
        {currentState === 'selection' && (
          <Card>
            <CardHeader>
              <CardTitle>Escolha o tipo de simulação</CardTitle>
              <CardDescription>Selecione o procedimento que deseja simular.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {config?.whiteningSimulatorEnabled && (
                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center justify-center space-y-3"
                  onClick={() => handleSelectSimulationType('clareamento')}
                >
                  <Sparkles className="h-10 w-10 text-primary" />
                  <span className="text-lg font-semibold">Clareamento Dentário</span>
                  <p className="text-sm text-muted-foreground text-center">Simule a melhoria na cor dos dentes, mantendo a forma original.</p>
                </Button>
              )}
              <Button
                variant="outline"
                className={`h-auto py-6 flex flex-col items-center justify-center space-y-3 ${!config?.whiteningSimulatorEnabled ? 'col-span-2' : ''}`}
                onClick={() => handleSelectSimulationType('facetas')}
              >
                <Smile className="h-10 w-10 text-primary" />
                <span className="text-lg font-semibold">Facetas Dentárias</span>
                <p className="text-sm text-muted-foreground text-center">Simule a correção de cor, forma e alinhamento com facetas.</p>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* TELA 1: INPUT (Dados + Upload) */}
        {currentState === 'input' && simulationType && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                 <Button variant="ghost" size="icon" onClick={() => setCurrentState('selection')}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                <div>
                  <CardTitle>Nova Simulação: {simulationType === 'clareamento' ? 'Clareamento' : 'Facetas'}</CardTitle>
                  <CardDescription>Preencha os dados e faça o upload da foto</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seletor de Paciente */}
              <div className="space-y-2">
                <Label>Paciente</Label>
                <PatientSelector
                  value={selectedPatientId}
                  onChange={setSelectedPatientId}
                  onCreateNew={() => setShowQuickPatientForm(true)}
                />
              </div>

              {/* Dados do Paciente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Nome do Paciente *</Label>
                  <Input
                    id="patientName"
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientPhone">Telefone (opcional)</Label>
                  <Input
                    id="patientPhone"
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              {/* Upload de Imagem */}
              <div className="space-y-2">
                <Label>Foto do Sorriso *</Label>
                <ImageUpload
                  onImageSelect={handleImageSelect}
                  currentImage={originalImage}
                  onClear={handleClearImage}
                  disabled={false}
                />
              </div>

              {/* Botão Processar */}
              <Button
                onClick={handleProcessAndGenerate}
                disabled={!patientName || !originalImage}
                size="lg"
                className="w-full"
              >
                <Zap className="h-5 w-5 mr-2" />
                Processar e Gerar Simulação
              </Button>
            </CardContent>
          </Card>
        )}

        {/* LOADING: Processando */}
        {currentState === 'processing' && (
          <Card>
            <CardContent className="py-16 text-center">
              <Loader2 className="h-16 w-16 animate-spin mx-auto mb-6 text-primary" />
              <p className="text-xl font-medium mb-2">{processingStep}</p>
              <p className="text-sm text-muted-foreground mb-4">
                Aguarde 8-15 segundos
              </p>
              {processingTime > 0 && (
                <div className="space-y-2">
                  <p className="text-lg font-mono text-muted-foreground">
                    {(processingTime / 1000).toFixed(1)}s
                  </p>
                  <div className="w-64 mx-auto bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((processingTime / 15000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TELA 2: RESULTADO */}
        {currentState === 'completed' && analysisData && processedImage && originalImage && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Simulação Concluída: {simulationType === 'clareamento' ? 'Clareamento' : 'Facetas'}</CardTitle>
                <CardDescription>Paciente: {patientName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Comparação Antes/Depois */}
                <ComparisonView
                  beforeImage={originalImage}
                  afterImage={processedImage}
                  isProcessing={false}
                  processingTime={0}
                />

                {/* Botões de Documentos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleViewTechnicalReport}
                    disabled={!reportPdfUrl}
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Relatório Técnico
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleViewBudget}
                    disabled={!budgetPdfUrl}
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Orçamento
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Botão Salvar */}
            <div className="flex justify-end gap-4">
               <Button
                variant="outline"
                onClick={handleNewSimulation}
                size="lg"
              >
                Nova Simulação
              </Button>
              <Button
                onClick={handleSaveSimulation}
                disabled={savingSimulation}
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {savingSimulation ? 'Salvando...' : 'Salvar e Adicionar ao CRM'}
              </Button>
            </div>
          </div>
        )}

        {/* Modais */}
        <QuickPatientForm
          isOpen={showQuickPatientForm}
          onClose={() => setShowQuickPatientForm(false)}
          onSave={handleQuickPatientCreate}
        />

        {budgetPdfUrl && (
          <PDFViewerModal
            isOpen={showBudgetPdfModal}
            onClose={() => setShowBudgetPdfModal(false)}
            pdfUrl={budgetPdfUrl}
            title="Orçamento"
          />
        )}

        {reportPdfUrl && (
          <PDFViewerModal
            isOpen={showReportPdfModal}
            onClose={() => setShowReportPdfModal(false)}
            pdfUrl={reportPdfUrl}
            title="Relatório Técnico"
          />
        )}
      </div>
    </Layout>
  );
}
