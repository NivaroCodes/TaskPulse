# ⚡️ TaskPulse

![TaskPulse Banner](https://via.placeholder.com/1200x400.png?text=TaskPulse+-+AI-Powered+Task+Management) *(Add a real banner here later)*

TaskPulse is a next-generation, AI-powered task management platform designed for modern teams. Built with a high-performance **FastAPI** backend and a stunning **React (TanStack Start)** frontend, it brings Linear-level aesthetics, powerful LLM integrations, and enterprise-grade multi-tenancy into a single seamless workspace.

## ✨ Key Features

### 🤖 1. AI-Powered Workflow (Powered by Groq LLM)
TaskPulse isn't just a Kanban board; it actively helps you work faster:
- **AI Spotlight Command Bar (`Cmd+K`)**: Create and parse tasks effortlessly using Natural Language processing.
- **AI Subtask Generator**: Instantly break down complex tasks into step-by-step actionable checklists.
- **AI Description Polish**: Turn rough notes into perfectly formatted, professional Markdown briefs.
- **AI Comment Assistant**: Rewrite your comments to be more professional, friendly, or concise before sending.
- **AI Thread Summarization**: Auto-generate Consensus and Action Items from long comment threads.
- **AI Sprint Insights**: Executive-level sprint analytics and standup summaries for Admins & PMs.

### 🎨 2. Premium UX & Design
- **Linear-Style Aesthetics**: Beautiful glassmorphism, fluid animations, and a modern dark-mode native interface using TailwindCSS.
- **Immersive Interaction**: Real-time audio notifications, dynamic unread badges, and zero-scroll flawless modal design.
- **Activity Logging**: Track every change, assignment, and status update with a detailed, timestamped Activity Log.

### 🏢 3. Enterprise & SaaS Ready
- **Multi-Tenancy & Authentication**: Seamless login, organization switching, and role-based access control (RBAC) managed by **Clerk**.
- **Organization Invites**: Generate and accept secure `/invite/$token` links.
- **Monetization & Billing**: Integrated Subscription system (Free, Team, Enterprise) featuring **Kaspi Mock Pay** for simulated transactions.

## 🛠 Technology Stack

### Frontend
- **Framework**: React.js 18+ with **TanStack Start** (File-based routing)
- **Styling**: TailwindCSS & Radix UI (Accessible Primitives)
- **State & Data Fetching**: TanStack Query (React Query)
- **Authentication**: Clerk React SDK

### Backend
- **Framework**: FastAPI (Python 3.10+) & Uvicorn
- **Database**: SQLAlchemy (Async ORM) & SQLite (Ready for PostgreSQL)
- **AI Integration**: Groq Cloud SDK (Llama-3.3-70b-versatile)
- **Authentication**: Clerk Backend API & Svix (Webhook Verification)

## 🚀 Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Clerk Account](https://clerk.dev/) for Authentication
- [Groq API Key](https://groq.com/) for AI features

### 1. Clone the Repository
```bash
git clone https://github.com/NivaroCodes/TaskPulse.git
cd TaskPulse
```

### 2. Backend Setup
Navigate to the backend directory:
```bash
cd backend
```

Create and activate virtual environment (using `uv` or `venv`):
```bash
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

Install dependencies:
```bash
uv pip install uvicorn fastapi sqlalchemy python-dotenv clerk-backend-api httpx svix groq
```

Create a `.env` file in the `backend` directory:
```env
CLERK_SECRET_KEY="sk_test_..."
CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_JWKS_URL="https://your-instance.clerk.accounts.dev/.well-known/jwks.json"
CLERK_WEBHOOK_SECRET="whsec_..." 

GROQ_API_KEY="gsk_..." # Required for AI Features

DATABASE_URL="sqlite+aiosqlite:///./taskboard.db" 
FRONTEND_URL="http://localhost:5173"
```

Start the Backend server:
```bash
uv run start.py
```
*API will run on `http://localhost:8000`. Check Swagger Docs at `http://localhost:8000/docs`.*

### 3. Frontend Setup
Navigate to the frontend directory:
```bash
cd ../frontend
```

Install dependencies:
```bash
npm install # or pnpm install
```

Create a `.env` file in the `frontend` directory:
```env
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
VITE_CLERK_SIGN_IN_URL="/sign-in"
VITE_CLERK_SIGN_UP_URL="/sign-up"
VITE_CLERK_AFTER_SIGN_IN_URL="/dashboard"
VITE_CLERK_AFTER_SIGN_UP_URL="/dashboard"

VITE_BACKEND_URL="http://localhost:8000"
```

Start the Frontend development server:
```bash
npm run dev
```
*App will run on `http://localhost:5173`.*

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to fork the repository and submit pull requests.

## 📄 License
This project is licensed under the [MIT License](LICENSE).