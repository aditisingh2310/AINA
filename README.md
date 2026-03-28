# 🛡️ AINA – Women Safety & Legal Evidence App

> **AINA (AI-based Incident & Narrative Archive)** is a privacy-first mobile application designed to empower women to document harassment, generate legal-ready evidence, and trigger emergency assistance — safely, silently, and securely.

---

## 🎯 Vision

To provide every woman with a **digital legal shield** — a tool that transforms undocumented harassment into **structured, time-stamped, and actionable evidence**.

---

## 🚨 Problem Statement

Harassment cases often fail due to:

* Lack of **documented evidence**
* "He said, she said" ambiguity
* Inability to safely record incidents in real time
* Financial and psychological control over victims

---

## 💡 Solution

AINA enables users to:

* 📌 Log incidents with encrypted evidence (text, audio, images)
* 🤖 Automatically classify and structure incidents using AI
* 📊 Generate **Pattern of Behavior Reports**
* 🚨 Trigger **silent SOS alerts**
* 🔐 Store all data in a **Zero-Knowledge encrypted vault**

---

## ⚙️ Tech Stack

### 📱 Frontend

* React Native (Expo)
* Axios (API communication)
* React Navigation

### 🖥️ Backend

* Node.js + Express
* JWT Authentication
* REST APIs

### 🗄️ Database

* PostgreSQL
* Prisma ORM

### 🤖 AI Integration

* Google DeepMind (Gemini API)

  * Incident classification
  * Entity extraction (Who, When, Type, Severity)

---

## 🔐 Security Architecture

* 🔒 End-to-End Encryption (E2EE)
* 🧾 SHA-256 hashing for evidence integrity
* 🔑 User-controlled encryption keys (not stored on server)
* 🧠 Zero-Knowledge backend (server cannot read user data)

---

## 📦 Core Features

### 1. 📝 Incident Logging

* Capture harassment details
* Attach encrypted evidence
* AI auto-tags incidents

---

### 2. 📊 Pattern Detection Engine

* Tracks frequency of abuse
* Identifies escalation trends
* Generates structured summaries

---

### 3. 🚨 Silent SOS System

* One-tap emergency trigger
* Sends location + encrypted audio
* Notifies trusted contacts instantly

---

### 4. 👥 Trusted Contacts

* Add emergency contacts
* Priority-based alert system

---

### 5. 📄 Report Generator

* Timeline of incidents
* Categorized abuse patterns
* Exportable legal-ready reports

---

## 🧱 Project Structure

### 📁 Backend

```
backend/
 ├── controllers/
 ├── routes/
 ├── middleware/
 ├── prisma/
 ├── utils/
 └── server.js
```

### 📁 Frontend

```
frontend/
 ├── screens/
 ├── services/
 ├── components/
 └── App.js
```

---

## 🚀 Getting Started

### 🔧 Backend Setup

```bash
cd backend
npm install
```

Create `.env`:

```env
DATABASE_URL=your_postgres_url
JWT_SECRET=your_secret
```

Run:

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

---

### 📱 Frontend Setup

```bash
cd frontend
npm install
npx expo start
```

Update API base URL:

```javascript
baseURL: "http://YOUR_IP:5000"
```

---

## 🔄 App Flow

1. User signs up / logs in
2. Adds trusted contacts
3. Logs incidents securely
4. AI processes and categorizes data
5. Data stored encrypted
6. SOS can be triggered anytime
7. Reports generated when needed

---

## 🌍 Impact

AINA addresses:

* 🛑 Domestic violence
* 🛑 Workplace harassment
* 🛑 Financial abuse
* 🛑 Psychological manipulation (gaslighting)

---

## 🧠 Innovation Highlights

* 📈 **Behavior Pattern Intelligence**
* 🤫 **Silent Emergency Activation**
* 🔐 **Zero-Knowledge Evidence Vault**
* ⚖️ **Legal-Ready Documentation**

---

## 🚧 Future Roadmap

* 🔊 Subvocal SOS trigger (whisper detection)
* 📍 Live location tracking
* 🧠 Advanced AI risk prediction
* ☁️ Cloud storage (AWS S3)
* 📄 PDF legal report export
* 🏛️ Integration with legal services

---

## 🤝 Contributing

Contributions are welcome!
Feel free to fork, open issues, and submit PRs.

---

## ⚠️ Disclaimer

AINA is a support tool and does not replace law enforcement or emergency services.

---

## ❤️ Built With Purpose

> "Safety is not a privilege — it’s a right."

AINA is built to ensure no voice goes unheard, and no incident goes undocumented.
