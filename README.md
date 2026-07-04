# 📱 Social Media Web Application

A modern, full-stack social media application featuring secure user authentication (JWT + Google OAuth), interactive social feeds, posting capabilities, nested comments, like actions, and a user follow-unfollow system.

Built as a decoupled Single Page Application (SPA), the project features a **React (Vite)** frontend styled with **Tailwind CSS** and a **Node.js (Express)** backend backed by a **MongoDB** database.

---

## 🚀 Key Features

*   **Secure Authentication System**
    *   **Local Registration & Login**: Password hashing using `bcryptjs` and session persistence via JWT (JSON Web Tokens).
    *   **Google OAuth 2.0 Integration**: Passport.js strategy to authorize and login users directly via Google.
    *   **Axios Interceptors**: Automatically attaches the JWT bearer token to every outbound frontend API request.
    *   **Protected Routes**: Route-guards preventing unauthenticated visitors from accessing internal pages.
*   **Social & Engagement Elements**
    *   **Personal Feed**: Displays posts exclusively from creators you follow in reverse-chronological order.
    *   **Global Discover Feed**: Explores and interacts with posts from the entire community.
    *   **Interactive Posts**: Create, update, or delete posts, and upload images.
    *   **Likes**: Fast, toggleable post likes.
    *   **Comments**: View, write, and delete comments on individual posts.
    *   **User Profiles & Connections**: Follow/unfollow users, view user stats (followers, following count), and see their individual posts.
*   **Security & Error Handling**
    *   **Express Rate Limiting**: Anti-brute force and anti-DDoS protection.
    *   **HTTP Security Headers**: Secure headers injected via `helmet`.
    *   **Database Constraints**: Unique indexes (e.g., emails) and sparse indexes (allowing optional fields like `googleId`).
    *   **Global Error Handling**: Standardized server response format for database schema validation errors, duplicate record errors, and syntax issues.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
*   **Styling**: [Tailwind CSS v3](https://tailwindcss.com/)
*   **Routing**: [React Router DOM v7](https://reactrouter.com/)
*   **API Client**: [Axios](https://axios-http.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)

### Backend
*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Framework**: [Express](https://expressjs.com/)
*   **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
*   **Authentication**: [Passport.js](https://www.passportjs.org/) (Google OAuth 2.0 & JWT strategy)
*   **Security**: `helmet`, `cors`, `express-rate-limit`, `bcryptjs`

---

## 📂 Project Structure

```text
SocialMedia/
├── backend/
│   ├── config/             # DB & Passport config
│   │   ├── db.js
│   │   ├── passport.js     # Google OAuth Strategy
│   │   └── passport-jwt.js # JWT Authorization Strategy
│   ├── controllers/        # Route handlers/business logic
│   ├── middleware/         # Auth, Ownership, & Validation middlewares
│   ├── models/             # Mongoose schemas (User, Post, Comment)
│   ├── routes/             # Express API endpoints
│   ├── .env                # Backend environment configuration
│   ├── server.js           # Server entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/     # Reusable UI elements (Navbar, PostCard, etc.)
    │   ├── context/        # AuthContext for global session state
    │   ├── pages/          # Page components (Dashboard, Discover, Login, etc.)
    │   ├── utils/          # ProtectedRoute guard
    │   ├── App.jsx         # App router & layout configuration
    │   ├── index.css       # Tailwind & custom CSS styles
    │   └── main.jsx        # App mounting point
    ├── index.html          # SPA shell
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## 💾 Database Schema & Indexing

The application leverages strategic MongoDB indexes to optimize performance and prevent table scans during queries.

### 👤 User Model
*   **Fields**: `name`, `email` (unique), `password` (hashed, local only), `googleId` (unique, sparse), `avatar`, `followers` (array of ObjectIds), `following` (array of ObjectIds).
*   **Indexes**:
    *   `email` (Unique): Optimized logins.
    *   `googleId` (Unique, Sparse): Fast Google OAuth queries without conflicting on local users (where `googleId` is null).
    *   `followers` & `following`: Fast connection reads.

### 📝 Post Model
*   **Fields**: `user` (ObjectId), `text`, `image`, `likes` (array of User ObjectIds).
*   **Indexes**:
    *   `user`: Optimizes profile page listings and database `$in` operations.
    *   `createdAt` (-1): Ensures descending chronological feeds don't trigger expensive in-memory sorting.

### 💬 Comment Model
*   **Fields**: `user` (ObjectId), `post` (ObjectId), `text`.
*   **Indexes**:
    *   `post`: Speeds up fetching comments associated with specific posts.

---

## 🔌 API Endpoints Reference

| Category | Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Register a new local user | No |
| **Auth** | `POST` | `/api/auth/login` | Log in local user and get JWT | No |
| **Auth** | `GET` | `/api/auth/google` | Trigger Google Consent screen | No |
| **Auth** | `GET` | `/api/auth/google/callback` | Google OAuth callback landing | No |
| **Auth** | `GET` | `/api/auth/me` | Fetch active user session profile | **Yes (JWT)** |
| **Users** | `GET` | `/api/users/:userId` | Get user profile stats & posts | **Yes (JWT)** |
| **Users** | `POST` | `/api/users/follow/:userId` | Follow a user | **Yes (JWT)** |
| **Users** | `POST` | `/api/users/unfollow/:userId`| Unfollow a user | **Yes (JWT)** |
| **Posts** | `POST` | `/api/posts` | Create a text/image post | **Yes (JWT)** |
| **Posts** | `GET` | `/api/posts` | Fetch Global feed | **Yes (JWT)** |
| **Posts** | `GET` | `/api/posts/feed` | Fetch Followed users' feed | **Yes (JWT)** |
| **Posts** | `PUT` | `/api/posts/:id` | Update post details (Owner only) | **Yes (JWT)** |
| **Posts** | `DELETE`| `/api/posts/:id` | Delete post (Owner only) | **Yes (JWT)** |
| **Posts** | `POST` | `/api/posts/like/:postId` | Like / Unlike a post | **Yes (JWT)** |
| **Comments**| `POST` | `/api/posts/:postId/comments` | Post a comment on a post | **Yes (JWT)** |
| **Comments**| `GET` | `/api/posts/:postId/comments` | Fetch comments for a post | **Yes (JWT)** |
| **Comments**| `DELETE`| `/api/comments/:id` | Delete a comment (Owner only) | **Yes (JWT)** |

---

## ⚙️ Installation & Local Setup

Follow these instructions to spin up the local development environments.

### Prerequisite
*   [Node.js (v18+)](https://nodejs.org/) installed.
*   [MongoDB Database Instance](https://www.mongodb.com/cloud/atlas) configured (local or cloud-based).
*   [Google Developer Console Project](https://console.cloud.google.com/) setup (if running Google OAuth login).

---

### Step 1: Configure Backend Environment

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create/edit your `.env` file and populate it with the appropriate values:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_signing_key_here

   # Google OAuth Credentials (Google Cloud Console)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

   # Frontend Redirect Address after Authentication Callback
   FRONTEND_REDIRECT_URL=http://localhost:5173/oauth-redirect
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server in Development mode (with `nodemon` hot reloading):
   ```bash
   npm run dev
   ```

---

### Step 2: Configure Frontend Environment

1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Create a `.env` file (Vite environment variables must be prefixed with `VITE_`):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Vite React development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173` to interact with the application.

---

### Step 3: Production Build (Optional)

To bundle the frontend for production, build the static files:
```bash
cd frontend
npm run build
```
This generates a production-optimized bundle inside the `frontend/dist` directory, which can be deployed to static hosting platforms (Vercel, Netlify, AWS S3) while pointing to the hosted Node/Express backend URL.
