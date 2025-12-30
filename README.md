<h1 align="center">💬 Full-Stack Real-Time Chat Application</h1>

<p align="center">
  A modern, feature-rich chat application built with the MERN stack, featuring real-time messaging, JWT authentication, and email notifications.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-grey?style=for-the-badge&logo=tailwind-css&logoColor=38B2AC" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io" />
</p>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Authentication & Security

- 🔐 Custom JWT-based authentication system
- 🚦 API rate limiting with Arcjet
- 🔒 Secure password hashing and validation
- 🛡️ Protected routes and middleware

### Real-Time Communication

- ⚡ Instant messaging via Socket.io
- 🟢 Online/offline user presence indicators
- 🔔 Audio notifications for messages (toggleable)

### User Experience

- 📨 Automated welcome emails via Resend
- 🖼️ Image upload and sharing (Cloudinary integration)
- 🎨 Modern UI with Tailwind CSS and DaisyUI
- 🧠 Efficient state management with Zustand

### Development

- 🧰 RESTful API architecture
- 🗂️ MongoDB for scalable data persistence
- 🧑‍💻 Professional Git workflow (branches, PRs, code reviews)

---

## 🛠️ Tech Stack

### Backend

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Real-time:** Socket.io
- **Authentication:** JWT (jsonwebtoken)
- **Email Service:** Resend
- **File Storage:** Cloudinary
- **Security:** Arcjet (rate limiting)

### Frontend

- **Framework:** React 18
- **Styling:** Tailwind CSS + DaisyUI
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Real-time Client:** Socket.io-client
- **Build Tool:** Vite

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm**
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git**

You'll also need accounts and API keys for:

- [Resend](https://resend.com/) (for email services)
- [Cloudinary](https://cloudinary.com/) (for image uploads)
- [Arcjet](https://arcjet.com/) (for rate limiting)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone git@github.com:Zeh-Eox/astrotalk.git
cd astrotalk
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## 🔐 Environment Variables

### Backend Configuration

Create a `.env` file in the `/backend` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017
# Or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Chat App

# Frontend URL
CLIENT_URL=http://localhost:5173

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Arcjet Security
ARCJET_KEY=ajkey_xxxxxxxxxxxxxxxxxxxxxxxxxx
ARCJET_ENV=development
```

### Frontend Configuration (Optional)

Create a `.env` file in the `/frontend` directory if needed:

```env
VITE_API_URL=http://localhost:3000
```

---

## 🏃 Running the Application

### Development Mode

#### Start the Backend Server

```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:3000`

#### Start the Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Production Build

```bash
cd astrotalk
npm run build
npm run start
```

The app will start on `http://localhost:3000`

---

## 📁 Project Structure

```
astrotalk/
├── backend/
│   ├── src/
│        ├── models/
│        ├── routes/
│        ├── middleware/
│        ├── controllers/
│        ├── lib/
│        ├── types/
|        ├── emails/
│        └── server.ts
│
├── frontend/
│   ├── src/
│        ├── components/
│        ├── pages/
│        ├── store/
│        ├── lib/
│        ├── hooks/
|        ├── types/
│        └── App.tsx
│
└── README.md
```

---

## 📡 API Documentation

### User Endpoints

| Method | Endpoint                      | Description                  |
| ------ | ----------------------------- | ---------------------------- |
| POST   | `/api/v1/auth/signup`         | Register a new user          |
| POST   | `/api/v1/auth/login`          | Authenticate user            |
| POST   | `/api/v1/auth/logout`         | End user session             |
| GET    | `/api/v1/auth/check`          | Verify authentication status |
| PUT    | `/api/v1/auth/update-profile` | Verify profile picture       |

### Message Endpoints

| Method | Endpoint                    | Description               |
| ------ | --------------------------- | ------------------------- |
| GET    | `/api/v1/messages/:id`      | Get conversation by user  |
| POST   | `/api/v1/messages/send/:id` | Send a message            |
| GET    | `/api/v1/messages/contacts` | Get all users for sidebar |
| GET    | `/api/v1/messages/chats`    | Get all chats for sidebar |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation as needed

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Socket.io for real-time communication
- Tailwind CSS and DaisyUI for the beautiful UI
- Resend for reliable email delivery
- Cloudinary for image management
- Arcjet for security features

---

## 📧 Contact

For questions or support, please open an issue or contact:

- **Email:** arnoldcnv99@gmail.com
- **GitHub:** [Zeh-Eox](https://github.com/Zeh-Eox)

---

<p align="center">Made with ❤️ by Arnold_C</p>
