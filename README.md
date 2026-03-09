# 🚚 DeliverVerify — OTP-Based E-Commerce Delivery Verification

A full-stack e-commerce platform with **OTP-based delivery verification**. When a delivery agent arrives, a one-time password is sent to the customer's email — the agent must verify the OTP to confirm delivery.

---

## 🧱 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React.js + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |
| Email | Nodemailer (Gmail / Ethereal) |
| Security | bcryptjs, express-rate-limit |

---

## 📁 Project Structure

```
delivery-app/
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema (customer/admin/agent)
│   │   ├── Product.js       # Product schema
│   │   └── Order.js         # Order schema with OTP fields
│   ├── routes/
│   │   ├── auth.js          # POST /register, POST /login, GET /me
│   │   ├── products.js      # GET/POST/PUT/DELETE /products
│   │   ├── orders.js        # POST /order, GET /orders
│   │   ├── otp.js           # POST /generate-otp, POST /verify-otp
│   │   ├── admin.js         # Admin dashboard APIs
│   │   └── agent.js         # Delivery agent APIs
│   ├── middleware/
│   │   └── auth.js          # JWT middleware (auth, adminAuth, agentAuth)
│   ├── utils/
│   │   └── email.js         # Nodemailer OTP email sender
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Global auth + axios instance
│   │   │   └── CartContext.jsx   # Shopping cart state
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── OrderDetail.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AgentDashboard.jsx
│   │   │   └── Profile.jsx
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
│
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone & Install

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and email credentials

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/delivery-verification
JWT_SECRET=your_very_secret_key_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password   # See Gmail App Password setup below
NODE_ENV=development
```

### 3. Start Servers

```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm start
```

App runs at: **http://localhost:3000**

### 4. Seed Demo Data

Visit the home page and click **"🌱 Seed Demo Data"** button, or call:
```
POST http://localhost:5000/api/admin/seed
```

This creates:
- **Admin**: `admin@deliververify.com` / `Admin@123`
- **Agent**: `agent@deliververify.com` / `Agent@123`
- **6 sample products**

---

## 🔐 OTP Delivery Verification Flow

```
1. Customer places order → Status: "Pending"
2. Admin assigns delivery agent → Status: "Shipped"
3. Agent logs into Agent Dashboard
4. Agent selects delivery and clicks "Verify OTP"
5. Agent clicks "Generate & Send OTP"
6. Backend generates 6-digit OTP (expires in 5 min)
7. OTP is emailed to customer
8. Customer receives email: "Your delivery OTP is: 482913"
9. Customer tells OTP to the agent
10. Agent enters OTP in the system
11. Backend verifies OTP → Order Status: "Delivered" ✅
```

### OTP Security Features
- ✅ 6-digit random OTP
- ✅ 5-minute expiry
- ✅ Maximum 3 attempts (brute-force protection)
- ✅ Sent via email (Nodemailer)
- ✅ OTP cleared from DB after successful verification

---

## 📡 API Reference

### Auth
```
POST /api/register      - Register new user
POST /api/login         - Login
GET  /api/me            - Get current user (auth required)
PUT  /api/profile       - Update profile (auth required)
```

### Products
```
GET    /api/products        - List all products (public)
GET    /api/products/:id    - Get single product (public)
POST   /api/products        - Add product (admin)
PUT    /api/products/:id    - Update product (admin)
DELETE /api/products/:id    - Delete product (admin)
```

### Orders
```
POST /api/order           - Place order (auth)
GET  /api/orders/my       - My orders (auth)
GET  /api/order/:id       - Order detail (auth)
GET  /api/orders          - All orders (admin)
PUT  /api/order/:id/status - Update status (admin)
```

### OTP
```
POST /api/generate-otp    - Generate & send OTP (agent/admin)
POST /api/verify-otp      - Verify OTP (agent/admin)
GET  /api/otp-status/:id  - Check OTP status (auth)
```

### Admin
```
GET  /api/admin/stats         - Dashboard statistics
GET  /api/admin/users         - All users
GET  /api/admin/agents        - All delivery agents
PUT  /api/admin/user/:id/role - Change user role
PUT  /api/admin/order/:id/assign - Assign delivery agent
POST /api/admin/seed          - Seed demo data (dev only)
```

### Agent
```
GET /api/agent/deliveries   - My assigned deliveries
GET /api/agent/stats        - My delivery stats
```

---

## 👥 User Roles

| Role | Access |
|---|---|
| **Customer** | Browse, cart, orders, profile |
| **Agent** | View assigned deliveries, generate OTP, verify OTP |
| **Admin** | Everything + manage products, orders, users, agents |

---

## 📧 Gmail App Password Setup

1. Enable 2-Factor Authentication on your Google account
2. Go to: Google Account → Security → App passwords
3. Create new app password for "Mail"
4. Copy the 16-character password to `EMAIL_PASS` in `.env`

> **For development/testing**: If no email is configured, the app uses Ethereal (fake SMTP) and logs a preview URL to the console.

---

## 🐳 Docker Setup

```bash
# Edit docker-compose.yml with your email credentials, then:
docker-compose up -d
```

---

## 🗄️ MongoDB Collections

### users
```json
{
  "_id": "ObjectId",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "$2b$12$...",  // bcrypt hashed
  "address": { "street": "123 Main St", "city": "Delhi", "state": "Delhi", "pincode": "110001" },
  "role": "customer",  // customer | agent | admin
  "isActive": true
}
```

### products
```json
{
  "_id": "ObjectId",
  "name": "iPhone 15 Pro",
  "description": "Latest Apple smartphone",
  "price": 129999,
  "image": "https://...",
  "stock": 50,
  "category": "Electronics",
  "isActive": true
}
```

### orders
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "products": [{ "productId": "ObjectId", "name": "...", "price": 0, "quantity": 1 }],
  "totalAmount": 129999,
  "status": "Out for Delivery",
  "shippingAddress": { "street": "...", "city": "...", "state": "...", "pincode": "..." },
  "otp": "482913",           // null after delivery
  "otpExpiry": "2024-...",   // 5 min from generation
  "otpAttempts": 0,
  "otpMaxAttempts": 3,
  "deliveryAgentId": "ObjectId",
  "deliveredAt": null
}
```
