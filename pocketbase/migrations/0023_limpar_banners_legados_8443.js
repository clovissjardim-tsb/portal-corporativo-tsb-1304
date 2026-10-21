migrate(
  (app) => {
    // Limpeza de resquícios de cabeçalhos e links do sistema legado :8443
    // Desativar ou limpar campos de url_externa e nome_arquivo_custom legados na tabela transparencia_conteudo
    try {
      const recordsVII = app.findRecordsByFilter(
        'transparencia_conteudo',
        "chave = 'plataforma_inciso_vii_header' || (secao = 'plataforma_inciso' && chave = 'inciso_vii')",
      )
      for (let i = 0; i < recordsVII.length; i++) {
        const rec = recordsVII[i]
        rec.set('ativo', false)
        rec.set('url_externa', '')
        rec.set('nome_arquivo_custom', '')
        app.save(rec)
      }
    } catch (_) {}

    try {
      const recordsVIII = app.findRecordsByFilter(
        'transparencia_conteudo',
        "secao = 'plataforma_inciso' && chave = 'inciso_viii'",
      )
      for (let i = 0; i < recordsVIII.length; i++) {
        const rec = recordsVIII[i]
        rec.set('url_externa', '')
        rec.set('nome_arquivo_custom', '')
        app.save(rec)
      }
    } catch (_) {}
  },
  (app) => {
    // Reversão opcional (não requer restauração do sistema legado descontinuado)
    try {
      const recordsVII = app.findRecordsByFilter(
        'transparencia_conteudo',
        "chave = 'plataforma_inciso_vii_header' || (secao = 'plataforma_inciso' && chave = 'inciso_vii')",
      )
      for (let i = 0; i < recordsVII.length; i++) {
        const rec = recordsVII[i]
        rec.set('ativo', true)
        rec.set('url_externa', 'http://tsb.com.br:8443/Home/Solicitacao')
        rec.set('nome_arquivo_custom', 'Acessar sistema oficial alternativo TSB (:8443)')
        app.save(rec)
      }
    } catch (_) {}
  },
)
