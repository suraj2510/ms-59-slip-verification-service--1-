# 🧾 Slip Verification Service (MS-59)

## 📌 Overview
This microservice allows counter staff to verify **queue slips** shown by customers via QR codes.  
It prevents fake/duplicate slip usage by validating slips in real-time.

**Flow:**
1. Customer shows QR code (digital slip).  
2. Staff scans QR at counter.  
3. System validates against database.  
4. Slip marked as **used** once verified.  

---

## ⚙ Features
- REST API endpoint: `/queue/verify/{slipId}`  
- Validations:
  - ✅ Slip is valid & unused → mark as used  
  - ❌ Expired slip  
  - ❌ Already used  
  - ❌ Invalid QR/slipId  
- Counter-side web/mobile app for scanning slips  
- Built with:
  - Backend → **Node.js + Express + Prisma (SQLite)**  
  - Frontend → **React + QR Scanner**  

---

## 📂 Project Structure
MS-59-SLIP-VERIFICATION-SERVICE/
│
├── frontend/ # React QR Scanner App
│ ├── public/
│ ├── src/
│ │ └── App.js
│ ├── package.json
│ └── webpack.config.js
│
├── prisma/ # Prisma schema
│ └── schema.prisma
│
├── scripts/ # Scripts for DB seeding
│ └── seed.js
│
├── src/ # Backend API (Express)
│ └── index.js
│
├── package.json # Backend dependencies
├── .babelrc
└── README.md # Project guide

yaml
Copy code

---

## 🚀 Setup & Run

### 1️⃣ Backend (API)
1. Open VS Code → Terminal →  
   ```bash
   cd MS-59-SLIP-VERIFICATION-SERVICE
   npm install
Setup database with Prisma:

bash
Copy code
npx prisma migrate dev --name init
(Optional) Seed database with sample slips:

bash
Copy code
node scripts/seed.js
Start backend:

bash
Copy code
npm start
✅ Runs at http://localhost:4000

2️⃣ Frontend (Counter App)
Open a new terminal →

bash
Copy code
cd MS-59-SLIP-VERIFICATION-SERVICE/frontend
npm install
npm start
React app runs at:
👉 http://localhost:3000

🔄 Workflow
Staff opens the Counter App (React).

Scans customer’s QR slip.

App calls API → /queue/verify/{slipId}.

Backend checks DB → returns response:

✅ Valid → “Slip Verified”

❌ Expired / Already used / Invalid slip → error message

🧪 Testing
Try scanning:

A valid slip (from seeded DB).

An expired slip (manually update expiry in DB).

A duplicate slip (scan twice).

An invalid QR (random text).

📌 Future Enhancements
🔑 JWT-based access control for staff.

☁ Deploy backend to Azure API Gateway.

📱 Package frontend as mobile app (React Native).
