# 🚀 TaskFlow AI

Intelligent task management system with AI, WhatsApp integration and modern interface.

---

## ⚡ Quick Start

```bash
# 1. Install
npm install

# 2. Configure .env
cp .env.example .env

# 3. Run
npm run dev
```

Access: http://localhost:3000

---

## 🗄️ Database Setup (Supabase)

Execute in Supabase SQL Editor:

```sql
-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  whatsapp_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks Table
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

-- Indexes
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

### Configure N8N Credentials

**OpenAI:**
- Credentials → OpenAI → Add your API Key

**Evolution API (WhatsApp):**
- Credentials → HTTP Header Auth
- Name: `apikey`
- Value: Your Evolution API key

### Webhook URLs

After activating workflows, copy the URLs and add to `.env`:

```env
N8N_CHAT_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/chat-tasks
N8N_TASKS_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/list-tasks
```

---

## 🌐 Deploy on Vercel

```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy TaskFlow AI"
git push

# 2. Connect to Vercel
# Go to vercel.com and import the repository

# 3. Configure Environment Variables on Vercel:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
N8N_CHAT_WEBHOOK_URL=...
N8N_TASKS_WEBHOOK_URL=...
```

---

## ✨ Features

### Web Interface
- ✅ Dashboard with statistics
- ✅ Priority system (High/Medium/Low)
- ✅ Tags and due dates
- ✅ Filters and sorting
- ✅ Inline editing
- ✅ Modern and responsive design

### AI Chatbot (Web - Query Only)
- ✅ Query and list your tasks
- ✅ Natural conversation about tasks
- ✅ Productivity tips
- ✅ GPT-4 with context
- ⚠️ **Does not create/edit tasks** (use the interface)

### WhatsApp (Conversational Flow)
- ✅ **WhatsApp Button** in interface
- ✅ Requests and saves user number
- ✅ Opens chat with `#todolist` pre-defined
- ✅ Asks for user's email
- ✅ Validates if email exists
- ✅ Shows formatted pending tasks
- ✅ Asks if user wants to see completed tasks
- ℹ️ Full chatbot available only on web

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

## 🔐 Environment Variables

See `.env.example` for complete reference.

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `N8N_CHAT_WEBHOOK_URL` - Chatbot webhook (web only)

**Optional (WhatsApp - Command #):**
- `N8N_TASKS_WEBHOOK_URL` - Webhook to list tasks
- `EVOLUTION_API_URL` - Evolution API URL
- `EVOLUTION_API_KEY` - Evolution API key
- `EVOLUTION_INSTANCE_NAME` - Instance name

---

## 🛠️ Stack

- **Frontend:** Next.js 14, React, TypeScript, TailwindCSS
- **Backend:** Next.js API Routes, Supabase
- **AI:** N8N + OpenAI GPT-4
- **WhatsApp:** Evolution API

---

## 📞 Support

- Issues: Use GitHub Issues

---

**TaskFlow AI** - Developed with ❤️

---

## 💬 WhatsApp Button

### Functionality

The **💬 WhatsApp** button in the interface allows you to:
1. Save your WhatsApp number
2. Open direct conversation with the bot
3. Message `#todolist` comes pre-typed

### First Use

1. Click the **💬 WhatsApp** button
2. Enter your number: `(41) 99999-9999`
3. Click **Connect WhatsApp**
4. You will be redirected automatically
5. Send the `#todolist` message that's already pre-typed

### Next Uses

- Number is saved
- Click the button and go straight to WhatsApp
- No need to type again

---
