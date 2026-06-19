# TaskPulse

TaskPulse is a full-stack task management application designed to help teams organize and track their work efficiently. It features a robust FastAPI backend for API services and a dynamic React frontend for an intuitive user experience, with Clerk handling authentication and authorization.

## Features

*   **User Authentication & Authorization:** Secure user management and organization-based permissions powered by Clerk.
*   **Task Management:** Create, read, update, and delete tasks.
*   **Organization Support:** Tasks are associated with organizations, allowing for multi-tenancy.
*   **RESTful API:** A well-structured API built with FastAPI.
*   **Modern Frontend:** A responsive and interactive user interface built with React.

## Technologies Used

### Backend

*   Python 3.8+
*   FastAPI
*   Uvicorn (ASGI server)
*   SQLAlchemy (ORM)
*   SQLite (Database)
*   Clerk Backend SDK (Authentication & Authorization)
*   python-dotenv (Environment variables)
*   httpx (HTTP client for Clerk SDK)
*   svix (Webhook verification)

### Frontend

*   React.js
*   Clerk Frontend SDK (Authentication & Authorization)
*   Vite (Build tool)

## Setup Instructions

### Prerequisites

*   Python 3.8+
*   Node.js (LTS recommended)
*   Clerk Account (for authentication)

### 1. Clone the Repository

```bash
git clone https://github.com/NivaroCodes/TaskPulse.git
cd TaskPulse
```

### 2. Backend Setup

Navigate to the `backend` directory:

```bash
cd backend
```

#### a. Create and Activate Virtual Environment

```bash
python -m venv .venv
# On Windows
.venv\Scripts\activate
# On macOS/Linux
source .venv/bin/activate
```

#### b. Install Dependencies

```bash
pip install uvicorn fastapi sqlalchemy python-dotenv clerk-backend-api httpx svix
```

#### c. Environment Variables

Create a `.env` file in the `backend` directory with the following content:

```
CLERK_SECRET_KEY="sk_test_..."
CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_JWKS_URL="https://your-instance.clerk.accounts.dev/.well-known/jwks.json"
CLERK_WEBHOOK_SECRET="whsec_..." # Required for webhook verification

DATABASE_URL="sqlite:///./taskboard.db" # Or your preferred database URL
FRONTEND_URL="http://localhost:5173" # Must match your frontend's URL
```

*Replace placeholder values with your actual Clerk keys and URLs.*

### 3. Frontend Setup

Navigate to the `frontend` directory:

```bash
cd ../frontend
```

#### a. Install Dependencies

```bash
npm install # or yarn install
```

#### b. Environment Variables

Create a `.env` file in the `frontend` directory with the following content:

```
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
VITE_CLERK_SIGN_IN_URL="/sign-in"
VITE_CLERK_SIGN_UP_URL="/sign-up"
VITE_CLERK_AFTER_SIGN_IN_URL="/dashboard"
VITE_CLERK_AFTER_SIGN_UP_URL="/dashboard"
VITE_BACKEND_URL="http://localhost:8000" # Your backend API URL
```

*Replace placeholder values with your actual Clerk keys and URLs.*

## Running the Application

### 1. Start the Backend

From the `backend` directory:

```bash
uv run start.py
```

The backend will run on `http://0.0.0.0:8000`.

### 2. Start the Frontend

From the `frontend` directory:

```bash
npm run dev # or yarn dev
```

The frontend will typically run on `http://localhost:5173`.

## Clerk Configuration

*   **Clerk Dashboard:** Ensure your Clerk application is is configured correctly.
*   **Frontend URL:** Add `http://localhost:5173` to your Clerk application's "Allowed Origins" and "Redirect URLs".
*   **Backend Webhook:** Configure a webhook in your Clerk Dashboard pointing to `http://localhost:8000/api/webhooks/clerk`. Make sure to provide the `CLERK_WEBHOOK_SECRET` in your backend's `.env` file and the corresponding secret in the Clerk webhook configuration.

## Contributing

Feel free to fork the repository, create feature branches, and submit pull requests.

## License

MIT