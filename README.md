# Backend Authentication API

A backend authentication system built using **Node.js**, **Express**, **MongoDB**, and **JWT**.

This project provides secure user authentication with protected routes using JSON Web Tokens.

---

## 🚀 Features

- User Registration
- User Login
- JWT-based Authentication
- Protected Routes (Profile & Dashboard)
- Password hashing using bcrypt
- Environment variable support using dotenv

---

## 🔐 API Endpoints

### Register User
POST /api/auth/register

### Login User
POST /api/auth/login

### Protected Profile Route
GET /api/auth/profile

### Protected Dashboard Route
GET /api/auth/dashboard

---

## 🔑 Authorization Header Format

For protected routes, send JWT token in headers:

Authorization: Bearer <your_jwt_token>

Example:
Authorization: Bearer <your_jwt_token>

---

## ▶️ How to Run the Project

### 1️⃣ Install dependencies
```bash
npm install
