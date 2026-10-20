migrate(
  (app) => {
    // 1. Criar coleção base 'transparencia_conteudo'
    let collection
    try {
      collection = app.findCollectionByNameOrId('transparencia_conteudo')
    } catch (_) {
      collection = new Collection({
        name: 'transparencia_conteudo',
        type: 'base',
        listRule: '', // Leitura pública e livre (Portaria ANP nº 1/2003 e Resolução ANP nº 11/2016)
        viewRule: '', // Leitura pública e livre
        createRule: "@request.auth.id != ''", // Edição restrita a operadores autenticados
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'secao',
            type: 'select',
            required: true,
            values: ['boletim_master', 'boletim_secao1', 'boletim_secao2', 'plataforma_inciso'],
            maxSelect: 1,
          },
          { name: 'chave', type: 'text', required: true }, // ex.: "contrato_master", "alinea_a", "mes_2026_09", "inciso_i"
          { name: 'titulo', type: 'text', required: true },
          { name: 'rotulo', type: 'text', required: false }, // ex.: "a)", "Inciso I", "Contrato Master"
          { name: 'descricao', type: 'text', required: false },
          { name: 'ordem', type: 'number', required: false },
          { name: 'url_externa', type: 'text', required: false },
          {
            name: 'arquivo',
            type: 'file',
            maxSelect: 1,
            maxSize: 52428800, // até 50 MB para relatórios e manuais em PDF
            mimeTypes: ['application/pdf', 'application/zip', 'application/octet-stream'],
          },
          { name: 'nome_arquivo_custom', type: 'text', required: false }, // rótulo do link (ex: "Baixar Arquivo")
          { name: 'ativo', type: 'bool', required: false },
          { name: 'ano', type: 'text', required: false }, // Para Seção II
          { name: 'mes', type: 'text', required: false }, // Para Seção II
          { name: 'chave_periodo', type: 'text', required: false }, // ex: "2026-09"
          { name: 'url_secundaria', type: 'text', required: false }, // ex.: fluxo físico de f) ou Trecho 3 de V
          { name: 'nome_url_secundaria', type: 'text', required: false },
          {
            name: 'arquivo_secundario',
            type: 'file',
            maxSelect: 1,
            maxSize: 52428800,
            mimeTypes: ['application/pdf'],
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_transparencia_secao_chave ON transparencia_conteudo (secao, chave)',
          'CREATE INDEX idx_transparencia_secao_ordem ON transparencia_conteudo (secao, ordem)',
          'CREATE INDEX idx_transparencia_periodo ON transparencia_conteudo (chave_periodo)',
        ],
      })
      app.save(collection)
    }

    // 2. Seed inicial idempotente com dados canônicos
    const seedCol = app.findCollectionByNameOrId('transparencia_conteudo')

    const itensIniciais = [
      // -------------------------------------------------------------------------
      // BOLETIM MASTER
      // -------------------------------------------------------------------------
      {
        secao: 'boletim_master',
        chave: 'contrato_master',
        rotulo: 'Contrato Master',
        titulo:
          'Modelo de Contrato Master de Transporte Firme para períodos de curto prazo e anuais',
        descricao:
          'Estabelece os procedimentos para o envio das informações referentes às atividades de transporte e de compra e venda de gás natural ao mercado, aos Carregadores e à Agência Nacional do Petróleo - ANP.',
        ordem: 1,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2025/03/CONTRATO-MASTER-TSB-2025-2029.pdf',
        nome_arquivo_custom: 'Baixar Arquivo',
        ativo: true,
      },

      // -------------------------------------------------------------------------
      // BOLETIM SEÇÃO I: alíneas a) até j)
      // -------------------------------------------------------------------------
      {
        secao: 'boletim_secao1',
        chave: 'alinea_a',
        rotulo: 'a)',
        titulo: 'Termos e condições gerais de prestação de serviço',
        descricao:
          'Termos e condições gerais aplicáveis à contratação extraordinária e serviços de transporte dutoviário.',
        ordem: 1,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2023/08/Termos-e-Condicoes-do-Contrato-Extraor.pdf',
        nome_arquivo_custom: '- Baixar Arquivo',
        ativo: true,
      },
      {
        secao: 'boletim_secao1',
        chave: 'alinea_b',
        rotulo: 'b)',
        titulo: 'Modelo de contrato para cada tipo de serviço',
        descricao:
          'Modelo de contrato de serviço de transporte conforme regulamentação da Portaria ANP nº 1/2003.',
        ordem: 2,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2025/03/CONTRATO-MASTER-TSB-2025-2029.pdf',
        nome_arquivo_custom: '- Baixar Arquivo',
        ativo: true,
      },
      {
        secao: 'boletim_secao1',
        chave: 'alinea_c',
        rotulo: 'c)',
        titulo: 'Modelo de acordo de conexão',
        descricao:
          'Minuta de acordo operacional de conexão física às instalações de transporte dutoviário.',
        ordem: 3,
        url_externa: 'https://www.tsb.com.br/wp-content/uploads/2023/04/bibArq000435.pdf',
        nome_arquivo_custom: '- Baixar Arquivo',
        ativo: true,
      },
      {
        secao: 'boletim_secao1',
        chave: 'alinea_d',
        rotulo: 'd)',
        titulo:
          'Modelo de Acordo Operativo de alocação das quantidades de gás nas estações de entrega',
        descricao: 'Procedimentos de rateio, alocação operacional e balanço diário nas EMEDs.',
        ordem: 4,
        url_externa: 'https://www.tsb.com.br/wp-content/uploads/2023/04/bibArq000436.pdf',
        nome_arquivo_custom: '- Baixar Arquivo',
        ativo: true,
      },
      {
        secao: 'boletim_secao1',
        chave: 'alinea_e',
        rotulo: 'e)',
        titulo: 'Mapa atualizado das instalações de transporte',
        descricao:
          'Diagrama unifilar e mapa georreferenciado das instalações dos Trechos 1 e 3 da TSB.',
        ordem: 5,
        url_externa: 'https://www.tsb.com.br/wp-content/uploads/2023/04/bibArq000437.pdf',
        nome_arquivo_custom: '- Baixar Arquivo',
        ativo: true,
      },
      {
        secao: 'boletim_secao1',
        chave: 'alinea_f',
        rotulo: 'f)',
        titulo:
          'Características Físicas e Capacidade Máxima das Instalações de Transporte, nas melhores condições operacionais',
        descricao:
          'Especificações técnicas, diâmetros, pressões de projeto e fluxos físicos do sistema dutoviário.',
        ordem: 6,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2024/10/bol_ele_-I.f-_caracteristicas-.pdf',
        nome_arquivo_custom: '- Características',
        url_secundaria:
          'https://www.tsb.com.br/wp-content/uploads/2024/10/bol_ele_item-I.f_-fluxos-fisicos.pdf',
        nome_url_secundaria: '- Fluxos Físicos do Gás Natural',
        ativo: true,
      },
      {
        secao: 'boletim_secao1',
        chave: 'alinea_g',
        rotulo: 'g)',
        titulo:
          'Capacidade Disponível para Prestação de Novos Serviços de Transporte Firme nas melhores condições operacionais',
        descricao:
          'Demonstrativo de capacidade disponível e saldo remanescente nos pontos de recepção e entrega.',
        ordem: 7,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2024/10/bol_elet_I_g-cap-disponivel.pdf',
        nome_arquivo_custom: '- Baixar Arquivo',
        ativo: true,
      },
      {
        secao: 'boletim_secao1',
        chave: 'alinea_h',
        rotulo: 'h)',
        titulo:
          'Quantidades Programadas e Realizadas de Gás nos pontos de recepção e entrega (dados diários, referentes ao mês anterior)',
        descricao:
          'Consultar Tabela no item "Quantidades realizadas de gás nos pontos de recepção e entrega" constante na Seção II.',
        ordem: 8,
        url_externa: '#secao-ii-quantidades',
        nome_arquivo_custom: 'Ver relatórios na Seção II',
        ativo: true,
      },
      {
        secao: 'boletim_secao1',
        chave: 'alinea_i',
        rotulo: 'i)',
        titulo: 'Interrupções e Reduções de Capacidade, atuais e planejadas, no sistema',
        descricao:
          'Cronograma e comunicados oficiais de manutenção preventiva e paradas operacionais programadas.',
        ordem: 9,
        url_externa: 'https://www.tsb.com.br/wp-content/uploads/2023/04/bibArq000440.pdf',
        nome_arquivo_custom: '- Baixar Arquivo',
        ativo: true,
      },
      {
        secao: 'boletim_secao1',
        chave: 'alinea_j',
        rotulo: 'j)',
        titulo: 'Ampliações Planejadas',
        descricao:
          'Projetos e ampliações planejadas para a malha da Transportadora Sulbrasileira de Gás.',
        ordem: 10,
        url_externa: 'https://www.tsb.com.br/wp-content/uploads/2023/08/Ampliacoes-Planejadas.pdf',
        nome_arquivo_custom: '- Baixar Arquivo',
        ativo: true,
      },

      // -------------------------------------------------------------------------
      // BOLETIM SEÇÃO II: Relatórios com URLs conhecidas diretas
      // -------------------------------------------------------------------------
      {
        secao: 'boletim_secao2',
        chave: 'mes_2026_09',
        rotulo: 'Setembro/2026',
        titulo:
          'Quantidades programadas e realizadas nos pontos de recepção e entrega -Setembro/2026',
        ordem: 1,
        ano: '2026',
        mes: 'Setembro',
        chave_periodo: '2026-09',
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2026/10/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Setembro26-1.pdf',
        nome_arquivo_custom:
          'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Setembro26-1.pdf',
        ativo: true,
      },
      {
        secao: 'boletim_secao2',
        chave: 'mes_2026_08',
        rotulo: 'Agosto/2026',
        titulo:
          'Quantidades programadas e realizadas nos pontos de recepção e entrega -Agosto/2026',
        ordem: 2,
        ano: '2026',
        mes: 'Agosto',
        chave_periodo: '2026-08',
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2026/09/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Agosto26-2.pdf',
        nome_arquivo_custom:
          'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Agosto26-2.pdf',
        ativo: true,
      },
      {
        secao: 'boletim_secao2',
        chave: 'mes_2026_07',
        rotulo: 'Julho/2026',
        titulo: 'Quantidades programadas e realizadas nos pontos de recepção e entrega -Julho/2026',
        ordem: 3,
        ano: '2026',
        mes: 'Julho',
        chave_periodo: '2026-07',
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2026/08/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Julho26-2.pdf',
        nome_arquivo_custom:
          'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Julho26-2.pdf',
        ativo: true,
      },
      {
        secao: 'boletim_secao2',
        chave: 'mes_2026_06',
        rotulo: 'Junho/2026',
        titulo: 'Quantidades programadas e realizadas nos pontos de recepção e entrega -Junho/2026',
        ordem: 4,
        ano: '2026',
        mes: 'Junho',
        chave_periodo: '2026-06',
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2026/07/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Junho26-1.pdf',
        nome_arquivo_custom:
          'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Junho26-1.pdf',
        ativo: true,
      },
      {
        secao: 'boletim_secao2',
        chave: 'mes_2026_05',
        rotulo: 'Maio/2026',
        titulo: 'Quantidades programadas e realizadas nos pontos de recepção e entrega -Maio/2026',
        ordem: 5,
        ano: '2026',
        mes: 'Maio',
        chave_periodo: '2026-05',
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2026/06/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Maio26.pdf',
        nome_arquivo_custom:
          'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Maio26.pdf',
        ativo: true,
      },
      {
        secao: 'boletim_secao2',
        chave: 'mes_2026_04',
        rotulo: 'Abril/2026',
        titulo: 'Quantidades programadas e realizadas nos pontos de recepção e entrega -Abril/2026',
        ordem: 6,
        ano: '2026',
        mes: 'Abril',
        chave_periodo: '2026-04',
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2026/05/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Abril26.pdf',
        nome_arquivo_custom:
          'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Abril26.pdf',
        ativo: true,
      },
      {
        secao: 'boletim_secao2',
        chave: 'mes_2026_03',
        rotulo: 'Março/2026',
        titulo: 'Quantidades programadas e realizadas nos pontos de recepção e entrega -Março/2026',
        ordem: 7,
        ano: '2026',
        mes: 'Março',
        chave_periodo: '2026-03',
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2026/04/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Marco26.pdf',
        nome_arquivo_custom:
          'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Marco26.pdf',
        ativo: true,
      },
      {
        secao: 'boletim_secao2',
        chave: 'mes_2026_02',
        rotulo: 'Fevereiro/2026',
        titulo:
          'Quantidades programadas e realizadas nos pontos de recepção e entrega -Fevereiro/2026',
        ordem: 8,
        ano: '2026',
        mes: 'Fevereiro',
        chave_periodo: '2026-02',
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2026/03/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Fevereiro26.pdf',
        nome_arquivo_custom:
          'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Fevereiro26.pdf',
        ativo: true,
      },
      {
        secao: 'boletim_secao2',
        chave: 'mes_2026_01',
        rotulo: 'Janeiro/2026',
        titulo:
          'Quantidades programadas e realizadas nos pontos de recepção e entrega -Janeiro/2026',
        ordem: 9,
        ano: '2026',
        mes: 'Janeiro',
        chave_periodo: '2026-01',
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2026/02/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Janeiro26.pdf',
        nome_arquivo_custom:
          'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Janeiro26.pdf',
        ativo: true,
      },
      {
        secao: 'boletim_secao2',
        chave: 'mes_2025_12',
        rotulo: 'Dezembro/2025',
        titulo:
          'Quantidades programadas e realizadas nos pontos de recepção e entrega -Dezembro/2025',
        ordem: 10,
        ano: '2025',
        mes: 'Dezembro',
        chave_periodo: '2025-12',
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2026/01/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Dezembro25.pdf',
        nome_arquivo_custom:
          'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Dezembro25.pdf',
        ativo: true,
      },
      {
        secao: 'boletim_secao2',
        chave: 'mes_2025_11',
        rotulo: 'Novembro/2025',
        titulo:
          'Quantidades programadas e realizadas nos pontos de recepção e entrega -Novembro/2025',
        ordem: 11,
        ano: '2025',
        mes: 'Novembro',
        chave_periodo: '2025-11',
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2025/12/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Novembro25.pdf',
        nome_arquivo_custom:
          'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Novembro25.pdf',
        ativo: true,
      },

      // -------------------------------------------------------------------------
      // PLATAFORMA ELETRÔNICA: Incisos I a VIII
      // -------------------------------------------------------------------------
      {
        secao: 'plataforma_inciso',
        chave: 'inciso_i',
        rotulo: 'I',
        titulo: 'I - Fluxo Físico',
        descricao:
          'Informações sobre fluxos físicos no sistema de transporte da Transportadora Sulbrasileira de Gás.',
        ordem: 1,
        url_externa: 'https://tsb.com.br/wp-content/uploads/2023/04/fluxo_fisico.pdf',
        nome_arquivo_custom: '- Baixar Arquivo',
        ativo: true,
      },
      {
        secao: 'plataforma_inciso',
        chave: 'inciso_ii',
        rotulo: 'II',
        titulo: 'II - Características técnicas e operacionais de Instalação de Transporte',
        descricao:
          'Descrição técnica detalhada, parâmetros de operação e instalações dos gasodutos TSB.',
        ordem: 2,
        url_externa: 'https://tsb.com.br/wp-content/uploads/2023/04/bibArq000438-2.pdf',
        nome_arquivo_custom: '- Baixar Arquivo',
        ativo: true,
      },
      {
        secao: 'plataforma_inciso',
        chave: 'inciso_iii',
        rotulo: 'III',
        titulo:
          'III - Capacidade disponível, capacidade em fluxo oposto ao fluxo físico e capacidade ociosa por ponto relevante',
        descricao:
          'Demonstrativo de capacidade disponível e fluxo oposto por ponto relevante de entrega e recepção.',
        ordem: 3,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2023/08/Capacidade-Disponivel-SITE.pdf',
        nome_arquivo_custom: '- Baixar Arquivo',
        ativo: true,
      },
      {
        secao: 'plataforma_inciso',
        chave: 'inciso_iv',
        rotulo: 'IV',
        titulo: 'IV - Capacidades contratadas por contrato de serviço de transporte celebrado',
        descricao:
          'Relação das capacidades contratadas por ponto de recepção e entrega para cada contrato celebrado.',
        ordem: 4,
        url_externa: 'https://www.tsb.com.br/wp-content/uploads/2023/08/Capacidade-gasoduto-A.pdf',
        nome_arquivo_custom: '- Baixar Arquivo',
        ativo: true,
      },
      {
        secao: 'plataforma_inciso',
        chave: 'inciso_v',
        rotulo: 'V',
        titulo: 'V - Simulação termo-hidráulica',
        descricao:
          'Estudos e relatórios de simulação termo-hidráulica para os Trechos 1 e 3 do sistema dutoviário.',
        ordem: 5,
        url_externa: 'https://tsb.com.br/wp-content/uploads/2023/04/RSTH-Trecho-1.pdf',
        nome_arquivo_custom: 'Simulação Trecho 1 (PDF)',
        url_secundaria: 'https://tsb.com.br/wp-content/uploads/2023/04/RSTH-Trecho-3.pdf',
        nome_url_secundaria: 'Simulação Trecho 3 (PDF)',
        ativo: true,
      },
      {
        secao: 'plataforma_inciso',
        chave: 'inciso_vi',
        rotulo: 'VI',
        titulo: 'VI - Termos e condições tarifárias e não tarifárias',
        descricao:
          'Condições gerais tarifárias, prazos, penalidades e regras de acesso de terceiros à infraestrutura.',
        ordem: 6,
        url_externa: 'https://tsb.com.br/wp-content/uploads/2023/04/termo_de_acesso.pdf',
        nome_arquivo_custom: '- Baixar Arquivo',
        ativo: true,
      },
      {
        secao: 'plataforma_inciso',
        chave: 'inciso_vii',
        rotulo: 'VII',
        titulo: 'VII - Consulta de disponibilidade de acesso (Solicitação de Acesso)',
        descricao:
          'Envio público e direto sem necessidade de login prévio. Gera protocolo regulatório automático com confirmação via e-mail corporativo (SMTP TSB) e prazo legal de resposta de até 20 dias úteis para manifestação técnica e comercial fundamentada por escrito da transportadora.',
        ordem: 7,
        url_externa: 'http://tsb.com.br:8443/Home/Solicitacao',
        nome_arquivo_custom: 'Acessar sistema oficial alternativo TSB (:8443)',
        ativo: true,
      },
      {
        secao: 'plataforma_inciso',
        chave: 'inciso_viii',
        rotulo: 'VIII',
        titulo:
          'VIII - Resumo das Ofertas de Cessão de Capacidade Contratada Informadas ao Transportador por Carregadores',
        descricao:
          'Mecanismo de divulgação de ofertas de capacidade ociosa para cessão entre carregadores, promovendo o aproveitamento eficiente e secundário da malha dutoviária da TSB. Consulta e cadastro públicos de ofertas.',
        ordem: 8,
        url_externa: 'http://tsb.com.br:8443/Home/Ofertas',
        nome_arquivo_custom: 'Acessar sistema oficial alternativo TSB (:8443)',
        ativo: true,
      },
    ]

    for (let i = 0; i < itensIniciais.length; i++) {
      const item = itensIniciais[i]
      try {
        const existentes = app.findRecordsByFilter(
          'transparencia_conteudo',
          "secao = '" + item.secao + "' && chave = '" + item.chave + "'",
          '-created',
          1,
          0,
        )
        if (existentes.length === 0) {
          const rec = new Record(seedCol)
          rec.set('secao', item.secao)
          rec.set('chave', item.chave)
          rec.set('rotulo', item.rotulo || '')
          rec.set('titulo', item.titulo)
          rec.set('descricao', item.descricao || '')
          rec.set('ordem', item.ordem || 1)
          rec.set('url_externa', item.url_externa || '')
          rec.set('nome_arquivo_custom', item.nome_arquivo_custom || '')
          rec.set('ativo', item.ativo !== false)
          if (item.ano) rec.set('ano', item.ano)
          if (item.mes) rec.set('mes', item.mes)
          if (item.chave_periodo) rec.set('chave_periodo', item.chave_periodo)
          if (item.url_secundaria) rec.set('url_secundaria', item.url_secundaria)
          if (item.nome_url_secundaria) rec.set('nome_url_secundaria', item.nome_url_secundaria)
          app.save(rec)
        }
      } catch (e) {
        console.log('Erro ao inserir item seed ' + item.chave + ':', e)
      }
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('transparencia_conteudo')
      app.delete(collection)
    } catch (_) {}
  },
)
