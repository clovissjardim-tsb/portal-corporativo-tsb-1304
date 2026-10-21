migrate(
  (app) => {
    // =========================================================================
    // 1. Atualizar campos da coleção users para perfil do carregador
    //    razao_social, cnpj, responsavel, telefone, autorizacao_anp
    // =========================================================================
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('razao_social')) {
      usersCol.fields.add(new TextField({ name: 'razao_social', required: false }))
    }
    if (!usersCol.fields.getByName('cnpj')) {
      usersCol.fields.add(new TextField({ name: 'cnpj', required: false }))
    }
    if (!usersCol.fields.getByName('responsavel')) {
      usersCol.fields.add(new TextField({ name: 'responsavel', required: false }))
    }
    if (!usersCol.fields.getByName('telefone')) {
      usersCol.fields.add(new TextField({ name: 'telefone', required: false }))
    }
    if (!usersCol.fields.getByName('autorizacao_anp')) {
      usersCol.fields.add(new TextField({ name: 'autorizacao_anp', required: false }))
    }
    app.save(usersCol)

    // =========================================================================
    // 2. Criar coleção 'poc_documentos' (Documentação pública e cronograma do ciclo)
    //    Edital, Minuta Contrato de Serviço de Transporte, Procedimentos Operacionais,
    //    Regulamento, Tarifas, Comunicados, FAQ, etc.
    // =========================================================================
    let pocDocsCol
    try {
      pocDocsCol = app.findCollectionByNameOrId('poc_documentos')
    } catch (_) {
      pocDocsCol = new Collection({
        name: 'poc_documentos',
        type: 'base',
        listRule: '', // Público para consulta livre (Art. 37-A §2º)
        viewRule: '',
        createRule: "@request.auth.id != ''", // Operador TSB
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'ciclo', type: 'text', required: true }, // ex: "2026/2027" ou "2026"
          {
            name: 'categoria',
            type: 'select',
            required: true,
            values: [
              'edital',
              'regulamento',
              'minuta_contrato_transporte',
              'proposta_tarifaria',
              'procedimentos_operacionais',
              'cronograma',
              'comunicados',
              'faq',
              'resultado_manifestacao',
              'resultado_final',
            ],
            maxSelect: 1,
          },
          { name: 'chave', type: 'text', required: true },
          { name: 'titulo', type: 'text', required: true },
          { name: 'descricao', type: 'text', required: false },
          { name: 'ordem', type: 'number', required: false },
          { name: 'url_externa', type: 'text', required: false },
          {
            name: 'arquivo',
            type: 'file',
            maxSelect: 1,
            maxSize: 52428800, // até 50 MB
            mimeTypes: ['application/pdf', 'application/zip', 'application/octet-stream'],
          },
          { name: 'nome_arquivo_custom', type: 'text', required: false },
          { name: 'ativo', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_poc_docs_ciclo_chave ON poc_documentos (ciclo, chave)',
          'CREATE INDEX idx_poc_docs_ciclo_ordem ON poc_documentos (ciclo, ordem)',
        ],
      })
      app.save(pocDocsCol)
    }

    // =========================================================================
    // 3. Criar coleção 'poc_cronograma' (Etapas do ciclo POCC - Art. 37-A, §5º)
    // =========================================================================
    let pocCronoCol
    try {
      pocCronoCol = app.findCollectionByNameOrId('poc_cronograma')
    } catch (_) {
      pocCronoCol = new Collection({
        name: 'poc_cronograma',
        type: 'base',
        listRule: '', // Público (Art. 38-A, I)
        viewRule: '',
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'ciclo', type: 'text', required: true },
          { name: 'numero_etapa', type: 'number', required: true }, // 1 a 5
          { name: 'titulo', type: 'text', required: true },
          { name: 'inciso_legal', type: 'text', required: false }, // "Art. 37-A, §5º, I", etc.
          { name: 'descricao', type: 'text', required: false },
          { name: 'periodo_estimado', type: 'text', required: false }, // "Março a Abril de 2026"
          {
            name: 'status_etapa',
            type: 'select',
            required: true,
            values: ['Concluída', 'Fase Ativa', 'Em Andamento', 'Pendente'],
            maxSelect: 1,
          },
          { name: 'observacoes', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_poc_crono_ciclo_etapa ON poc_cronograma (ciclo, numero_etapa)',
        ],
      })
      app.save(pocCronoCol)
    }

    // =========================================================================
    // 4. Criar coleção 'poc_manifestacoes' (Art. 37-A, §5º, I)
    //    Manifestação de Interesse não vinculante em ambiente autenticado
    // =========================================================================
    let pocManifCol
    try {
      pocManifCol = app.findCollectionByNameOrId('poc_manifestacoes')
    } catch (_) {
      pocManifCol = new Collection({
        name: 'poc_manifestacoes',
        type: 'base',
        // Usuário autenticado pode listar e ver as suas próprias manifestações,
        // ou operadores da TSB podem ver todas.
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'user_id',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
          },
          { name: 'protocolo', type: 'text', required: true }, // POCC-TSB-2026-XXXX
          { name: 'ciclo', type: 'text', required: true }, // 2026/2027
          { name: 'razao_social', type: 'text', required: true },
          { name: 'cnpj', type: 'text', required: true },
          { name: 'email', type: 'email', required: true },
          { name: 'telefone', type: 'text', required: false },
          { name: 'responsavel_nome', type: 'text', required: true },
          { name: 'autorizacao_anp', type: 'text', required: false },
          { name: 'capacidade_solicitada', type: 'number', required: true }, // m³/dia
          {
            name: 'modalidade',
            type: 'select',
            required: true,
            values: ['Firme Ordinário', 'Extraordinário', 'Interruptível'],
            maxSelect: 1,
          },
          { name: 'trecho', type: 'text', required: true },
          { name: 'ponto_recebimento', type: 'text', required: false },
          { name: 'ponto_entrega', type: 'text', required: false },
          { name: 'periodo_vigencia', type: 'text', required: false },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: [
              'Recebida - Em Análise',
              'Habilitada para Etapa II',
              'Em Ajuste Cadastral',
              'Indeferida',
            ],
            maxSelect: 1,
          },
          { name: 'observacoes_internas', type: 'text', required: false },
          { name: 'declaracao_anp_aceita', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_poc_manif_protocolo ON poc_manifestacoes (protocolo)',
          'CREATE INDEX idx_poc_manif_user_ciclo ON poc_manifestacoes (user_id, ciclo)',
          'CREATE INDEX idx_poc_manif_status ON poc_manifestacoes (status)',
        ],
      })
      app.save(pocManifCol)
    }

    // =========================================================================
    // 5. Criar coleção 'poc_propostas_vinculantes' (Art. 37-A §5º, III e Art. 38-A, II)
    //    Proposta Garantida Vinculante + LGPD (Representantes Legais + Garantia)
    // =========================================================================
    let pocPropCol
    try {
      pocPropCol = app.findCollectionByNameOrId('poc_propostas_vinculantes')
    } catch (_) {
      pocPropCol = new Collection({
        name: 'poc_propostas_vinculantes',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'user_id',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
          },
          {
            name: 'manifestacao_id',
            type: 'relation',
            required: false,
            collectionId: pocManifCol.id,
            maxSelect: 1,
          },
          { name: 'protocolo', type: 'text', required: true }, // PROP-TSB-2026-XXXX
          { name: 'ciclo', type: 'text', required: true },
          { name: 'razao_social', type: 'text', required: true },
          { name: 'cnpj', type: 'text', required: true },
          // LGPD Art. 7º, II: Representantes Legais só em ambiente autenticado
          { name: 'rep_legal_nome', type: 'text', required: true },
          { name: 'rep_legal_cpf', type: 'text', required: true },
          { name: 'rep_legal_rg', type: 'text', required: true },
          { name: 'rep_legal_endereco', type: 'text', required: true },
          { name: 'rep_legal_cargo', type: 'text', required: false },
          // Garantia Financeira (Art. 38-A, II)
          {
            name: 'garantia_tipo',
            type: 'select',
            required: true,
            values: ['Fiança Bancária', 'Seguro Garantia', 'Depósito Caução', 'Carta de Crédito'],
            maxSelect: 1,
          },
          { name: 'garantia_valor', type: 'number', required: true },
          { name: 'garantia_instituicao', type: 'text', required: false },
          { name: 'garantia_vigencia', type: 'text', required: false },
          {
            name: 'garantia_arquivo',
            type: 'file',
            maxSelect: 1,
            maxSize: 52428800,
            mimeTypes: ['application/pdf', 'application/zip'],
          },
          // Documentos societários e comprobatórios (upload)
          {
            name: 'documento_proposta',
            type: 'file',
            maxSelect: 1,
            maxSize: 52428800,
            mimeTypes: ['application/pdf', 'application/zip'],
          },
          // Parâmetros da Proposta Vinculante
          { name: 'capacidade_proposta', type: 'number', required: true },
          { name: 'tarifa_aceita', type: 'number', required: false },
          { name: 'trecho', type: 'text', required: true },
          { name: 'ponto_recebimento', type: 'text', required: false },
          { name: 'ponto_entrega', type: 'text', required: false },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: [
              'Proposta Recebida',
              'Garantia em Análise',
              'Capacidade Alocada (Art. 37-A, III)',
              'Aguardando Assinatura (Art. 37-A, IV)',
              'Contrato Celebrado e Enviado à ANP (Art. 37-A, V)',
              'Indeferida',
            ],
            maxSelect: 1,
          },
          { name: 'parecer_alocacao', type: 'text', required: false },
          { name: 'capacidade_alocada', type: 'number', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_poc_prop_protocolo ON poc_propostas_vinculantes (protocolo)',
          'CREATE INDEX idx_poc_prop_user_ciclo ON poc_propostas_vinculantes (user_id, ciclo)',
          'CREATE INDEX idx_poc_prop_status ON poc_propostas_vinculantes (status)',
        ],
      })
      app.save(pocPropCol)
    }

    // =========================================================================
    // 6. SEED DA DOCUMENTAÇÃO POCC (Art. 37-A, §2º) com URLs canônicas reais
    //    e MINUTA DO CONTRATO DE SERVIÇO DE TRANSPORTE
    // =========================================================================
    const docsSeed = [
      {
        ciclo: '2026/2027',
        categoria: 'edital',
        chave: 'edital_pocc_2026',
        titulo: 'Edital do Processo de Oferta e Contratação de Capacidade TSB 2026/2027',
        descricao:
          'Edital oficial de convocação pública e diretrizes regulatórias para oferta de capacidade firme em gasodutos existentes (Resolução ANP nº 961/2023, Art. 37-A).',
        ordem: 1,
        url_externa: 'https://www.tsb.com.br/poc/',
        nome_arquivo_custom: 'Edital POCC 2026/2027 (Oficial)',
        ativo: true,
      },
      {
        ciclo: '2026/2027',
        categoria: 'regulamento',
        chave: 'regulamento_pocc_2026',
        titulo: 'Regulamento do POCC — Regras Gerais, Habilitação e Alocação de Capacidade',
        descricao:
          'Regras operacionais, requisitos de habilitação, metodologia de alocação e garantias exigidas dos carregadores (Art. 38-A da Res. ANP nº 11/2016).',
        ordem: 2,
        url_externa: 'https://www.tsb.com.br/poc/',
        nome_arquivo_custom: 'Regulamento Geral do POCC',
        ativo: true,
      },
      {
        ciclo: '2026/2027',
        categoria: 'minuta_contrato_transporte',
        chave: 'minuta_contrato_transporte_2026',
        titulo: 'Minuta do Contrato de Serviço de Transporte Firme (Art. 37-A, §5º, IV)',
        descricao:
          'Minuta padrão do Contrato de Serviço de Transporte exigida pela Resolução ANP nº 961/2023 (substitui a designação imprópria de Contrato Master, restrito ao curto prazo pelo Art. 8º-A).',
        ordem: 3,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2025/03/CONTRATO-MASTER-TSB-2025-2029.pdf',
        nome_arquivo_custom: 'Minuta Contrato de Transporte (PDF)',
        ativo: true,
      },
      {
        ciclo: '2026/2027',
        categoria: 'proposta_tarifaria',
        chave: 'proposta_tarifaria_anp_2026',
        titulo:
          'Tarifas de Referência Homologadas pela ANP e Proposta Tarifária em Consulta Pública',
        descricao:
          'Proposta tarifária submetida à Consulta Pública Tarifária (Art. 37-A, §3º) e Tarifas de Referência aprovadas pela ANP para o ciclo (Art. 37-A, §5º, II).',
        ordem: 4,
        url_externa: 'https://www.tsb.com.br/wp-content/uploads/2023/04/termo_de_acesso.pdf',
        nome_arquivo_custom: 'Tarifas de Referência / Consulta Pública',
        ativo: true,
      },
      {
        ciclo: '2026/2027',
        categoria: 'procedimentos_operacionais',
        chave: 'procedimentos_operacionais_2026',
        titulo: 'Procedimentos Operacionais e Regras de Indicação/Nomeação de Capacidade',
        descricao:
          'Regulamento operacional de programação diária, tolerâncias, desbalanceamento e confirmação de fluxo físico nas estações.',
        ordem: 5,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2023/08/Termos-e-Condicoes-do-Contrato-Extraor.pdf',
        nome_arquivo_custom: 'Procedimentos Operacionais TSB',
        ativo: true,
      },
      {
        ciclo: '2026/2027',
        categoria: 'cronograma',
        chave: 'cronograma_detalhado_2026',
        titulo: 'Cronograma Detalhado do POCC e Prazos Preclusivos (Art. 38-A, I)',
        descricao:
          'Prazos e etapas do ciclo 2026/2027, alinhados com o calendário coordenado pela ANP e rito das cinco etapas do Art. 37-A, §5º.',
        ordem: 6,
        url_externa: 'https://www.tsb.com.br/poc/',
        nome_arquivo_custom: 'Cronograma do Ciclo 2026/2027',
        ativo: true,
      },
      {
        ciclo: '2026/2027',
        categoria: 'comunicados',
        chave: 'comunicados_oficiais_2026',
        titulo: 'Comunicados Oficiais, Circulares e Esclarecimentos da Comissão do POCC',
        descricao:
          'Divulgação periódica de comunicados oficiais sobre o andamento do ciclo, deliberações e notas técnicas explicativas.',
        ordem: 7,
        url_externa: 'https://www.tsb.com.br/poc/',
        nome_arquivo_custom: 'Caderno de Comunicados Oficiais',
        ativo: true,
      },
      {
        ciclo: '2026/2027',
        categoria: 'faq',
        chave: 'faq_pocc_2026',
        titulo: 'Perguntas Frequentes (FAQ) — Resoluções ANP nº 11/2016 e nº 961/2023',
        descricao:
          'Guia de dúvidas frequentes sobre autorização prévia da ANP, etapas do ciclo, garantias e contratação via plataforma eletrônica própria.',
        ordem: 8,
        url_externa: 'https://www.tsb.com.br/poc/',
        nome_arquivo_custom: 'Perguntas Frequentes (FAQ)',
        ativo: true,
      },
    ]

    const seedDocCollection = app.findCollectionByNameOrId('poc_documentos')
    for (let i = 0; i < docsSeed.length; i++) {
      const doc = docsSeed[i]
      try {
        const exist = app.findRecordsByFilter(
          'poc_documentos',
          "ciclo = '" + doc.ciclo + "' && chave = '" + doc.chave + "'",
          '-created',
          1,
          0,
        )
        if (exist.length === 0) {
          const rec = new Record(seedDocCollection)
          rec.set('ciclo', doc.ciclo)
          rec.set('categoria', doc.categoria)
          rec.set('chave', doc.chave)
          rec.set('titulo', doc.titulo)
          rec.set('descricao', doc.descricao)
          rec.set('ordem', doc.ordem)
          rec.set('url_externa', doc.url_externa)
          rec.set('nome_arquivo_custom', doc.nome_arquivo_custom)
          rec.set('ativo', doc.ativo)
          app.save(rec)
        }
      } catch (err) {
        console.log('Erro seed poc_documentos ' + doc.chave + ':', err)
      }
    }

    // =========================================================================
    // 7. SEED DO CRONOGRAMA LITERAL DAS 5 ETAPAS DO ART. 37-A, §5º (SEM LEILÃO)
    // =========================================================================
    const cronoSeed = [
      {
        ciclo: '2026/2027',
        numero_etapa: 1,
        titulo: 'I — Manifestação de Interesse Não Vinculante',
        inciso_legal: 'Art. 37-A, §5º, I',
        descricao:
          'Identificação dos potenciais Carregadores interessados e levantamento preliminar da demanda por capacidade nos pontos de conexão. Não gera vínculo contratual imediato.',
        periodo_estimado: 'Janeiro a Março de 2026',
        status_etapa: 'Fase Ativa',
        observacoes: 'Submissão eletrônica no Portal POC sob autenticação do Carregador.',
      },
      {
        ciclo: '2026/2027',
        numero_etapa: 2,
        titulo: 'II — Aprovação das Tarifas de Referência pela ANP e Redistribuição da Capacidade',
        inciso_legal: 'Art. 37-A, §5º, II',
        descricao:
          'Homologação pela ANP da tarifa de referência aplicável (após Consulta Pública Tarifária — Art. 37-A, §3º) e eventual redistribuição preliminar da capacidade ofertada caso a demanda supere o disponível.',
        periodo_estimado: 'Abril a Junho de 2026',
        status_etapa: 'Pendente',
        observacoes: 'Inclui área de Consulta Pública Tarifária e publicação dos pareceres ANP.',
      },
      {
        ciclo: '2026/2027',
        numero_etapa: 3,
        titulo: 'III — Análise das Propostas Garantidas Vinculantes e Alocação de Capacidade',
        inciso_legal: 'Art. 37-A, §5º, III',
        descricao:
          'Submissão de propostas vinculantes firmes acompanhadas de garantia financeira idônea (Art. 38-A, II), seguida de análise pela TSB e alocação final da capacidade.',
        periodo_estimado: 'Julho a Agosto de 2026',
        status_etapa: 'Pendente',
        observacoes:
          'Exige apresentação de dados de Representantes Legais e garantia no ambiente autenticado.',
      },
      {
        ciclo: '2026/2027',
        numero_etapa: 4,
        titulo: 'IV — Celebração dos Contratos e Apresentação das Garantias',
        inciso_legal: 'Art. 37-A, §5º, IV',
        descricao:
          'Formalização dos Contratos de Serviço de Transporte e Contrato Master (para curto prazo, Art. 8º-A) entre a TSB e os Carregadores habilitados com a alocação homologada.',
        periodo_estimado: 'Setembro a Outubro de 2026',
        status_etapa: 'Pendente',
        observacoes: 'Assinatura digital e validação das garantias de execução.',
      },
      {
        ciclo: '2026/2027',
        numero_etapa: 5,
        titulo: 'V — Envio dos Contratos para Registro na ANP',
        inciso_legal: 'Art. 37-A, §5º, V',
        descricao:
          'Encaminhamento protocolar de todos os contratos celebrados para o devido registro e homologação final perante a ANP (Art. 26 da Resolução ANP nº 11/2016).',
        periodo_estimado: 'Novembro a Dezembro de 2026',
        status_etapa: 'Pendente',
        observacoes: 'Encerramento formal do ciclo e publicação do Resultado Final.',
      },
    ]

    const seedCronoCollection = app.findCollectionByNameOrId('poc_cronograma')
    for (let j = 0; j < cronoSeed.length; j++) {
      const c = cronoSeed[j]
      try {
        const exist = app.findRecordsByFilter(
          'poc_cronograma',
          "ciclo = '" + c.ciclo + "' && numero_etapa = " + c.numero_etapa,
          '-created',
          1,
          0,
        )
        if (exist.length === 0) {
          const rec = new Record(seedCronoCollection)
          rec.set('ciclo', c.ciclo)
          rec.set('numero_etapa', c.numero_etapa)
          rec.set('titulo', c.titulo)
          rec.set('inciso_legal', c.inciso_legal)
          rec.set('descricao', c.descricao)
          rec.set('periodo_estimado', c.periodo_estimado)
          rec.set('status_etapa', c.status_etapa)
          rec.set('observacoes', c.observacoes)
          app.save(rec)
        }
      } catch (err) {
        console.log('Erro seed poc_cronograma etapa ' + c.numero_etapa + ':', err)
      }
    }
  },
  (app) => {
    try {
      const colProp = app.findCollectionByNameOrId('poc_propostas_vinculantes')
      app.delete(colProp)
    } catch (_) {}
    try {
      const colManif = app.findCollectionByNameOrId('poc_manifestacoes')
      app.delete(colManif)
    } catch (_) {}
    try {
      const colCrono = app.findCollectionByNameOrId('poc_cronograma')
      app.delete(colCrono)
    } catch (_) {}
    try {
      const colDocs = app.findCollectionByNameOrId('poc_documentos')
      app.delete(colDocs)
    } catch (_) {}
  },
)
