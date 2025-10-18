# 🚀 TaskFlow AI

Sistema inteligente de gerenciamento de tarefas com IA, integração WhatsApp e interface moderna.

---

## ⚡ Quick Start

```bash
# 1. Instalar
npm install

# 2. Configurar .env
cp .env.example .env
# Adicione suas credenciais

# 3. Executar
npm run dev
```

Acesse: http://localhost:3000

---

## 🗄️ Setup do Banco (Supabase)

Execute no SQL Editor do Supabase:

```sql
-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  whatsapp_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  tags TEXT[] DEFAULT '{}',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_whatsapp ON users(whatsapp_number);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);

-- Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 🤖 N8N Workflows

### Configurar Credenciais N8N

**OpenAI:**
- Credentials → OpenAI → Adicione sua API Key

**Evolution API (WhatsApp):**
- Credentials → HTTP Header Auth
- Nome: `apikey`
- Valor: Sua chave Evolution API

### URLs dos Webhooks

Após ativar os workflows, copie as URLs e adicione no `.env`:

```env
N8N_CHAT_WEBHOOK_URL=https://seu-n8n.app.n8n.cloud/webhook/chat-tasks
N8N_TASKS_WEBHOOK_URL=https://seu-n8n.app.n8n.cloud/webhook/list-tasks
```

---

## 🌐 Deploy na Vercel

```bash
# 1. Push para GitHub
git add .
git commit -m "Deploy TaskFlow AI"
git push

# 2. Conecte à Vercel
# Vá em vercel.com e importe o repositório

# 3. Configure Environment Variables na Vercel:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
N8N_CHAT_WEBHOOK_URL=...
N8N_TASKS_WEBHOOK_URL=...
EVOLUTION_API_URL=...
EVOLUTION_API_KEY=...
EVOLUTION_INSTANCE_NAME=...
```

---

## ✨ Funcionalidades

### Interface Web
- ✅ Dashboard com estatísticas
- ✅ Sistema de prioridades (Alta/Média/Baixa)
- ✅ Tags e datas de vencimento
- ✅ Filtros e ordenação
- ✅ Edição inline
- ✅ Design moderno e responsivo

### Chatbot IA (Web - Apenas Consulta)
- ✅ Consulta e lista suas tasks
- ✅ Conversa natural sobre tarefas
- ✅ Dicas de produtividade
- ✅ GPT-4 com contexto
- ⚠️ **Não cria/edita tasks** (use a interface)

### WhatsApp (Fluxo Conversacional)
- ✅ **Botão WhatsApp** na interface
- ✅ Solicita e salva número do usuário
- ✅ Abre conversa com `#todolist` pré-definido
- ✅ Pede o email do usuário
- ✅ Valida se o email existe
- ✅ Mostra tasks pendentes formatadas
- ✅ Pergunta se deseja ver tasks concluídas
- ℹ️ Chatbot completo disponível apenas na web

---

## 📡 API Endpoints

```bash
# Tasks
GET    /api/tasks?user_key={key}
GET    /api/tasks?user_key={key}&pending_only=true
POST   /api/tasks
PUT    /api/tasks
DELETE /api/tasks?id={id}

# Chat
POST   /api/chat

# WhatsApp
POST   /api/whatsapp/webhook
```

---

## 🔐 Variáveis de Ambiente

Veja `.env.example` para referência completa.

**Obrigatórias:**
- `NEXT_PUBLIC_SUPABASE_URL` - URL do Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima do Supabase
- `N8N_CHAT_WEBHOOK_URL` - Webhook do chatbot (apenas web)

**Opcionais (WhatsApp - Comando #):**
- `N8N_TASKS_WEBHOOK_URL` - Webhook para listar tasks
- `EVOLUTION_API_URL` - URL da Evolution API
- `EVOLUTION_API_KEY` - Chave da Evolution API
- `EVOLUTION_INSTANCE_NAME` - Nome da instância

---

## 🛠️ Stack

- **Frontend:** Next.js 14, React, TypeScript, TailwindCSS
- **Backend:** Next.js API Routes, Supabase
- **IA:** N8N + OpenAI GPT-4
- **WhatsApp:** Evolution API

---

## 📞 Suporte

- Issues: Use GitHub Issues

---

**TaskFlow AI** - Desenvolvido com ❤️

---

## 💬 Botão WhatsApp

### Funcionalidade

O botão **💬 WhatsApp** na interface permite:
1. Salvar seu número de WhatsApp
2. Abrir conversa direta com o bot
3. Mensagem `#todolist` já vem pré-digitada

### Primeiro Uso

1. Clique no botão **💬 WhatsApp**
2. Digite seu número: `(41) 99999-9999`
3. Clique em **Conectar WhatsApp**
4. Será redirecionado automaticamente
5. Envie a mensagem `#todolist` que já está pré-digitada

### Próximos Usos

- O número fica salvo
- Clique no botão e vai direto para o WhatsApp
- Sem precisar digitar novamente

---
