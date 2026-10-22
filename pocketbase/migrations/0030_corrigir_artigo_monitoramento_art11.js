/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration 0030: Correção normativa da referência do Monitoramento de Congestionamento
 *
 * O texto original da Resolução ANP nº 11/2016 prevê no seu Art. 11:
 * "O Transportador deve produzir relatórios mensais de monitoramento da utilização da capacidade
 * nos Pontos Relevantes e do Congestionamento Físico e Contratual da Instalação de Transporte..."
 *
 * Atualiza o cabeçalho 'monitoramento_congestionamento_header' e quaisquer registros em
 * 'transparencia_conteudo' onde conste "Art. 12" associado ao monitoramento, substituindo por "Art. 11".
 */
migrate(
  (app) => {
    // 1. Atualizar registro canônico de cabeçalho do monitoramento
    try {
      const registro = app.findFirstRecordByData(
        'transparencia_conteudo',
        'chave',
        'monitoramento_congestionamento_header',
      )
      registro.set(
        'titulo',
        'Relatório de Monitoramento de Utilização da Capacidade e Congestionamento',
      )
      registro.set('rotulo', 'Monitoramento • Art. 11')
      registro.set(
        'descricao',
        'Em cumprimento ao Art. 11 da Resolução ANP nº 11/2016, a TSB submete mensalmente à ANP e disponibiliza publicamente os relatórios de monitoramento de utilização de capacidade do sistema dutoviário (Art. 11, caput e §1º) após homologação pela ANP. Os relatórios retratam a consolidação do fluxo operacional e a verificação de eventuais congestionamentos físicos ou contratuais nos pontos de recepção e entrega dos Trechos 1 e 3 da malha dutoviária, assegurando ampla transparência ao mercado.',
      )
      app.save(registro)
    } catch (_) {
      // Se não encontrado por chave, ignora ou cria se necessário
    }

    // 2. Atualização idempotente via SQL para quaisquer outros textos contendo Art. 12 do monitoramento
    app
      .db()
      .newQuery(
        `UPDATE transparencia_conteudo
         SET descricao = REPLACE(descricao, 'Art. 12', 'Art. 11')
         WHERE descricao LIKE '%Art. 12%' AND (secao = 'monitoramento_congestionamento' OR chave = 'monitoramento_congestionamento_header')`,
      )
      .execute()

    app
      .db()
      .newQuery(
        `UPDATE transparencia_conteudo
         SET titulo = REPLACE(titulo, 'Art. 12', 'Art. 11')
         WHERE titulo LIKE '%Art. 12%' AND (secao = 'monitoramento_congestionamento' OR chave = 'monitoramento_congestionamento_header')`,
      )
      .execute()

    app
      .db()
      .newQuery(
        `UPDATE transparencia_conteudo
         SET rotulo = REPLACE(rotulo, 'Art. 12', 'Art. 11')
         WHERE rotulo LIKE '%Art. 12%' AND (secao = 'monitoramento_congestionamento' OR chave = 'monitoramento_congestionamento_header')`,
      )
      .execute()
  },
  (app) => {
    try {
      const registro = app.findFirstRecordByData(
        'transparencia_conteudo',
        'chave',
        'monitoramento_congestionamento_header',
      )
      registro.set(
        'titulo',
        'Monitoramento de Utilização da Capacidade e Congestionamento Físico e Contratual',
      )
      registro.set('rotulo', 'Boletim • Monitoramento Congestionamento')
      registro.set(
        'descricao',
        'Em cumprimento ao Art. 12 da Resolução ANP nº 11/2016, a TSB submete mensalmente à ANP e disponibiliza publicamente os relatórios de monitoramento de utilização de capacidade do sistema dutoviário (Art. 12, caput e §1º) após homologação pela ANP. Os relatórios retratam a consolidação do fluxo operacional e a verificação de eventuais congestionamentos físicos ou contratuais nos pontos de recepção e entrega dos Trechos 1 e 3 da malha dutoviária, assegurando ampla transparência ao mercado.',
      )
      app.save(registro)
    } catch (_) {}
  },
)
