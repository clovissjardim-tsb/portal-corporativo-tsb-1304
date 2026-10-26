migrate(
  (app) => {
    // 1. Criar coleção base 'transparencia_versoes'
    let collection
    try {
      collection = app.findCollectionByNameOrId('transparencia_versoes')
    } catch (_) {
      const conteudoCol = app.findCollectionByNameOrId('transparencia_conteudo')

      collection = new Collection({
        name: 'transparencia_versoes',
        type: 'base',
        listRule: '', // Leitura pública e livre (§1º e §2º do Art. 2º da Portaria ANP nº 1/2003)
        viewRule: '', // Leitura pública e livre
        createRule: "@request.auth.id != ''", // Edição restrita a autenticados
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'conteudo_id',
            type: 'relation',
            required: false,
            collectionId: conteudoCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'slot_chave', type: 'text', required: true }, // ex.: "alinea_a", "alinea_f", "contratos_transporte_documento"
          { name: 'titulo', type: 'text', required: true }, // Rótulo da versão ex.: "Vigência 2024–2025" ou "Versão 1.2"
          { name: 'data_versao', type: 'text', required: false }, // Data amigável ou formato ISO ex: "2024-10-15" ou "Outubro/2024"
          { name: 'descricao', type: 'text', required: false }, // Observação opcional sobre o documento arquivado
          { name: 'ordem', type: 'number', required: false }, // Ordenação das versões
          {
            name: 'arquivo',
            type: 'file',
            maxSelect: 1,
            maxSize: 52428800, // 50 MB
            mimeTypes: ['application/pdf', 'application/zip', 'application/octet-stream'],
          },
          { name: 'url_externa', type: 'text', required: false }, // Fallback de URL externa se arquivo não estiver no storage local
          { name: 'nome_arquivo_custom', type: 'text', required: false }, // Nome de exibição do link
          { name: 'ativo', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_transp_versoes_slot ON transparencia_versoes (slot_chave)',
          'CREATE INDEX idx_transp_versoes_conteudo ON transparencia_versoes (conteudo_id)',
          'CREATE INDEX idx_transp_versoes_data ON transparencia_versoes (data_versao)',
        ],
      })
      app.save(collection)
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('transparencia_versoes')
      app.delete(collection)
    } catch (_) {}
  },
)
