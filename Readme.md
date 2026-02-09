🚀 Project Setup Guide

Follow the steps below to run this project on your local machine.

📥 1. Clone the Repository
git clone https://github.com/your-username/your-repository-name.git
cd your-repository-name

📦 2. Install Dependencies
npm install


This will install all required Node.js packages for the project.

⚙️ 3. Configure Environment Variables

Create a .env file in the root directory of the project and add your database credentials.

Example .env file:

DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/DATABASE_NAME"
PORT=5000


Replace the values with your actual database details:

USER → Your MySQL username

PASSWORD → Your MySQL password

DATABASE_NAME → Your database name

🗄 4. Setup the Database (Prisma)

If the project uses Prisma, run the following command to create database tables:

npx prisma migrate dev

▶️ 5. Start the Server (Development Mode)

You can start the server using Nodemon:

npx nodemon src/server.js


Or if a script is already defined in package.json:

npm run dev


The server will automatically restart whenever you make changes to the code.

🌐 Server URL

Once the server is running, you can access it at:

http://localhost:5000