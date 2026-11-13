# TruckPag BackOffice — atualização de SLA operacional

Esta atualização foi preparada a partir do código-fonte enviado e da estrutura do branch `refatoracao`.

## O que mudou
- Retirado o KPI numérico de SLA médio da fila operacional; as médias permanecem no Relatório Gerencial.
- Cards continuam exibindo a data/hora de abertura, tempo em aberto e data de retorno agendada.
- Incluído semáforo de risco baseado na média histórica da solicitação: verde abaixo de 65%, amarelo a partir de 65% e vermelho a partir de 90% da média.
- Cards são ordenados por risco relativo decrescente e, em empate, pela maior idade da demanda.
- Incluída mensagem inicial sugerida ao cliente no drawer, com botão para copiar.
- Mantido o campo de data prevista/retorno, inclusive para casos como Isenção.

## Prazo da mensagem
O texto usa `CUSTOMER_MESSAGE_ESTIMATED_DAYS = 30` em `js/config.js`. O texto chama esse prazo de **estimado** e informa que pode variar conforme análise e retorno do responsável. Antes de usar com clientes, confirme que 30 dias corridos é o prazo aprovado para cada tipo de solicitação; se houver prazos diferentes por categoria, devemos parametrizá-los por serviço.

## Como aplicar
1. Faça backup da pasta/repositório atual.
2. Copie os arquivos desta pasta para a pasta local do repositório `BackOffice3`, estando no branch `refatoracao`.
3. Abra `index.html` com Live Server.
4. Teste cadastro, edição, finalização, calendário/retorno agendado, filtros, relatórios, CSV e sincronização com planilha (preferencialmente em ambiente de teste).
5. Confira o Console e Network do navegador. Só depois faça commit/push e abra Pull Request para `main`.

## Observações técnicas
- O semáforo usa o SLA médio histórico por solicitação, calculado a partir das demandas concluídas. Se não houver histórico daquela solicitação, a barra fica sem referência e não deve ser interpretada como garantia de prazo.
- A mensagem é gerada para revisão e cópia; não é enviada automaticamente.
- O Google Apps Script não foi alterado nem auditado nesta entrega.
- Esta entrega altera a interface e o front-end. Validação no navegador e teste de sincronização continuam necessários antes de publicar.
