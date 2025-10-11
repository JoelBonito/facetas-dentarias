const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =================================================================================
// PROMPTS DE GERAÇÃO DE IMAGEM
// =================================================================================

const FACETAS_IMAGE_PROMPT = `
Você é um simulador de tratamento dental fotorrealista.

TAREFA: Gere uma imagem simulada do "DEPOIS" aplicando o padrão técnico da clínica.

PADRÃO TÉCNICO FIXO:
✓ Facetas em resina composta BL3 em TODOS os dentes visíveis no sorriso
✓ Bordas incisais translúcidas nos incisivos (12, 11, 21, 22)
✓ Cor uniforme BL3 (branco natural harmonioso - escala Vita)
✓ Alinhamento corrigido (se necessário)
✓ Proporções harmoniosas com o rosto

PRESERVAR ABSOLUTAMENTE:
✗ NÃO altere: pele, textura da pele, olhos, cabelo, barba, expressão facial
✗ NÃO altere: ângulo da câmera, iluminação, fundo
✗ NÃO altere: lábios (apenas a parte interna - dentes)

MODIFICAR APENAS:
✓ Dentes: cor, forma, alinhamento
✓ Linha gengival: correção leve se houver assimetria > 2mm

RESULTADO ESPERADO:
- Imagem fotorrealista indistinguível de uma foto real
- Transformação natural e harmoniosa
- Adequado para uso clínico/comercial (prévia de tratamento)
`;

const CLAREAMENTO_IMAGE_PROMPT = `
Você é um simulador de tratamento dental fotorrealista especializado em clareamento dentário.

TAREFA: Gere uma imagem simulada do "DEPOIS" aplicando o protocolo de clareamento da clínica.

PROTOCOLO DE CLAREAMENTO FIXO:
✓ Clareamento dental profissional BL2 em TODOS os dentes visíveis no sorriso
✓ Cor uniforme BL2 (branco brilhante natural - escala Vita)
✓ Manutenção da translucidez natural nas bordas incisais dos dentes anteriores (12, 11, 21, 22)
✓ Preservação das características naturais dos dentes (textura, formato, microdetalhes)
✓ Brilho saudável e natural do esmalte clareado
✓ Harmonia com o tom de pele do paciente

PRESERVAR ABSOLUTAMENTE:
✗ NÃO altere: pele, textura da pele, olhos, cabelo, barba, expressão facial
✗ NÃO altere: ângulo da câmera, iluminação, fundo
✗ NÃO altere: lábios, formato da boca, contorno dos lábios
✗ NÃO altere: formato dos dentes, alinhamento dentário, proporções dentárias
✗ NÃO altere: posição gengival, anatomia gengival
✗ NÃO altere: textura superficial dos dentes (manter naturalidade)

MODIFICAR APENAS:
✓ Cor dos dentes: transição suave da cor atual para BL2
✓ Uniformização da tonalidade: remover manchas, descolorações e variações de cor
✓ Luminosidade: aumentar o brilho natural do esmalte
✓ Saturação: reduzir tons amarelados mantendo aspecto natural

DIRETRIZES TÉCNICAS:
- Respeitar a anatomia dental existente (não remodelar)
- Manter diferenças sutis de luminosidade entre dentes para naturalidade
- Preservar sombras e reflexos naturais dos dentes
- Garantir transição gradual entre dente e gengiva
- Manter transparência nas bordas incisais (quando presente naturalmente)

RESULTADO ESPERADO:
- Imagem fotorrealista indistinguível de uma foto real
- Clareamento natural e harmonioso com o rosto do paciente
- Dentes visivelmente mais brancos, mas com aparência natural (não artificial)
- Adequado para uso clínico/comercial (prévia de tratamento)
- O paciente deve reconhecer seu próprio sorriso, apenas mais branco

IMPORTANTE: O resultado deve parecer um clareamento dental real, não uma edição digital óbvia. A naturalidade é essencial.
`;

// =================================================================================
// PROMPT DE GERAÇÃO DE DOCUMENTOS (RELATÓRIO + ORÇAMENTO)
// =================================================================================

const DOCUMENTS_GENERATION_PROMPT = `
Você é um dentista especialista em odontologia estética com vasta experiência em análise clínica e planejamento de tratamentos.

---

**TAREFA:** Analise as imagens ANTES e DEPOIS e gere um JSON único contendo um relatório técnico profissional E um orçamento detalhado, seguindo a estrutura fornecida.

**IMAGENS FORNECIDAS:**
- Imagem 1: FOTO ANTES (condição atual)
- Imagem 2: FOTO DEPOIS (resultado simulado)

**TIPO DE TRATAMENTO SIMULADO:** [O tipo de tratamento será inserido aqui: Clareamento ou Facetas]

---

**ESTRUTURA DO JSON DE SAÍDA OBRIGATÓRIO:**

{
  "analise": {
    "tom_pele": "clara|média|morena|escura",
    "cor_olhos": "claros|médios|escuros",
    "tipo_tratamento": "clareamento|facetas|facetas_clareamento",
    "relatorio_tecnico": {
        "analise_condicao_atual": {
            "avaliacao_dental": {
                "coloracao_atual": "A3",
                "uniformidade_cor": "Desuniforme, com dentes 11 e 21 mais claros.",
                "manchas_descoloracoes": "Manchas amareladas nos caninos (13, 23).",
                "translucidez": "Baixa, com bordas opacas.",
                "textura_esmalte": "Brilho reduzido e aspecto de desgaste."
            },
            "avaliacao_estrutural": {
                "alinhamento_dentario": "Leve rotação do dente 12.",
                "formato_dentes": "Incisivos centrais (11, 21) com formato quadrado.",
                "proporcoes": "Laterais (12, 22) parecem pequenos em relação aos centrais.",
                "linha_sorriso": "Linha do sorriso plana."
            },
            "avaliacao_gengival": {
                "contorno_gengival": "Simétrico, sem irregularidades notáveis.",
                "saude_gengival": "Aparente normalidade.",
                "zenite_gengival": "Posicionamento adequado."
            },
            "diagnostico_resumido": {
                "problemas_esteticos": ["Cor amarelada e desuniforme", "Leve desalinhamento", "Proporções inadequadas"],
                "complexidade_caso": "médio"
            }
        },
        "analise_resultado_simulado": {
            "resultado_alcancado": {
                "cor_final": "BL2",
                "uniformizacao": "Cor totalmente uniforme e harmoniosa.",
                "brilho_vitalidade": "Esmalte com brilho natural e aspecto saudável.",
                "alteracoes_estruturais": "Nenhuma (para clareamento) / Alinhamento e proporções corrigidos (para facetas).",
                "harmonia_facial": "O novo sorriso harmoniza bem com o tom de pele e formato do rosto."
            }
        },
        "protocolo_tratamento": {
            "tratamento_proposto": "Clareamento Dental / Facetas em Resina Composta",
            "planejamento_pre_operatorio": [
                "Exame clínico completo com radiografias periapicais.",
                "Avaliação de cáries, trincas e restaurações existentes.",
                "Moldagem para modelos de estudo e enceramento diagnóstico (se facetas).",
                "Profilaxia completa."
            ],
            "protocolo_clinico": "...",
            "cuidados_pos_tratamento": "...",
            "materiais_equipamentos": "...",
            "prognostico_expectativas": "..."
        }
    },
    "orcamento": {
      "tratamento_principal": "Clareamento Dental em Consultório",
      "valor_base_tipo": "clareamento",
      "procedimentos_inclusos": [
        "Sessões em consultório",
        "Gel clareador profissional",
        "Dessensibilizante"
      ],
      "procedimentos_opcionais": [
        "Limpeza/Profilaxia Dentária"
      ],
      "observacoes": "Este é um orçamento indicativo baseado em análise fotográfica simulada. Um orçamento definitivo e personalizado será elaborado após agendamento de avaliação clínica presencial."
    }
  }
}
`;

// =================================================================================
// INTERFACES E VALIDAÇÃO
// =================================================================================

interface AnaliseJSON {
  analise: {
    tom_pele: "clara" | "média" | "morena" | "escura";
    cor_olhos: "claros" | "médios" | "escuros";
    tipo_tratamento: "clareamento" | "facetas" | "facetas_clareamento";
    relatorio_tecnico: any; // Manter genérico por enquanto
    orcamento: {
      tratamento_principal: string;
      valor_base_tipo: "clareamento" | "facetas_2" | "facetas_4" | "facetas_6" | "facetas";
      procedimentos_inclusos: string[];
      procedimentos_opcionais: string[];
      observacoes: string;
    };
  };
}


function validateAndNormalizeJSON(data: any, simulationType: string): AnaliseJSON {
    if (!data.analise) {
        throw new Error('JSON da IA inválido: campo "analise" ausente.');
    }

    const { analise } = data;

    if (!analise.relatorio_tecnico || !analise.orcamento) {
        throw new Error('JSON da IA inválido: "relatorio_tecnico" ou "orcamento" ausente.');
    }

    // Normalização do tipo de tratamento
    if (simulationType === 'clareamento') {
        analise.tipo_tratamento = 'clareamento';
        analise.orcamento.valor_base_tipo = 'clareamento';
    } else { // Facetas
        analise.tipo_tratamento = 'facetas_clareamento';
        analise.orcamento.valor_base_tipo = 'facetas';
    }

    console.log(`✓ JSON Validado e Normalizado para o tipo: ${analise.tipo_tratamento}`);
    return data as AnaliseJSON;
}


// =================================================================================
// SERVIDOR DA EDGE FUNCTION
// =================================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, imageBase64, beforeImageBase64, afterImageBase64, simulationType, config } = body;

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('API Key não configurada no ambiente');
    }

    // --- AÇÃO 1: GERAR IMAGEM SIMULADA ---
    if (action === 'generate_image') {
      console.log(`🚀 Ação: Gerar Imagem. Tipo: ${simulationType}`);
      if (!imageBase64 || !simulationType) {
        throw new Error("Ação 'generate_image' requer 'imageBase64' e 'simulationType'.");
      }

      const prompt = simulationType === 'clareamento' ? CLAREAMENTO_IMAGE_PROMPT : FACETAS_IMAGE_PROMPT;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageBase64 } },
              ],
            },
          ],
          modalities: ['image', 'text'],
          max_tokens: 8000,
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API Gemini (Image): ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const generatedImage = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!generatedImage) {
        throw new Error('Nenhuma imagem foi gerada pelo modelo.');
      }

      console.log('✓ Imagem simulada gerada com sucesso.');
      return new Response(JSON.stringify({ success: true, processedImageBase64: generatedImage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- AÇÃO 2: GERAR RELATÓRIO E ORÇAMENTO ---
    if (action === 'generate_documents') {
      console.log(`📄 Ação: Gerar Documentos. Tipo: ${simulationType}`);
      if (!beforeImageBase64 || !afterImageBase64 || !simulationType) {
        throw new Error("Ação 'generate_documents' requer 'beforeImageBase64', 'afterImageBase64' e 'simulationType'.");
      }

      const prompt = DOCUMENTS_GENERATION_PROMPT.replace('[O tipo de tratamento será inserido aqui: Clareamento ou Facetas]', `O tratamento simulado foi: ${simulationType}`);

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: beforeImageBase64 } },
                { type: 'image_url', image_url: { url: afterImageBase64 } },
              ],
            },
          ],
          response_mime_type: 'application/json',
          max_tokens: 10000,
          temperature: 0.3,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API Gemini (Documents): ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const responseText = result.choices?.[0]?.message?.content?.trim();

      if (!responseText) {
        throw new Error('A API Gemini não retornou conteúdo para os documentos.');
      }

      let analise_data;
      try {
        let cleanJsonText = responseText.replace(/```(json)?/g, '').trim();
        analise_data = JSON.parse(cleanJsonText);
      } catch (e) {
        console.error('Erro ao parsear JSON da IA:', e);
        console.error('Resposta recebida:', responseText);
        throw new Error('Resposta da IA não está em formato JSON válido.');
      }

      const validatedData = validateAndNormalizeJSON(analise_data, simulationType);

      console.log('✓ Documentos gerados e validados com sucesso.');
      return new Response(JSON.stringify({ success: true, analysisData: validatedData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    throw new Error('Ação não especificada ou inválida. Use "generate_image" ou "generate_documents".');

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno desconhecido';
    console.error('❌ ERRO NA EDGE FUNCTION:', message);
    console.error(error.stack);
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});