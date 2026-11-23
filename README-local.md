# FoodExpress

![Status](https://img.shields.io/badge/Status-MVP%20Conclu%C3%ADdo-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5%2B-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![Vitest](https://img.shields.io/badge/Tests-Vitest%20%2B%20Supertest-6E9F18?logo=vitest&logoColor=white)

Sistema web de autoatendimento digital e gestão operacional de pedidos para lanchonetes e restaurantes de pequeno e médio porte. Permite que clientes façam pedidos para consumo no salão (por mesa) ou entrega (com envio automatizado para o WhatsApp) e oferece um painel administrativo em tempo real para controle de cardápio e fila de preparo.

---

## Índice

- [Sobre o projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e configuração](#instalação-e-configuração)
- [Como usar](#como-usar)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Roadmap](#roadmap)
- [Como contribuir](#como-contribuir)
- [Licença](#licença)
- [Autores e contatos](#autores-e-contatos)

---

## Sobre o projeto

### Contexto e problema que resolve
Lanchonetes e restaurantes de pequeno e médio porte enfrentam perdas operacionais e financeiras causadas por anotações manuais em comandas de papel, filas em horários de pico, falta de padronização em pedidos recebidos por aplicativos de mensagem e altas taxas cobradas por plataformas terceirizadas de intermediação.

### Objetivo
Oferecer um canal digital próprio, ágil e padronizado que elimina erros de anotação no salão, estrutura automaticamente o resumo de pedidos de entrega para o WhatsApp do estabelecimento e centraliza o controle da fila de preparo em um painel administrativo sem cobrança de comissões externas.

### Público-alvo
- **Cliente Final (`ACT-01`):** Consumidor que consulta o cardápio pelo celular (presencialmente na mesa ou remotamente em casa), personaliza seus itens e acompanha o preparo sem necessidade de criar conta ou senha.
- **Atendente / Restaurante (`ACT-02`):** Operador ou gestor autenticado responsável por manter o cardápio atualizado (categorias, produtos, variações e adicionais) e gerenciar o avanço dos pedidos na cozinha até a entrega.

---

## Funcionalidades

### Jornada do Cliente (`ACT-01`)
- **Cardápio Público Mobile-First (`RF-002`):** Listagem de categorias e produtos ativos com busca e filtros rápidos, ocultando automaticamente itens inativos (`RN-001`).
- **Personalização com Variações, Adicionais e Observações (`RF-004`, `RF-013`):** Seleção de variações (ex.: tamanho ou ponto da carne), adicionais pagos (ex.: bacon extra) e campo de observações por item limitado a **140 caracteres** (`RN-002`, `RN-011`).
- **Sacola de Compras Inteligente (`RF-003`):** Adição e remoção de itens, ajuste de quantidades e cálculo automático de subtotais e valor total do pedido (`RN-011`).
- **Modalidades sem Cadastro (`RF-005`, `RF-006`):** Escolha entre **Consumo no local** (exige número da mesa) e **Entrega** (exige nome do cliente e dados de entrega) sem burocracia de login (`RN-003`).
- **Encaminhamento Padronizado para WhatsApp (`RF-008`):** Geração automática de resumo estruturado (código do pedido, cliente, itens, adicionais, observações e total) com redirecionamento direto para o WhatsApp do restaurante nos pedidos de entrega (`RN-005`).
- **Acompanhamento de Status em Tempo Real (`RF-012`):** Visualização passo a passo da etapa atual do pedido (`Recebido` → `Em preparo` → `Pronto` → `Entregue` ou `Cancelado`).
- **Cancelamento pelo Cliente na Janela de 5 Minutos (`RF-011`):** Permissão para cancelar o próprio pedido em até **5 minutos** após a confirmação, desde que ainda esteja no status inicial `Recebido` (`RN-007`).

### Jornada do Atendente / Restaurante (`ACT-02`)
- **Autenticação e Proteção Administrativa (`RF-007`):** Login seguro com senhas criptografadas (`scrypt`) e rotas administrativas protegidas por token JWT (`RN-010`, `RNF-002`).
- **Gestão Completa de Cardápio (`RF-001`, `RF-013`):** Cadastro, edição, listagem e ativação/inativação rápida de categorias, produtos (com validação de preço positivo), variações e adicionais.
- **Painel Operacional de Pedidos (`RF-009`):** Visualização da fila de pedidos ativos com atualização automática a cada **5 minutos por padrão** (intervalo configurável pelo operador) e botão **"Atualizar Agora"** para sincronização manual imediata (`RN-004`, `RN-009`).
- **Controle Linear de Preparo — Máquina de Estados (`RF-010`):** Avanço sequencial estrito (`Recebido` → `Em preparo` → `Pronto` → `Entregue`), bloqueando pulos ou retrocessos de etapas (`RN-006`).
- **Cancelamento Operacional Irrestrito (`RF-011`):** Cancelamento de qualquer pedido ativo a qualquer momento pelo atendente autenticado, sem exigência de justificativa (`RN-008`).

---

## Tecnologias utilizadas

- **Frontend:** React, Vite, ES Modules, Tailwind CSS, React Router DOM e Lucide React (arquitetura *Single-Page Application* responsiva *Mobile-First*).
- **Backend:** Node.js e Express (API REST estruturada em camadas: *Controllers*, *Services*, *Repositories* e *Middlewares*).
- **Banco de Dados e ORM:** SQLite (`better-sqlite3` em modo WAL) e Drizzle ORM — banco de dados relacional em arquivo local (`data/foodexpress.sqlite`), sem necessidade de instalar servidores externos.
- **Segurança e Autenticação:** Hash criptográfico nativo `node:crypto` (`scrypt`) para senhas e JSON Web Token (JWT com assinatura HMAC-SHA256) para proteção das rotas `/api/admin/*`.
- **Testes Automatizados e CI/CD:** Vitest e Supertest para testes de unidade e integração das regras de negócio (`RNF-003`), integrados ao GitHub Actions.

---

## Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:

- **Node.js** (versão `20.x` ou superior)
- **npm** (gerenciador de pacotes incluso no Node.js)
- **Git** (opcional, para clonagem do repositório)

> **Nota:** Não é necessário instalar um servidor de banco de dados separado. O SQLite cria e popula automaticamente o arquivo local do banco na primeira execução.

---

## Instalação e configuração

Siga o passo a passo abaixo para executar o projeto localmente.

### 1. Clonar o repositório

```bash
git clone https://github.com/gabrieelsza/FoodExpress.git
cd FoodExpress
```

### 2. Instalar as dependências (Backend e Frontend)

Instale as dependências da raiz (API Backend e suíte de testes) e do diretório `site/frontend`:

```bash
npm install
npm --prefix site/frontend install
```

### 3. Configurar as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis (valores padrão já suportados em ambiente de desenvolvimento):

```env
# Porta do servidor HTTP da API Backend
PORT=3000

# Caminho do arquivo de banco de dados SQLite local
DATABASE_URL=./data/foodexpress.sqlite

# Chave secreta para assinatura de tokens JWT do painel administrativo
JWT_SECRET=foodexpress-local-dev-secret-key

# Número oficial do WhatsApp do restaurante (com DDI e DDD, apenas dígitos)
RESTAURANT_WHATSAPP=5511999999999

# Credenciais iniciais do atendente criadas pelo seed automático
ADMIN_DEFAULT_USER=admin
ADMIN_DEFAULT_PASS=admin123
```

### 4. Popular o banco de dados inicial (Seed)

Caso deseje inicializar ou restaurar os dados de demonstração (usuário `admin`, categorias, produtos, variações e adicionais):

```bash
npm run seed
```

---

## Como usar

### 1. Iniciar o servidor Backend (API REST)

Em um terminal na raiz do projeto, execute:

```bash
npm run dev:backend
```

A API estará disponível em `http://localhost:3000`.

### 2. Iniciar a aplicação Frontend (Interface Web)

Em um segundo terminal na raiz do projeto, execute:

```bash
npm run dev:frontend
```

Acesse a aplicação no navegador em `http://localhost:5173`.

### 3. Executar a suíte de testes automatizados

Para validar todas as regras de negócio do BRD e contratos do TRD (cálculo de preços, limite de 140 caracteres, máquina de estados linear e janela de 5 minutos para cancelamento):

```bash
npm test
```

### Fluxos principais de uso e credenciais de teste

- **Acesso do Cliente:** Acesse `http://localhost:5173/#/nossos-produtos`, escolha os itens, personalize variações/adicionais/observações, abra a sacola, selecione **Consumo no local** (informando a mesa) ou **Entrega** (informando seu nome) e acompanhe o status do pedido em tempo real.
- **Acesso do Atendente (Painel Administrativo):** Acesse `http://localhost:5173/#/admin/login` utilizando as credenciais padrão:
  - **Usuário:** `admin`
  - **Senha:** `admin123`

---

## Estrutura de pastas

```text
foodexpress/
├── docs/                          # Documentação SDD (contexto.md, arquitetura.md, brd.md, trd.md, sessao_agente.md)
├── data/                          # Banco de dados SQLite local (foodexpress.sqlite) gerado automaticamente
├── site/
│   ├── backend/                   # Servidor Node.js + Express (Monólito Modular em Camadas)
│   │   ├── admin/                 # Controllers, Middlewares (JWT), Repositories, Routes e Services
│   │   ├── db/                    # Schema Drizzle/SQLite, conexão WAL e scripts de Seed
│   │   ├── routes/                # Rotas públicas (/api/public/*) e administrativas (/api/admin/*)
│   │   ├── app.js                 # Configuração da aplicação Express
│   │   └── server.js              # Inicialização do servidor HTTP
│   └── frontend/                  # Aplicação SPA (React + Vite + Tailwind CSS)
│       ├── admin/                 # Páginas e serviços exclusivos do módulo Administrativo
│       ├── src/                   # Componentes, contextos (Cart, Auth, Order), páginas públicas e utilitários
│       └── vite.config.js         # Configuração do bundler Vite e proxy da API
├── tests/
│   ├── unit/                      # Testes de unidade das regras de negócio críticas
│   └── integration/               # Testes de integração dos endpoints REST (Supertest)
└── package.json                   # Scripts centralizados de execução, seed, build e testes
```

---

## Roadmap

Funcionalidades mapeadas como evolução pós-MVP (fora do escopo inicial em `docs/contexto.md`):

- **Processamento de Pagamentos Online e Integração com Caixa:** Pagamento via Pix/Cartão integrado diretamente no fechamento do pedido (`RN-012`).
- **Cadastro e Histórico de Clientes Finais:** Criação opcional de conta para salvar endereços recorrentes e repetir pedidos anteriores.
- **Importação Automatizada de Cardápio:** Leitura de planilhas ou arquivos externos para cadastro em lote de produtos.
- **Gestão Logística de Entregadores:** Rastreamento de rotas em mapa em tempo real.

---

## Como contribuir

O desenvolvimento deste projeto segue a metodologia **Spec Driven Development (SDD)** documentada em `AGENTS.md` e na pasta `docs/`.

1. Faça um *fork* do projeto e crie uma *branch* para sua alteração:
   ```bash
   git checkout -b feat/minha-melhoria
   ```
2. Certifique-se de que qualquer nova regra reflita os requisitos em `docs/brd.md` e `docs/trd.md`.
3. Execute os testes e o linter para garantir que todas as verificações passem:
   ```bash
   npm test
   npm run lint:frontend
   ```
4. Realize o *commit* seguindo o padrão *Conventional Commits* (`feat:`, `fix:`, `test:`, `docs:`, `chore:`):
   ```bash
   git commit -m "feat: adiciona nova funcionalidade"
   ```
5. Envie para o repositório remoto e abra um *Pull Request*.

---

## Licença

Este projeto é destinado a **uso acadêmico** e demonstrativo de Engenharia de Software e Arquitetura de Sistemas. [PREENCHER: Caso deseje adotar uma licença de código aberto específica, ex.: MIT License].

---

## Autores e contatos

Projeto desenvolvido em equipe (dimensionado para 3 integrantes ao longo das Sprints 1 e 2):
- **Repositório Oficial:** [github.com/gabrieelsza/FoodExpress](https://github.com/gabrieelsza/FoodExpress)
