# TruckPag BackOffice — atualização de regras de SLA e UX

Esta versão foi preparada a partir do ZIP `BackOffice3-refatoracao` enviado nesta conversa. A alteração é de front-end; o Google Apps Script não foi modificado.

## Regras de prazo

- **Pedágio / Cobrança fora da TAG:** prazo fixo de 10 dias corridos, calculado automaticamente a partir da abertura e não editável.
- **Pedágio / Contestação:** prazo fixo de 30 dias corridos, calculado automaticamente a partir da abertura e não editável.
- **Pedágio e Abastecimento / Isenção:** data de retorno obrigatória, informada manualmente pelo operador.
- **Pedágio / Integração API:** link do e-mail obrigatório; data de retorno opcional.
- **Demais solicitações:** data de retorno opcional, sem estimativa automática baseada em média histórica.

## SLA e acompanhamento

- O SLA médio real é recalculado a partir das demandas finalizadas.
- A fila principal não exibe média histórica nem indicador de risco para solicitações sem SLA oficial. Para Contestação e Cobrança fora da TAG, mostra o prazo oficial calculado desde a abertura.
- O menu lateral exibe o SLA médio histórico como referência, sem tratá-lo como prazo oficial, além do prazo fixo do parceiro quando aplicável. Isenção utiliza o histórico consolidado de Pedágio e Abastecimento.
- O Relatório Gerencial apresenta o SLA médio real e, para Contestação e Cobrança fora da TAG, também o prazo definido pelo parceiro.
- A fila permite ordenar as demandas abertas da mais antiga para a mais recente e vice-versa.
- O acompanhamento do relatório é organizado por produto e, em seguida, por solicitação.

## Mensagem ao cliente

A mensagem padronizada fica disponível somente no piloto de **Pedágio / Cobrança fora da TAG**. É gerada para revisão e cópia; não é enviada automaticamente. A placa é preenchida a partir da descrição, quando identificável; caso contrário, o texto apresenta `[PLACA]` para conferência manual.

## Como aplicar e validar

1. Faça backup da pasta/repositório atual.
2. Copie os arquivos desta pasta para o repositório local `BackOffice3`, estando no branch `refatoracao`.
3. Abra `index.html` com Live Server.
4. Teste cadastro, edição, finalização, prazos fixos, Isenção manual, Integração API, ordenação, relatório gerencial, histórico, CSV e sincronização com planilha (preferencialmente em ambiente de teste).
5. Confira o Console e a aba Network do navegador.
6. Só depois dos testes, faça commit/push e abra Pull Request para `main`.

## Observações técnicas

- Os arquivos JavaScript passaram pela verificação sintática do Node.js.
- A integridade do ZIP foi verificada.
- Não foi executado teste completo de navegador nem teste real de sincronização com o Google Sheets.
- O Google Apps Script não foi alterado nem auditado.


## Regras de acompanhamento e matriz de responsáveis

- Os cards em aberto exibem prazo e sinalização de SLA somente para solicitações com prazo oficial definido: Pedágio / Cobrança fora da TAG (10 dias corridos) e Pedágio / Contestação (30 dias corridos), contados da abertura.
- Solicitações sem SLA oficial não recebem alerta de atraso baseado em média histórica. Quando houver histórico, o menu lateral apresenta o SLA médio como referência, deixando explícito que não é prazo oficial.
- A fila possui alternância de ordenação entre demandas mais antigas e mais recentes. Os filtros principais ficam visíveis e os filtros complementares ficam agrupados em “Mais filtros”.
- A matriz gerencial consolida Isenção de Pedágio e Abastecimento em uma única linha e utiliza os responsáveis padronizados: Financeiro, MoveMais, T.I, Cadastro ou Outros, conforme a solicitação.
- Manutenção / Outros é a categoria coringa e sempre direciona o terceiro responsável para Outros.


## Melhorias desta versão (16/11/2026)

- Cards da fila redesenhados com hierarquia visual: cliente, solicitação, responsável, data de abertura, tempo em aberto e prazo oficial (quando houver). Solicitações sem SLA oficial exibem explicitamente “Não definido”, sem semáforo de atraso.
- Menu lateral reorganizado no acompanhamento, com data de abertura, tempo em aberto e prazo oficial em linhas identificadas.
- Relatório com alternância entre visão macro, visão por solicitação, histórico mensal e projeção indicativa de carga da fila. A projeção usa volume em aberto × média histórica e não é SLA oficial.
- Nova solicitação Pedágio / Exceção VPO: terceiro responsável MoveMais preenchido automaticamente; link do e-mail obrigatório; sem SLA definido e sem data de retorno obrigatória.
- Botão “Backup de Dados” exporta demandas, IDs excluídos e operações pendentes em JSON. Recomenda-se gerar backup antes de publicar e antes de alterações estruturais.

## Integridade e uso por três pessoas

A persistência atual continua usando Google Sheets como base remota, com cache local, tombstones e fila local de operações pendentes. O botão de backup é uma proteção adicional, não substitui a planilha nem constitui sincronização transacional. O Apps Script não foi auditado nesta alteração; antes de produção com três operadores simultâneos, validar concorrência de edição, geração de IDs, exclusões, reenvio de operações pendentes e conflitos de atualização no backend. Não limpar o armazenamento local nem substituir a planilha durante a publicação.


## Atualizações desta versão
- Navegação separada em Fila Operacional (somente abertas), Registros (finalizadas) e B.I.
- Ações de operador, exportação e nova demanda visíveis somente na Fila Operacional.
- Isenções exigem data de retorno ao Financeiro, exibida nos cards em aberto; orientar agendamento um dia antes do fechamento do cliente.
- Manutenção: solicitação Layout XML, com terceiro responsável T.I. (o antigo Chamado T.I passa a ser exibido como Layout XML na seleção e na análise gerencial).
- B.I. com navegação hierárquica Produto > Terceiro > Solicitação e gráfico mensal de SLA médio.
- Campos de data com calendário em tema claro.

## Revisão de experiência gerencial (Visão)
- A tela B.I foi consolidada em uma única página chamada **Visão**.
- Indicadores executivos por produto: volume concluído e SLA médio.
- Comparativo por parceiro: volume concluído e SLA médio.
- Detalhamento por solicitação: volume, SLA médio e SLA oficial quando houver regra formal (Pedágio/Contestação: 30 dias; Pedágio/Cobrança fora da TAG: 10 dias).
- A seção de fila atual apresenta volume em aberto por parceiro e por solicitação; não estima prazo de conclusão.
- Filtros de período, produto e parceiro atualizam a visão de demandas concluídas.
- Registros finalizados possuem filtros próprios por texto, produto, solicitação, terceiro, operador e intervalo de conclusão.
- Backup e exportação CSV foram movidos para o menu lateral; a barra superior mantém operador, sincronização e nova demanda.


## Atualização da Visão e prazos

- A área **Visão** apresenta resultados por produto, parceiro e solicitação.
- A **Projeção da fila** fica em uma área própria do menu lateral e apresenta somente o volume em aberto por parceiro e solicitação.
- Pedágio / Cobrança fora da TAG possui prazo oficial de **10 dias úteis**. O cálculo da data final desconsidera sábados, domingos e feriados nacionais (incluindo a Sexta-feira Santa); feriados estaduais e municipais não são contemplados.
- A área Registros apresenta SLA final, SLA médio histórico da mesma solicitação e SLA oficial quando aplicável.
- O tema claro/escuro pode ser alternado pelo ícone ao lado do operador e a escolha fica salva neste navegador.
- Retornos manuais de Isenção são contabilizados como dentro do prazo até o fim do dia agendado.
