# vHealPoint 🩺  
<p align="center">
  <img src="frontend/src/assets/vHealPoints2_trans.png" alt="vHealPoint Banner" width="30%" />
</p>
<p align="center"><em>A modern web platform to connect patients with doctors and manage clinic appointments seamlessly.</em></p>                                                               

## 🌐 Overview

**vHealPoint** is a full-stack web application that allows users to find doctors, book appointments, and manage healthcare services online. The platform is designed to improve the accessibility and efficiency of private clinic services through digital solutions.

---

## ✅ Features

### 🔐 Authentication
- [x] User Registration
- [x] Login / Logout
- [x] JWT Authentication
- [x] Email Verification
- [x] Forgot / Change Password
- [x] Role-Based Access Control
- [ ] Google OAuth 2.0 Login *(Coming Soon)*

### 👥 User Dashboards
- [ ] **Admin Dashboard**  
  - Manage users, appointments, and system analytics
- [ ] **Doctor Dashboard**  
  - View/manage appointments, medical records, prescriptions, and invoices
- [ ] **Customer Dashboard**  
  - Book appointments, view history, manage personal info

### 🗓️ Clinic Management
- [x] Book Appointments
- [ ] Create Invoices
- [ ] View Medical & Payment History

---

## 🛠️ Tech Stack

### Frontend
- React.js
- CSS + Tailwind CSS

### Backend
- Node.js
- Express.js
- MongoDB
- JWT for Authentication
- Nodemailer for Email Services

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the Repo
```bash
git clone https://github.com/your-username/vhealpoint.git
cd vhealpoint
Install Dependencies
```

### 2. Install Dependencies
``` bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Set Up Environment Variables
``` .env
PORT=5000
MONGO_URI=mongodb+srv://your-uri
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

### 4. Run the App
``` bash
# Start Backend
cd backend
npm run dev

# Start Frontend
cd ../frontend
npm start
```

## 📸 Screenshots:
*(Coming soon)*
