# Contexto do Projeto: App Gerador de Relatórios de Resistência

## 1. Visão Geral
Este projeto é uma aplicação React Web destinada à coleta de dados técnicos (teste de resistência) e preenchimento de formulários cadastrais para gerar um relatório final. O público-alvo pode utilizar o sistema em campo via dispositivos móveis ou no escritório via desktop.

## 2. Tech Stack & Ferramentas
* **Core:** React (Functional Components).
* **Estilização:** CSS Modules.
* **Estado:** Context API.

## 3. Arquitetura e Padrões (SOLID & Clean Code)

Ao gerar código, siga estritamente estes princípios:

### S - Single Responsibility Principle (SRP)
* **Separação Lógica/UI:** Componentes (`.jsx`) devem se preocupar apenas com a renderização. Toda regra de negócio, cálculo de resistência ou manipulação de estado deve ser extraída para **Custom Hooks** (`useFormRelatorio`, `useCalculoResistencia`).
* **Atomicidade:** Crie componentes pequenos e isolados (ex: `InputResistencia`, `HeaderRelatorio`) em vez de formulários gigantes em um único arquivo.

### O - Open/Closed Principle (OCP)
* Componentes devem ser abertos para extensão (via props) mas fechados para modificação.
* Evite "flags" booleanas excessivas (ex: `isMobile`, `isEditing`). Prefira compor componentes ou passar variantes via props de estilo.

### L - Liskov Substitution Principle (LSP)
* Se um componente espera uma interface de dados de "Entrada", qualquer subtipo dessa entrada deve funcionar sem quebrar a UI. 

### I - Interface Segregation Principle (ISP)
* Não passe o objeto "Relatorio" inteiro para um componente que só precisa do "Nome do Cliente". Passe apenas as props necessárias.

### D - Dependency Inversion Principle (DIP)
* Componentes de UI não devem depender diretamente de APIs ou serviços externos. Injete dependências via Contexto ou Hooks.
* Exemplo: O botão "Gerar PDF" chama uma função recebida por prop ou hook, sem saber qual biblioteca gera o PDF.

## 4. Diretrizes de UI/UX e Responsividade

O app deve ser **Mobile-First**. Ao escrever CSS/Estilos:

1.  **Layout:** Use Flexbox e CSS Grid. Evite larguras fixas (`width: 500px`). Use percentuais ou unidades relativas (`rem`, `%`, `vw`).
2.  **Touch Targets:** Botões e inputs devem ter altura mínima de **44px** para facilitar o toque em telas mobile.
3.  **Breakpoints:**
    * Estilos base: Mobile (celular em pé).
    * `md/lg`: Tablets e Desktops (ajuste de colunas de 1 para 2 ou mais).
4.  **Feedback:** Indique claramente estados de carregamento ou erro na validação dos dados de resistência.
