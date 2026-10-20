migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('solicitacoes_inciso_vii')

    // 1. Atualizar opções do campo select 'modalidade' para incluir 'Troca Operacional'
    const campoModalidade = col.fields.getByName('modalidade')
    if (campoModalidade) {
      campoModalidade.values = ['Firme Ordinário', 'Interruptível', 'Troca Operacional']
      campoModalidade.maxSelect = 1
    }

    // 2. Atualizar opções do campo select 'status' para contemplar os 3 desfechos padronizados
    const campoStatus = col.fields.getByName('status')
    if (campoStatus) {
      campoStatus.values = [
        'Solicitação Recebida - Em Análise Técnica',
        'Em Análise Técnica',
        'Aguardando Documentação',
        'Aprovada',
        'Rejeitada',
        'Confirmação do Atendimento (Desfecho I)',
        'Aprofundamento da Análise (Desfecho II)',
        'Negativa Fundamentada (Desfecho III)',
      ]
      campoStatus.maxSelect = 1
    }

    // 3. ART. 10, IV: Pontos de Recebimento e Entrega separados
    if (!col.fields.getByName('ponto_recebimento')) {
      col.fields.add(
        new TextField({
          name: 'ponto_recebimento',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('ponto_entrega')) {
      col.fields.add(
        new TextField({
          name: 'ponto_entrega',
          required: false,
        }),
      )
    }

    // 4. ART. 10, §1º: Garantias de segurança e confiabilidade para Troca Operacional
    if (!col.fields.getByName('garantias_seguranca_swap')) {
      col.fields.add(
        new TextField({
          name: 'garantias_seguranca_swap',
          required: false,
        }),
      )
    }

    // 5. ART. 10, §2º, I: Termos e condições para Confirmação do Atendimento
    if (!col.fields.getByName('desfecho_tipo')) {
      col.fields.add(
        new SelectField({
          name: 'desfecho_tipo',
          required: false,
          values: ['CONFIRMACAO', 'APROFUNDAMENTO', 'NEGATIVA'],
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('termos_condicoes')) {
      col.fields.add(
        new TextField({
          name: 'termos_condicoes',
          required: false,
        }),
      )
    }

    // 6. ART. 10, §2º, II: Condições, escopo, cronograma e custos para Aprofundamento da Análise
    if (!col.fields.getByName('aprofundamento_condicoes')) {
      col.fields.add(
        new TextField({
          name: 'aprofundamento_condicoes',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('aprofundamento_escopo')) {
      col.fields.add(
        new TextField({
          name: 'aprofundamento_escopo',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('aprofundamento_cronograma')) {
      col.fields.add(
        new TextField({
          name: 'aprofundamento_cronograma',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('aprofundamento_custos')) {
      col.fields.add(
        new TextField({
          name: 'aprofundamento_custos',
          required: false,
        }),
      )
    }

    // 7. ART. 10, §2º: Previsão de disponibilidade para Negativa
    if (!col.fields.getByName('previsao_disponibilidade')) {
      col.fields.add(
        new TextField({
          name: 'previsao_disponibilidade',
          required: false,
        }),
      )
    }

    // 8. ART. 10, §3º: Cópia à ANP
    if (!col.fields.getByName('copia_anp_enviada')) {
      col.fields.add(
        new BoolField({
          name: 'copia_anp_enviada',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('copia_anp_data')) {
      col.fields.add(
        new TextField({
          name: 'copia_anp_data',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('copia_anp_destinatario')) {
      col.fields.add(
        new TextField({
          name: 'copia_anp_destinatario',
          required: false,
        }),
      )
    }

    // 9. ART. 10, §5º: Manifestação da Sulgás
    if (!col.fields.getByName('manifestacao_sulgas_status')) {
      col.fields.add(
        new SelectField({
          name: 'manifestacao_sulgas_status',
          required: false,
          values: ['Nao Aplicavel', 'Pendente', 'Recebida - Favoravel', 'Recebida - Com Ressalvas'],
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('manifestacao_sulgas_data')) {
      col.fields.add(
        new TextField({
          name: 'manifestacao_sulgas_data',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('manifestacao_sulgas_observacoes')) {
      col.fields.add(
        new TextField({
          name: 'manifestacao_sulgas_observacoes',
          required: false,
        }),
      )
    }

    // Permissões
    col.updateRule = "@request.auth.id != ''"
    col.viewRule = ''
    col.listRule = ''
    col.createRule = ''

    app.save(col)

    // Backfill retrocompatível para registros antigos sem ponto_recebimento/ponto_entrega
    try {
      const records = app.findRecordsByFilter(
        'solicitacoes_inciso_vii',
        'ponto_recebimento = "" || ponto_recebimento = null',
        '',
        100,
        0,
      )
      for (let i = 0; i < records.length; i++) {
        const r = records[i]
        const trechoAtual = r.getString('trecho') || ''
        if (trechoAtual.includes('Uruguaiana')) {
          r.set('ponto_recebimento', 'Paso de Los Libres / Uruguaiana')
          r.set('ponto_entrega', 'Triunfo (Polo Petroquímico)')
        } else if (trechoAtual.includes('Triunfo')) {
          r.set('ponto_recebimento', 'Triunfo (Polo Petroquímico)')
          r.set('ponto_entrega', 'Triunfo (Polo Petroquímico)')
        } else {
          r.set('ponto_recebimento', 'Paso de Los Libres')
          r.set('ponto_entrega', 'Triunfo (Polo Petroquímico)')
        }
        app.save(r)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('solicitacoes_inciso_vii')
      const nomes = [
        'ponto_recebimento',
        'ponto_entrega',
        'garantias_seguranca_swap',
        'desfecho_tipo',
        'termos_condicoes',
        'aprofundamento_condicoes',
        'aprofundamento_escopo',
        'aprofundamento_cronograma',
        'aprofundamento_custos',
        'previsao_disponibilidade',
        'copia_anp_enviada',
        'copia_anp_data',
        'copia_anp_destinatario',
        'manifestacao_sulgas_status',
        'manifestacao_sulgas_data',
        'manifestacao_sulgas_observacoes',
      ]
      for (let i = 0; i < nomes.length; i++) {
        const f = col.fields.getByName(nomes[i])
        if (f) col.fields.remove(f)
      }
      app.save(col)
    } catch (_) {}
  },
)
