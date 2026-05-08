<div align="center">

# ⬡ InfraLink

### **Unified Business Identity & Active Intelligence Platform**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-infralink--delta.vercel.app-7cff67?style=for-the-badge&logo=vercel&logoColor=white)](https://infralink-delta.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Nitinmall--1390-5227FF?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Nitinmall-1390/Infralink)

**One UBID per business. Zero system modifications. Infinite intelligence.**

</div>

---

## 🎯 What is InfraLink?

**InfraLink** is an **AI-powered GovTech platform** that solves the critical problem of **fragmented business identity records** across government departments. Using cutting-edge **deep learning**, **knowledge graphs**, and **survival analysis**, InfraLink creates a **single authoritative identity** (UBID) for every business—without requiring any changes to existing government systems.

### The Problem We Solve

Government departments maintain separate databases for registrations, tax, labor, and compliance. The same business appears multiple times with slight variations in name, address, or identifiers—creating **duplicates**, **fraud vulnerabilities**, and **blind spots in policy-making**.

### Our Solution

InfraLink acts as an **intelligent overlay layer** that:
- **Resolves** duplicate records across departments using Siamese Neural Networks
- **Clusters** related entities into canonical businesses using Knowledge Graphs
- **Assigns** permanent UBIDs (Unique Business Identifiers)
- **Predicts** business lifecycle status (Active/Dormant/Closed) with survival analysis
- **Provides** human-in-the-loop governance for critical decisions

---

## ✨ Key Features

| Feature | Technology | Description |
|---------|------------|-------------|
| 🤖 **AI Entity Resolution** | Siamese Neural Networks + FastText | >90% precision duplicate detection using semantic embeddings, phonetic matching, and address normalization |
| 🕸️ **Knowledge Graph Intelligence** | Neo4j + Louvain Clustering | Graph-based entity clustering with transitive similarity detection at scale |
| 🪪 **UBID Assignment** | Cryptographic Hashing | Permanent, auditable, reversible Unique Business Identifiers derived from PAN/GSTIN |
| 📈 **Business Activity Intelligence** | Cox Proportional Hazards | Survival analysis predicts Active/Dormant/Closed status from filing patterns |
| 🧑‍⚖️ **Human-in-the-Loop Review** | React + Real-time APIs | Reviewer dashboard with confidence scores, explanations, and feedback loops |
| 🔍 **Explainable AI (XAI)** | Feature Attribution | Full audit trails with probability breakdowns for regulatory compliance |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │   Landing   │ │  Dashboard  │ │  React + Vite + Framer  │   │
│  │    Page     │ │   (6 Tabs)  │ │   Motion + XYFlow       │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      API GATEWAY LAYER                          │
│              FastAPI + SQLAlchemy + Neo4j Driver                │
├─────────────────────────────────────────────────────────────────┤
│                      AI/ML ENGINE LAYER                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │   Siamese   │ │   Louvain   │ │   Cox Survival          │   │
│  │   Network   │ │  Clustering │ │   Analysis              │   │
│  │  (PyTorch)  │ │  (Neo4j)    │ │  (Lifelines)            │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      DATA PERSISTENCE LAYER                     │
│              PostgreSQL (Records) + Neo4j (Graph)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 The 6-Step Pipeline

| Step | Stage | Technology | Description |
|------|-------|------------|-------------|
| **01** | 📥 Data Ingestion | CSV/REST API/JSON | Zero-schema record extraction from any source |
| **02** | ⚙️ Feature Engineering | FastText + libpostal | Semantic embeddings, address parsing, identifier normalization |
| **03** | 🤖 AI Matching | Siamese Neural Network | Similarity scoring with threshold-based blocking (100k records < 30 min) |
| **04** | 🕸️ Graph Clustering | Neo4j + Louvain | Community detection for canonical entity identification |
| **05** | 🪪 UBID Assignment | Hash-based Generation | Permanent identifiers with full audit trail |
| **06** | 🧑‍💻 Human Review | React Dashboard | Governance interface with explanations and feedback loops |

---

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12.3-FF0055?logo=framer&logoColor=white)
![React Flow](https://img.shields.io/badge/XYFlow-12.1-1C1C1C?logo=reactflow&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide%20Icons-Latest-F59E0B?logo=lucide&logoColor=white)

### Backend
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-4169E1?logo=postgresql&logoColor=white)
![Neo4j](https://img.shields.io/badge/Neo4j-Latest-008CC1?logo=neo4j&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-Latest-EE4C2C?logo=pytorch&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-Latest-F7931E?logo=scikit-learn&logoColor=white)

### Infrastructure
![Vercel](https://img.shields.io/badge/Vercel-Frontend-000000?logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-Backend-46E3B7?logo=render&logoColor=black)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Python 3.9+
- PostgreSQL 14+
- Neo4j 5+

### Installation

```bash
# Clone the repository
git clone https://github.com/Nitinmall-1390/Infralink.git
cd Infralink

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend2/backend2/entitynet-backend
pip install -r requirements.txt

# Start frontend (from root)
npm run dev

# Start backend (from backend directory)
python run.py
```

### Environment Variables

Create `.env` in the backend directory:
```env
DATABASE_URL=postgresql://user:password@localhost/infralink
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
```

---

## 📊 Dashboard Modules

| Module | Purpose |
|--------|---------|
| **Entity Resolution** | AI-powered duplicate detection with confidence scoring |
| **Knowledge Graph** | Interactive 2D/3D visualization of entity relationships |
| **UBID Profile** | Unified business identity cards with complete history |
| **Reviewer Panel** | Human governance interface for validation workflows |
| **Analytics** | SQL + Graph query interface for custom insights |
| **Risk Intelligence** | Fraud detection and anomalous pattern identification |

---

## 🎨 Design Philosophy

- **Dark-first UI**: Reduced eye strain for extended analysis sessions
- **Aurora Backgrounds**: Animated gradient mesh using WebGL shaders
- **Scroll Reveal**: Intersection Observer-based progressive disclosure
- **Micro-interactions**: Framer Motion for fluid state transitions
- **Accessibility**: Full keyboard navigation and screen reader support

---

## 📈 Performance Metrics

- **Entity Matching**: >90% precision on government datasets
- **Processing Speed**: 100,000 records in <30 minutes
- **Graph Query**: Sub-100ms for neighbor traversal queries
- **Survival Prediction**: 85%+ accuracy on business lifecycle forecasting

---

## 🔮 Future Roadmap

- [ ] Multi-language support (Hindi, Tamil, Telugu)
- [ ] Blockchain-based UBID anchoring
- [ ] Real-time streaming pipeline (Kafka)
- [ ] Advanced fraud detection with GNNs
- [ ] Mobile companion app
- [ ] API marketplace for third-party integrations

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Team

Built with 💚 by the InfraLink Team

---

<div align="center">

**[🌐 Live Demo](https://infralink-delta.vercel.app/)** · **[📂 Repository](https://github.com/Nitinmall-1390/Infralink)**

*One Identity. Infinite Intelligence.*
