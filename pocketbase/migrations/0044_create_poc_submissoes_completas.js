migrate(
  (app) => {
    // Criação da coleção unificada de submissões sequenciais completas do POC
    // Fluxo Único: Manifestação de Interesse (PDF assinado) + Proposta Garantida (PDF assinado + Comprovante de Garantia)
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    const col = new Collection({
      name: 'poc_submissoes_completas',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.role = 'admin')",
      viewRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.role = 'admin')",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.role = 'admin')",
      deleteRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.role = 'admin')",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: false,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'protocolo',
          type: 'text',
          required: true,
        },
        {
          name: 'ciclo',
          type: 'text',
          required: false,
        },
        {
          name: 'razao_social',
          type: 'text',
          required: true,
        },
        {
          name: 'cnpj',
          type: 'text',
          required: true,
        },
        {
          name: 'email',
          type: 'email',
          required: true,
        },
        {
          name: 'telefone',
          type: 'text',
          required: false,
        },
        {
          name: 'responsavel_nome',
          type: 'text',
          required: false,
        },
        {
          name: 'autorizacao_anp',
          type: 'text',
          required: false,
        },
        // Dados da Manifestação (Etapa 1)
        {
          name: 'capacidade_solicitada_manif',
          type: 'number',
          required: false,
        },
        {
          name: 'ponto_zona_manif',
          type: 'text',
          required: false,
        },
        {
          name: 'arquivo_manifestacao_assinada',
          type: 'file',
          maxSelect: 1,
          maxSize: 52428800,
          mimeTypes: ['application/pdf'],
          required: false,
        },
        {
          name: 'dados_manifestacao',
          type: 'json',
          maxSize: 2097152,
          required: false,
        },
        // Dados da Proposta Garantida (Etapa 2)
        {
          name: 'rep_legal_nome',
          type: 'text',
          required: false,
        },
        {
          name: 'rep_legal_cpf',
          type: 'text',
          required: false,
        },
        {
          name: 'produto_proposta',
          type: 'text',
          required: false,
        },
        {
          name: 'ponto_zona_proposta',
          type: 'text',
          required: false,
        },
        {
          name: 'capacidade_proposta',
          type: 'number',
          required: false,
        },
        {
          name: 'tarifa_aceita',
          type: 'number',
          required: false,
        },
        {
          name: 'criterio_leilao',
          type: 'text',
          required: false,
        },
        {
          name: 'capacidade_minima_leilao',
          type: 'number',
          required: false,
        },
        {
          name: 'garantia_tipo',
          type: 'select',
          values: ['Fiança Bancária', 'Seguro Garantia', 'Depósito Caução', 'Carta de Crédito'],
          maxSelect: 1,
          required: false,
        },
        {
          name: 'garantia_valor',
          type: 'number',
          required: false,
        },
        {
          name: 'garantia_instituicao',
          type: 'text',
          required: false,
        },
        {
          name: 'arquivo_garantia',
          type: 'file',
          maxSelect: 1,
          maxSize: 52428800,
          mimeTypes: ['application/pdf', 'application/zip', 'image/jpeg', 'image/png'],
          required: false,
        },
        {
          name: 'arquivo_proposta_assinada',
          type: 'file',
          maxSelect: 1,
          maxSize: 52428800,
          mimeTypes: ['application/pdf'],
          required: false,
        },
        {
          name: 'dados_proposta',
          type: 'json',
          maxSize: 2097152,
          required: false,
        },
        // Status e Metadados Regulatórios
        {
          name: 'status',
          type: 'select',
          values: [
            'Submetida',
            'Recebida - Em Análise de Documentos',
            'Garantia em Análise',
            'Habilitada para Etapa II',
            'Capacidade Alocada (Art. 37-A, III)',
            'Em Ajuste Cadastral',
            'Aguardando Assinatura de Contrato',
            'Contrato Celebrado e Enviado à ANP',
            'Indeferida',
          ],
          maxSelect: 1,
          required: false,
        },
        {
          name: 'origem',
          type: 'select',
          values: ['area_carregador', 'manual_interno', 'portal_web'],
          maxSelect: 1,
          required: false,
        },
        {
          name: 'observacoes_internas',
          type: 'text',
          required: false,
        },
        {
          name: 'parecer_fundamentado',
          type: 'text',
          required: false,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_poc_subcompletas_protocolo ON poc_submissoes_completas (protocolo)',
        'CREATE INDEX idx_poc_subcompletas_user ON poc_submissoes_completas (user_id)',
        'CREATE INDEX idx_poc_subcompletas_status_created ON poc_submissoes_completas (status, created DESC)',
      ],
    })

    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('poc_submissoes_completas')
      app.delete(col)
    } catch (_) {}
  },
)
