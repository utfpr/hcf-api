# Transcrição de evidências

O painel solicita o reconhecimento do áudio já guardado em `UPLOAD_PATH/evidencias`.
O aplicativo e o upload de evidências continuam usando o fluxo existente.

## Configuração do hcf-api

```dotenv
SPEECH_TO_TEXT_URL=http://stt-gateway:23000
SPEECH_TO_TEXT_CLIENT_ID=hcf-api
SPEECH_TO_TEXT_API_KEY=<chave emitida pelo gateway>
SPEECH_TO_TEXT_TIMEOUT_MS=75000
SPEECH_TO_TEXT_MAX_UPLOAD_MB=25
```

`SPEECH_TO_TEXT_URL` é a raiz do gateway, sem `/v1/transcriptions`.
Gere a chave no repositório speech-to-text com `npm run create-api-key -- hcf-api`,
usando o mesmo API_KEY_SECRET configurado no gateway. Nunca exponha essa chave no painel.
A ausência da configuração não impede a API de iniciar: somente novas transcrições retornam 503.

## Publicação

1. Aplique as migrações com `npm run migration:apply`.
2. Configure e publique a API; depois publique o painel.
3. Mantenha o limite de 25 MB alinhado ao MAX_UPLOAD_MB do gateway.
4. O timeout padrão do Speaches no gateway é 60 s, da API é 75 s e do painel 90 s.
   Configure os proxies para aguardar pelo menos 100 s (por exemplo proxy_read_timeout 100s no nginx).
5. Valide com um áudio real curto em homologação e confira os logs de duração/resultado.

A transcrição é síncrona. A reserva no banco dura ao menos 120 s e pode ser retomada
por uma nova solicitação quando vencer. Recarregar a página permite consultar o resultado
mesmo se o navegador desconectou. Não existe fila ou nova tentativa automática.

## Contrato

- GET /api/v1/evidencias/:id/transcricao: transcrição ou null; requer read Evidencia.
- POST no mesmo caminho: sem corpo; gera ou retorna resultado existente; requer update Evidencia.
- PATCH no mesmo caminho: { texto_revisado: string, versao: number }; requer update Evidencia.

O resultado contém status (processando/concluida/erro), texto_original, texto_revisado,
versao, dados do gerador/revisor, codigo_erro e processamento_expira_em.
A listagem de evidências inclui somente o resumo { status, versao } ou null.
O texto original não pode ser sobrescrito e o áudio não é alterado. Curadores e operadores
podem gerar e revisar; leitores autenticados podem consultar. Uma edição concorrente
retorna 409 e exige recarregar a versão antes de salvar novamente.

Falhas: 413 tamanho, 415 formato, 409 arquivo ausente/tentativa ativa/conflito de versão,
502 resposta inválida ou serviço indisponível, 503 configuração ausente e 504 timeout.
Sem texto reconhecido, a tentativa falha e pode ser refeita. Não são registrados texto,
áudio nem credenciais nos logs. A exclusão da evidência remove a transcrição em cascata.

## Banco de integração

O schema de bootstrap dos testes inclui a tabela nova. Para um banco de testes já existente,
aplique a migração apontando explicitamente para esse banco antes de executar os testes.
