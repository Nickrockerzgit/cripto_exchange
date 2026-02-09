# 🚀 Node.js Backend API

A layered architecture backend built with **Node.js, Express, Prisma, and MySQL**.

---

## 📦 Tech Stack

- ⚡ Node.js
- 🚏 Express.js
- 🗄 Prisma ORM
- 🐬 MySQL
- 🔄 Nodemon

---

## 📥 Getting Started

Follow these steps to run the project locally.

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/your-repository-name.git
cd your-repository-name


 2️⃣ Install Dependencies
npm install

3️⃣ Setup Environment Variables

Create a .env file in the root directory:

DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/DATABASE_NAME"
PORT=5000


🔹 Replace with your actual database credentials.

4️⃣ Setup Database (Prisma)
npx prisma migrate dev


This will create the required tables in your database.

5️⃣ Start the Development Server
npx nodemon src/server.js


Or if script exists:

npm run dev

🌐 Server URL

Once running:

http://localhost:5000




📁 Project Structure
src/
├── config/
├── controllers/
├── services/
├── repositories/
├── routes/
├── middlewares/
└── server.js
