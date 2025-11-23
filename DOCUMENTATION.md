# 📘 Documentação do Projeto: SPDA Reports

**Versão:** 1.0.0
**Data:** 23/11/2025

---

## 1. Visão Geral
O **SPDA Reports** é uma aplicação web progressiva (PWA) desenvolvida para modernizar e agilizar a criação de relatórios de inspeção de SPDA (Sistemas de Proteção contra Descargas Atmosféricas).

O sistema foi projetado para resolver o problema da falta de conectividade em campo, permitindo que engenheiros e técnicos coletem dados, tirem fotos e gerem relatórios completos mesmo sem acesso à internet, sincronizando tudo com a nuvem quando retornarem ao escritório.

---

## 2. Principais Funcionalidades

### 🌍 Modo Híbrido (Online & Offline)
- **Online (Nuvem):** Salva dados no Google Cloud (Firestore) para acesso em qualquer dispositivo.
- **Offline (Local):** Salva dados diretamente no dispositivo (IndexedDB). Ideal para locais sem sinal ou usuários do plano Free.

### 🔄 Sincronização Inteligente
- **Upload (Local -> Nuvem):** Envia relatórios e fotos coletados em campo para o servidor.
- **Download (Nuvem -> Local):** Baixa todo o histórico para o dispositivo, permitindo consulta offline.
- **Conversão Automática:** O sistema converte automaticamente fotos entre arquivos locais e links seguros da nuvem.

### 📄 Geração de PDF Instantânea
- Gera relatórios profissionais em PDF diretamente no navegador.
- **Zero Custo:** Não utiliza servidores externos para processamento.
- **Privacidade:** Os dados do cliente nunca saem do ambiente seguro da aplicação.

### 🛡️ Controle de Acesso e Planos
- **Níveis de Acesso:** Usuário Comum e Administrador.
- **Planos:**
    - **Free:** Acesso apenas ao modo Local (Offline).
    - **Pro:** Acesso à Nuvem, Backup e Sincronização.
- **Painel Admin:** Interface para aprovar usuários e gerenciar planos.

---

## 3. Arquitetura Técnica

O projeto utiliza uma arquitetura **Serverless** (Sem Servidor), focada em performance e baixo custo de manutenção.

### Stack Tecnológico
| Componente | Tecnologia | Função |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | Interface do usuário rápida e responsiva. |
| **Estilização** | CSS Moderno | Design limpo e adaptável (Mobile/Desktop). |
| **Backend** | Google Firebase | Autenticação, Banco de Dados e Segurança. |
| **Banco de Dados** | Firestore (NoSQL) | Armazenamento de dados na nuvem. |
| **Storage** | Firebase Storage | Armazenamento de fotos na nuvem. |
| **Local DB** | IndexedDB | Banco de dados interno do navegador (Offline). |
| **PDF** | jsPDF | Motor de geração de documentos. |

### Fluxo de Dados
1.  **Entrada:** Usuário preenche o formulário e anexa fotos.
2.  **Processamento:** O App decide onde salvar baseando-se no modo (Local ou Nuvem).
3.  **Armazenamento:**
    *   *Modo Nuvem:* Dados vão para o Firestore; Fotos vão para o Storage.
    *   *Modo Local:* Tudo fica no IndexedDB do navegador.
4.  **Saída:** O motor PDF lê os dados e gera o arquivo final para download.

---

## 4. Manual do Usuário

### Perfis de Acesso
*   **Usuário (Técnico/Engenheiro):** Pode criar, editar e excluir seus próprios relatórios.
*   **Administrador:** Tem acesso total, pode aprovar novos cadastros e alterar planos de assinatura.

### Fluxos Comuns

#### A. Criando um Relatório em Campo (Sem Internet)
1.  Acesse **Configurações** e garanta que o modo está em **"Local (Offline)"**.
2.  Vá em **Relatórios** > **Novo Relatório**.
3.  Preencha os dados, checklist e tire fotos.
4.  Clique em **Salvar**. O relatório está seguro no seu dispositivo.
5.  (Opcional) Clique em **Gerar PDF** para enviar ao cliente na hora.

#### B. Sincronizando com a Nuvem (Ao voltar para o escritório)
1.  Conecte-se à internet.
2.  Vá em **Configurações**.
3.  Na seção "Sincronização", clique em **"Enviar para Nuvem (Upload)"**.
4.  Aguarde a barra de progresso.
5.  Pronto! Seus dados agora estão salvos no servidor e acessíveis de outros computadores.

#### C. Gerenciando Usuários (Apenas Admin)
1.  No menu lateral, clique em **Admin**.
2.  Veja a lista de usuários pendentes.
3.  Clique em **Aprovar** para liberar o acesso.
4.  Use o seletor de **Plano** para mudar de Free para Pro.

---

## 5. Instalação e Desenvolvimento (Para TI)

### Pré-requisitos
- Node.js instalado (v16 ou superior).
- Conta no Google Firebase.

### Passos para Rodar
1.  Clone o repositório.
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Configure as variáveis de ambiente (`.env`) com as chaves do Firebase.
4.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
5.  Para gerar a versão de produção:
    ```bash
    npm run build
    ```

---

**Desenvolvido por:** LHF
**Contato:** lucas@lhf.ind.br
