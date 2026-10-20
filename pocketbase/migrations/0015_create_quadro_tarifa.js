migrate(
  (app) => {
    // 1. Criar coleção quadro_tarifa para o bloco de tarifa em destaque na página inicial
    let collection
    try {
      collection = app.findCollectionByNameOrId('quadro_tarifa')
    } catch (_) {
      collection = new Collection({
        name: 'quadro_tarifa',
        type: 'base',
        listRule: '', // Leitura pública para exibição na página inicial (/)
        viewRule: '', // Leitura pública
        createRule: "@request.auth.id != ''", // Edição/criação restrita a operadores autenticados
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'chave', type: 'text', required: true }, // 'principal' ou identificador do quadro
          { name: 'titulo', type: 'text', required: true },
          { name: 'texto_explicativo', type: 'text', required: true },
          { name: 'valor_mil_m3', type: 'text', required: true },
          { name: 'valor_mmbtu', type: 'text', required: true },
          { name: 'entrada_percentual', type: 'text', required: true }, // ex: "70% Entrada"
          { name: 'entrada_valor_mmbtu', type: 'text', required: true }, // ex: "1,1089"
          { name: 'entrada_valor_mil_m3', type: 'text', required: true }, // ex: "41,3628"
          { name: 'saida_percentual', type: 'text', required: true }, // ex: "30% Saída"
          { name: 'saida_valor_mmbtu', type: 'text', required: true }, // ex: "0,4775"
          { name: 'saida_valor_mil_m3', type: 'text', required: true }, // ex: "17,8122"
          { name: 'ativo', type: 'bool', required: false }, // bool flags NEVER required in PocketBase
          { name: 'ano_vigencia', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_quadro_tarifa_chave ON quadro_tarifa (chave)'],
      })
      app.save(collection)
    }

    // 2. Seed inicial idempotente com o conteúdo exato fornecido na imagem
    try {
      const existing = app.findRecordsByFilter(
        'quadro_tarifa',
        "chave = 'principal'",
        '-created',
        1,
        0,
      )
      if (existing.length === 0) {
        const seedCol = app.findCollectionByNameOrId('quadro_tarifa')
        const rec = new Record(seedCol)
        rec.set('chave', 'principal')
        rec.set('titulo', 'TARIFA CONTRATO EXTRAORDINÁRIO TRECHO T3 – 2026')
        rec.set(
          'texto_explicativo',
          'Tarifa ex-impostos para 2026, considerando a variação de -1,05% do IGP-M de 2025(55%) e de 4,26% do IPCA de 2025 (45%):',
        )
        rec.set('valor_mil_m3', '59,1750')
        rec.set('valor_mmbtu', '1,5864')
        rec.set('entrada_percentual', '70% Entrada')
        rec.set('entrada_valor_mmbtu', '1,1089')
        rec.set('entrada_valor_mil_m3', '41,3628')
        rec.set('saida_percentual', '30% Saída')
        rec.set('saida_valor_mmbtu', '0,4775')
        rec.set('saida_valor_mil_m3', '17,8122')
        rec.set('ativo', true)
        rec.set('ano_vigencia', '2026')
        app.save(rec)
      }
    } catch (e) {
      console.log('Erro ao inserir seed da tarifa:', e)
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('quadro_tarifa')
      app.delete(collection)
    } catch (_) {}
  },
)
