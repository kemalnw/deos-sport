# Deos Sport API (Project Showcase)

This repository is an archive of the **Deos Sport API**, a backend project I developed in 2020.  
It serves as a personal portfolio showcase to demonstrate how I approached project structure, tooling, and environment setup at the time.

> 📦 This is a **showcase project**, not actively maintained. The codebase reflects my practices and experience during the period it was built.

---

## Requirements

To run this project locally, ensure the following dependencies are installed:

- [Node.js](https://nodejs.org/en/) >= v12 (LTS)
- [Redis](https://redis.io/)
- [PM2](https://www.npmjs.com/package/pm2)
- [Sequelize CLI](https://www.npmjs.com/package/sequelize-cli)
- [MySQL](https://dev.mysql.com/downloads/mysql/)

---

## Getting Started

Clone the repository and run the following commands to install dependencies and start the server.

```bash
# Navigate to the API directory
cd api

# Install global dependencies
npm install -g pm2 sequelize-cli

# Install project dependencies
npm install

# Start the development server
npm run dev