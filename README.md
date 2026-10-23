# Note-Taking Application — Backend REST API

A secure, high-performance REST API built with Node.js, Express, MongoDB, and Mongoose, featuring JWT authentication, Role-Based Access Control (RBAC), optimal indexing, and advanced aggregation pipelines.

---

## 🛠️ Tech Stack & Standards
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JSON Web Tokens (JWT)
- **Security**: `bcryptjs` password hashing (salt rounds = 12)
- **Validation**: `express-validator`

---

## 🔐 Roles & Permissions
- **User**:
  - Can create, read, update, and delete their own notes.
  - Can view all public posts and publish their own posts.
- **Admin**:
  - Inherits all User capabilities.
  - Manage all users (create, update, delete, list with pagination).
  - View and delete any note across the system.
  - View real-time aggregation analytics.

---

## ⚡ Indexing Strategy (`schema.index`)
All indexes are explicitly defined in the Mongoose models using `schema.index(...)` to ensure maximum efficiency with **zero unnecessary indexes**:

### 1. `User` Collection (`src/models/User.js`)
- `UserSchema.index({ email: 1 }, { unique: true })`
  - Supports: Login lookup (`findOne({ email })`) and registration collision check.
- `UserSchema.index({ interests: 1 })`
  - Supports: **Aggregation Scenario 1** (`$match` and `$unwind` on interests).
- `UserSchema.index({ createdAt: -1 })`
  - Supports: Admin `getAllUsers` list sorted by newest users first.

### 2. `Note` Collection (`src/models/Note.js`)
- `NoteSchema.index({ owner: 1, createdAt: -1 })`
  - Supports: User listing their own notes (`find({ owner }).sort({ createdAt: -1 })`), fulfilling the ESR rule.
- `NoteSchema.index({ createdAt: -1 })`
  - Supports: Admin `getAllNotes` global list (`find({}).sort({ createdAt: -1 })`) without a collection scan.

### 3. `Post` Collection (`src/models/Post.js`)
- `PostSchema.index({ author: 1, createdAt: -1 })`
  - Supports: **Aggregation Scenario 2** (`$lookup` equality on `author` sorted by `createdAt: -1`).
- `PostSchema.index({ createdAt: -1 })`
  - Supports: Public `getAllPosts` feed (`find({}).sort({ createdAt: -1 })`).

---

## 📊 Aggregation Pipelines

### Scenario 1: Group Users by Interests
- **Route**: `GET /api/admin/users/grouped-by-interests`
- **Constraint**: *Exactly one `collection.aggregate()` call.*
- **Pipeline**:
  1. `$match`: Exclude documents with empty interests.
  2. `$unwind`: Deconstruct interests array.
  3. `$group`: Group by each interest, aggregating user details and counts.
  4. `$project`: Reshape document.
  5. `$sort`: Rank most popular interests first (`count: -1`).

### Scenario 2: User Posts ($lookup)
- **Route**: `GET /api/posts/user/:userId`
- **Constraint**: *Single aggregation pipeline with a `$lookup` stage.*
- **Pipeline**:
  1. `$match`: Match target user by `_id` or `email`.
  2. `$lookup`: Correlated sub-pipeline using `let: { uid: '$_id' }` matching `author` on `Posts` with the compound index `{ author: 1, createdAt: -1 }`. Employs `$facet` for simultaneous pagination and total count.
  3. `$project`: Shape response containing user profile, paginated posts, and metadata.

---

## 🚀 API Endpoints

### Auth (`/api/auth`)
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login & receive JWT
- `GET /api/auth/me` — Current user profile *(Private)*

### Notes (`/api/notes`)
- `GET /api/notes` — Paginated list of own notes *(Private)*
- `GET /api/notes/:id` — Single note *(Private)*
- `POST /api/notes` — Create note *(Private)*
- `PUT /api/notes/:id` — Update note *(Private)*
- `DELETE /api/notes/:id` — Delete note *(Private)*

### Admin (`/api/admin`) *(Admin only)*
- `GET /api/admin/users` — Paginated list of all users
- `GET /api/admin/users/:id` — Get single user
- `POST /api/admin/users` — Create user
- `PUT /api/admin/users/:id` — Update user
- `DELETE /api/admin/users/:id` — Delete user
- `GET /api/admin/notes` — Paginated list of all notes across system
- `GET /api/admin/users/grouped-by-interests` — Aggregation Scenario 1

### Posts (`/api/posts`)
- `GET /api/posts` — Paginated public posts
- `POST /api/posts` — Create post *(Private)*
- `GET /api/posts/user/:userId` — Aggregation Scenario 2 ($lookup)

---

## 💻 Local Setup & Seeding

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env`:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   ```
3. Populate database with dummy data:
   ```bash
   node seed.js
   ```
   **Default Test Logins:**
   - Admin: `admin@noteapp.com` / `admin123`
   - User: `alice@example.com` / `password123`
4. Run server:
   ```bash
   npm run dev
   ```
