
# 🎬 Flicker - Video Streaming Backend(In Development Phase)

This is the backend  for a video streaming platform, built with **Node.js**, **Express**, and **MongoDB**. It supports essential features like user authentication, video upload, video streaming, likes/dislikes, comments, and playlists.

Tested using **Postman** for all major endpoints.

---

## 📦 Features

- 🔐 User Authentication (JWT-based)
- ☁️ Video Upload with Multer and Cloudinary
- 📺 Video Streaming Support
- ❤️ Like  Mechanism
- ⌚ View History
- 🙌 Subscribe/Unsubscribe
- 🍪 Secure Cookie-based Sessions
- 🔧 Built with Express, Mongoose, and CORS support

---

## 🧰 Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose)
- **File Upload:** Multer + Cloudinary
- **Authentication:** JWT
- **Other Libraries:** cookie-parser, dotenv, cors, bcrypt

---

## 📁 Project Structure

```
flicker/
├── controllers/      # Route handlers
├── middlewares/      # Middleware logic (auth, multer, error)
├── models/           # Mongoose schemas
├── routes/           # Express routes
├── utils/            # Helper utilities (e.g., error handler)
├── public/           # Publicly served static files
├── app.js            # Express app
├── index.js          # App entry point
├── .env              # Environment variables
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 16
- MongoDB running locally or via cloud (e.g. MongoDB Atlas)
- Cloudinary account for media storage

### Setup

```bash
git clone https://github.com/Pre-18/flicker.git
cd flicker
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🧪 Run Locally

```bash
npm run dev   # Uses nodemon for auto-reload
```

Access the API at: `http://localhost:8000/api/`

---

## 🧪 API Testing

All major routes have been tested using **Postman**.
You can test user registration, login, video upload, playlist creation, like/dislike, and comments using API endpoints.

---

## ✨ Scripts

- `npm run dev` – start with nodemon

---

## 🧹 Code Style

Prettier is used for code formatting. Config is in `.prettierrc`.

---

## 📄 License

[MIT](LICENSE)
