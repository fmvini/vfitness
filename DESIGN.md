---
name: VFitness
description: Mural de estúdio acolhedor para organizar e registrar treinos.
colors:
  bg: "#f8f6f0"
  bg-elevated: "#f3efe5"
  bg-muted: "#e9ecdf"
  surface: "#fffdf8"
  border: "#dcded3"
  border-strong: "#b8c1b2"
  text: "#243b34"
  text-soft: "#40564e"
  text-muted: "#596b63"
  primary: "#b65439"
  primary-hover: "#98432e"
  on-primary: "#fffdf8"
  primary-soft: "#f6e7dd"
  primary-border: "#e3b7a4"
  danger: "#a43e34"
  danger-soft: "#fae7e4"
  success: "#3e6954"
  warning: "#a86b27"
  bg-dark: "#17241f"
  bg-elevated-dark: "#1f3028"
  bg-muted-dark: "#2b4035"
  surface-dark: "#22342b"
  border-dark: "#3b5445"
  border-strong-dark: "#65806b"
  text-dark: "#f4f1e6"
  text-soft-dark: "#e0e7da"
  text-muted-dark: "#b9cbb9"
  primary-dark: "#e18a68"
  primary-hover-dark: "#eda081"
  on-primary-dark: "#17241f"
  primary-soft-dark: "#493328"
  primary-border-dark: "#9c634e"
  danger-dark: "#f4a097"
  danger-soft-dark: "#4a302e"
  success-dark: "#a9d1ac"
  warning-dark: "#f2bd72"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.75rem, 5vw, 5.25rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-.025em"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(1.7rem, 2.3vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-.025em"
  title:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "1.15rem"
    lineHeight: 1.3
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "16px"
    lineHeight: 1.5
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: ".86rem"
    fontWeight: 700
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
spacing:
  "1": ".25rem"
  "2": ".5rem"
  "3": ".75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
  "10": "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    padding: ".73rem 1.18rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: ".73rem 1.18rem"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: ".72rem .9rem"
  workout-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "20px 22px"
  workout-card-today:
    backgroundColor: "{colors.primary-soft}"
    rounded: "{rounded.md}"
    padding: "20px 22px"
---

# Design System: VFitness

## Overview

**Creative North Star: "Mural do estúdio"**

O sistema usa a linguagem de um pequeno estúdio de bairro: papel quente, tinta verde escura e superfícies de apoio sálvia. A terracota identifica a próxima ação do treino. Títulos editoriais dão caráter à interface; controles e registros permanecem diretos e legíveis. Essa direção foi escolhida pelo usuário e aparece no painel implementado.

A composição varia conforme a tarefa. O destaque do treino atual recebe mais espaço e uma ilustração gravada decorativa; criação, listas, sessão e estatísticas usam formulários e dados reais. O tema escuro conserva a mesma hierarquia por meio das variáveis correspondentes.

**Key Characteristics:**
- Ação do treino atual em primeiro plano.
- Fraunces nos títulos de maior expressão; DM Sans nos controles e no corpo.
- Bordas discretas e superfícies tonais; cor de destaque reservada para ação e estado.
- Densidade ajustada entre painel, listas, formulários e sessão.

## Colors

Os valores normativos estão no frontmatter e correspondem às variáveis de `frontend/src/styles/theme.css`. As chaves com sufixo `-dark` são os valores do tema escuro, ativado por `data-theme='dark'`.

### Primary

- **Terracota:** `primary`, `primary-hover` e `on-primary` marcam botões principais, vínculos de destaque e a navegação ativa. `primary-soft` e `primary-border` destacam o treino de hoje na lista.

### Secondary

- **Verde de conclusão:** `success` colore o progresso e controles concluídos.
- **Vermelho de erro:** `danger` e `danger-soft` sinalizam remoção e falhas.
- **Âmbar de aviso:** `warning` está disponível como estado sem disputar com a ação principal.

### Neutral

- **Papel e sálvia:** `bg`, `bg-elevated`, `bg-muted` e `surface` separam fundo, destaque, apoio e painéis.
- **Tinta verde:** `text`, `text-soft` e `text-muted` sustentam a hierarquia de leitura.
- **Linhas:** `border` e `border-strong` delimitam cartões, campos e separadores.

**The Action Color Rule.** Use terracota para ações primárias e estados que pedem atenção; conclusão usa verde.

## Typography

**Display Font:** Fraunces (Georgia, serif).
**Body Font:** DM Sans (sans-serif).

**Character:** A serif dá presença editorial aos títulos e números principais; a sans mantém formulários, navegação e registro claros.

### Hierarchy

- **Display:** `display` define o título principal; títulos do destaque e da autenticação usam ajustes locais da mesma família.
- **Headline:** `headline` define títulos de seção; cartões de treino também usam Fraunces em tamanho local.
- **Title:** `title` define subtítulos de menor escala.
- **Body:** `body` sustenta leitura e preenchimento.
- **Label:** `label` identifica campos; micro-rótulos de destaque usam maiúsculas e espaçamento entre letras em regras locais.

## Layout

O conteúdo autenticado usa largura máxima de `1280px` e margens laterais de `24px` por lado. A navegação tem altura de `76px` no desktop. O painel usa duas colunas assimétricas para o treino do dia e o formulário; a lista abaixo usa duas colunas. O destaque tem altura mínima de `390px` e reserva espaço para a ilustração.

Em `1050px`, a lista passa a uma coluna e a grade de formulários se reduz. Em `760px`, o painel passa a uma coluna, a navegação quebra em duas linhas com links roláveis e formulários e métricas passam a uma coluna. Em `480px`, ações do destaque ocupam toda a largura e o cartão de treino empilha seu conteúdo. O documento mantém largura mínima de `320px`.

**The Next Workout Rule.** No painel, o treino atual e a ação para iniciá-lo precedem a lista da semana; a criação permanece visível ao lado no desktop.

## Elevation & Depth

O sistema separa planos principalmente com mudança de tom e bordas. `--shadow-sm` e `--shadow-md` existem em ambos os temas, mas não são usados pelos componentes atuais; não os trate como requisito de elevação dos cartões.

## Shapes

Controles e campos usam cantos levemente arredondados (`rounded.sm`); cartões de treino e sessão usam `rounded.md`; painéis amplos, estado vazio e formulário de autenticação usam `rounded.lg`. Indicadores como o número do exercício e o símbolo de criação são circulares. Bordas de uma unidade delimitam campos e cartões.

## Components

### Buttons

- **Primary:** fundo terracota, texto de alto contraste, canto pequeno, altura mínima de `44px`; escurece no hover e desce `1px` no estado ativo.
- **Secondary:** fundo transparente e borda neutra; ganha superfície clara no hover.
- **Text actions:** vínculo sublinhado para edição e navegação secundária; ação destrutiva usa a cor de erro.
- **Controles de apoio:** alternância de tema, saída e ações de exercício mantêm altura mínima de `44px`.
- **Focus:** o foco visível global usa contorno terracota de `3px` com afastamento de `3px`.

### Cards / Containers

- **Treino:** superfície clara, borda e canto médio; o treino atual recebe fundo e borda em terracota suave. Ações ficam em uma faixa inferior separada por linha.
- **Sessão:** cartão semelhante, com estado concluído em verde e fundo de apoio.
- **Destaque do dia:** painel maior de papel elevado, com uma coluna para texto e ações e outra para a ilustração completa do equipamento. No tema escuro, a ilustração usa um arquivo próprio de traços claros sobre fundo transparente.
- **Estatística:** superfície com linha superior mais forte e números em Fraunces.

### Inputs / Fields

Campos têm fundo de superfície, borda neutra forte, canto pequeno e altura mínima de `46px`. No foco, borda terracota e anel suave acompanham o contorno visível. Rótulos ficam acima dos campos.

### Navigation

Barra de superfície clara com símbolo e nome VFitness. Links são discretos em repouso, escurecem no hover e indicam a página atual com uma linha terracota inferior. Em telas estreitas, os links ocupam uma linha rolável abaixo da marca e dos controles de conta.

O símbolo segue o esboço fornecido pelo usuário: um V creme de traço contínuo cuja subida direita sustenta as duas barras terracota do F, sobre tinta verde. Na área autenticada, nome de usuário e saída ficam juntos; o controle de tema encerra a barra à direita. O tema claro é o padrão para quem ainda não escolheu um tema.

### Dias e consentimento

O formulário de treino apresenta os sete dias como opções independentes, permitindo qualquer combinação. Páginas legais usam a mesma tipografia e largura de leitura confortável. O aviso de cookies oferece ações equivalentes para aceitar e rejeitar opcionais, com acesso posterior pelo rodapé.

### Segmented controls

Seleção de tipo de atividade e período usa fundo sálvia, borda neutra e opções com altura mínima de `44px`. A opção ativa aparece sobre a superfície clara. As opções de séries na sessão seguem a mesma altura mínima.

## Do's and Don'ts

### Do:

- **Do** manter o treino e a próxima ação visíveis antes de métricas ou gestão no painel.
- **Do** usar variáveis semânticas de `theme.css` para que os dois temas preservem hierarquia e contraste.
- **Do** manter controles de sessão com estados explícitos de foco, conclusão e erro.

### Don't:

- **Don't** transformar a ilustração do destaque em dado ou controle; ela é decorativa.
- **Don't** apresentar números ilustrativos como progresso real do usuário.
- **Don't** aplicar sombras aos cartões como regra geral; a implementação atual usa tom e borda para separá-los.
