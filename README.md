# vHealPoint 🩺  
<p align="center">
  <img src="frontend/src/assets/vHealPoints2_trans.png" alt="vHealPoint Banner" width="30%" />
</p>
<p align="center"><em>A modern web platform to connect patients with doctors and manage clinic appointments seamlessly.</em></p>                                                               

## 🌐 Overview

**vHealPoint** is a full-stack web application that revolutionizes healthcare management by providing a digital platform for connecting patients with healthcare providers. Our solution streamlines the appointment booking process and enhances patient-doctor communication.

---

## ✨ Key Features

### 🔐 Authentication & Security
- [x] User Registration with Email Verification
- [x] Secure Login / Logout System
- [x] JWT Authentication
- [x] Email Verification System
- [x] Password Recovery & Reset
- [x] Role-Based Access Control (Admin, Doctor, Patient)
- [ ] Google OAuth 2.0 Integration *(Coming Soon)*

### 👥 User Dashboards
- [ ] **Admin Dashboard**  
  - User Management & Analytics
  - System Configuration
  - Appointment Oversight
- [ ] **Doctor Dashboard**  
  - Appointment Management
  - Patient Records
  - Schedule Management
- [ ] **Patient Dashboard**  
  - Appointment Booking
  - Medical History
  - Profile Management

### 🗓️ Clinic Management
- [x] Real-time Appointment Booking
- [x] Medical Records Management
- [x] Schedule Management
- [x] Patient History Tracking
- [x] Doctor's Feedbacks
- [ ] Real-time notification using Socket.io *(Coming Soon)*

---

## 🛠️ Technology Stack

### Frontend
- React.js (Latest Version)
- Tailwind CSS + CSS
- Responsive Design
- Modern UI/UX

### Backend
- Node.js & Express.js
- MongoDB Database
- JWT Authentication
- Nodemailer for Email Services
- RESTful API Architecture

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- npm or yarn package manager
- Git

### Installation Steps

1. **Clone the Repository**
```bash
git clone https://github.com/vule1712/vhealpoints.git
cd vhealpoint
```

2. **Install Dependencies**
```bash
# Backend Setup
cd backend
npm install

# Frontend Setup
cd ../frontend
npm install
```

3. **Environment Configuration**
Create `.env` files in both frontend and backend directories:

Backend `.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://your-uri
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

Frontend `.env`:
```env
VITE_API_URL=http://localhost:5000
```

4. **Start the Application**
```bash
# Start Backend Server
cd backend
npm run dev

# Start Frontend Development Server
cd ../frontend
npm run dev
```

## 📝 API Documentation
*(Coming Soon)*

## 🤝 Contributing
We welcome contributions! Please read our contributing guidelines before submitting pull requests.

## 📸 Screenshots
*(Coming Soon)*

## 📞 Support
For support, email vhealpointsa@gmail.com or open an issue in the repository.
