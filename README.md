# MediTrack Lite

## 🩺 Project Overview
MediTrack Lite is a simple clinic management system that allows users to:
- Book appointments
- Manage prescriptions
- Submit feedback

It supports role-based access for **Doctors** and **Patients**.

---

## ⚙️ Tech Stack
- **Node.js** (Express.js)
- **Neon DB** (PostgreSQL cloud database)
- **EJS** (Templating Engine)
- **Bootstrap** (Styling)
- **pg** (PostgreSQL driver for Node.js)

---

## 🚀 Features
- Login & Logout (User Authentication)
- Doctor and Patient Dashboards
- Appointment Booking and Management
- Prescription Management
- Patient Feedback Submission
- Flash Messages for User Actions
- Clean Navigation:
  - Login / Logout
  - Dashboard
  - Appointments List
  - Profile Page

---

## 📂 Project Structure

```
/routes          → Route files  
/views           → EJS templates  
/public          → Static files (CSS, JS)  
/server.js       → Main server file  
.env             → Environment Variables (Database Connection)  
```

---

## 🛠️ Setup Instructions (How to Run Locally)

### 1. Clone the Repo:

```bash
git clone <repo-link>
cd <project-folder>
```

### 2. Install Dependencies:

```bash
npm install
```

### 3. Set up Database:

Add your Neon DB connection string in `.env`:

```bash
DATABASE_URL=your_neon_database_url
```

### 4. Initialize Database Tables:

```bash
npm run db:push
```

### 5. Start the App:

```bash
npm start
```

The app will run at:

> [http://localhost:5000](http://localhost:5000)

---

## 👨‍⚕️ Demo Credentials (for Testing)

### Doctor:

- **Email:** [doctor@meditrack.local](mailto\:doctor@meditrack.local)
- **Password:** doctor123

### Patient:

- **Email:** [patient@meditrack.local](mailto\:patient@meditrack.local)
- **Password:** patient123

---


## 📄 License

This project is for educational and demonstration purposes only.
