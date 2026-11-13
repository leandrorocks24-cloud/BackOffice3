# TruckPag Backoffice — estrutura organizada

## Estrutura

```text
truckpag-backoffice/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── config.js       # Constantes, catálogo DAF e dados históricos iniciais
│   ├── core.js         # Utilitários, estado, persistência, sincronização e SLA
│   ├── ui.js           # Renderização, filtros, drawer, formulários e relatórios
│   └── bootstrap.js    # Eventos globais e inicialização
└── README.md
```

## O que foi feito

- CSS e JavaScript foram retirados do HTML.
- JavaScript foi dividido por responsabilidade funcional.
- A ordem de carregamento foi definida explicitamente.
- O HTML e as funções existentes foram preservados para reduzir o risco de regressão.
- A integração atual com Google Apps Script, chaves de armazenamento, dados históricos, regras DAF e funcionalidades foram mantidos.

## Importante: segurança

Esta entrega é uma **primeira etapa de refatoração estrutural**, não uma certificação de segurança. Para manter compatibilidade, os `onclick`/`onchange` inline e o modelo global legado foram preservados.

Antes de usar com dados sensíveis ou ampliar o acesso da equipe, priorize:

1. **Backend como autoridade:** autenticação e autorização devem ser validadas no Google Apps Script (ou backend), nunca apenas pelo seletor de operador no navegador.
2. **Validar todas as mutações no servidor:** criar, editar, excluir e finalizar precisam validar campos, permissões, IDs e transições de status.
3. **Proteger o endpoint:** não tratar a URL do Apps Script como segredo. Exigir identidade/autorização no servidor, limitar origens quando aplicável e registrar auditoria.
4. **Prevenir XSS:** substituir concatenação de dados em `innerHTML` por `textContent`, `createElement` e atributos definidos de forma segura. Revisar especialmente dados vindos da planilha, nomes, descrições e links.
5. **Validar URLs:** aceitar somente `https:` para links externos e aplicar `rel="noopener noreferrer"` em links com `target="_blank"`.
6. **Tratar armazenamento local como não confiável:** dados do `localStorage` podem ser alterados pelo usuário; validar e normalizar ao carregar.
7. **Concorrência e integridade:** usar versão/`updatedAt` e controle de conflito no servidor para evitar sobrescrita entre operadores.
8. **CSP e eventos:** remover handlers inline, migrar para `addEventListener` e então aplicar uma Content Security Policy restritiva.
9. **Observabilidade:** centralizar erros de sincronização, tentativas pendentes e falhas de validação sem registrar dados pessoais desnecessários.

## Próxima etapa recomendada

A próxima refatoração deve introduzir módulos com interfaces explícitas, sem variáveis globais compartilhadas:

- `domain/`: regras de negócio, validações e cálculos de SLA.
- `data/`: repositório local, API do Sheets e fila de sincronização.
- `services/`: casos de uso de criação, edição, conclusão e exclusão.
- `ui/`: componentes de tela, formulários, drawer e relatórios.
- `app/`: inicialização e composição das dependências.

Essa migração deve ser feita em etapas, com testes de regressão para criação, edição, exclusão, sincronização, regras DAF e cálculo de SLA. Não altere simultaneamente regras de negócio e estrutura de módulos.
