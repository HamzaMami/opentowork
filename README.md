# OpenToWork - MERN Stack DevOps Project

A professional-grade MERN (MongoDB, Express, React, Node.js) stack application designed for a university DevOps project, featuring production-ready containerization, CI/CD pipeline support, and comprehensive monitoring capabilities.

## Project Overview

OpenToWork is a freelance marketplace platform that connects clients with freelancers. This DevOps implementation focuses on:
- Microservice-ready architecture
- Production containerization (Docker)
- Local orchestration (Docker Compose)
- Health checks and metrics for monitoring
- Unit test scaffolding (Mocha/Chai, Jest)
- Professional CI/CD pipeline setup

## Project Structure

```
opentowork/
├── backend/                    # Node.js/Express backend
│   ├── app.js                 # Express app (reusable module)
│   ├── server.js              # Server entry point
│   ├── socket.js              # Socket.IO setup
│   ├── config/                # Database and environment config
│   ├── middleware/            # Auth and custom middleware
│   ├── models/                # Mongoose schemas
│   ├── routes/                # API endpoints
│   ├── tests/                 # Mocha/Chai test suite
│   ├── package.json
│   └── .env                   # Environment variables
│
├── frontend/                  # React/Vite frontend
│   ├── src/
│   │   ├── api.js            # Axios client setup
│   │   ├── App.jsx           # Main app component
│   │   ├── components/       # React components
│   │   ├── context/          # React context (auth)
│   │   ├── hooks/            # Custom hooks
│   │   ├── utils/            # Utility functions
│   │   └── __tests__/        # Jest test suite
│   ├── vite.config.js
│   ├── jest.config.cjs
│   ├── babel.config.cjs
│   ├── package.json
│   └── index.html
│
├── docker/
│   ├── backend/
│   │   └── Dockerfile        # Production backend image
│   └── frontend/
│       ├── Dockerfile        # Production frontend image (multi-stage)
│       └── nginx.conf        # Nginx SPA routing config
│
├── k8s/                       # Kubernetes manifests (future)
│   └── README.md             # Deployment guidelines
│
├── docker-compose.yml         # Local dev stack orchestration
├── .dockerignore              # Docker build exclusions
└── package.json              # Root workspace scripts
```

## Technology Stack

### Backend
- **Runtime**: Node.js 22 (Alpine)
- **Framework**: Express 5.x
- **Database**: MongoDB 7
- **WebSocket**: Socket.IO 4.x
- **Auth**: JWT + bcryptjs
- **Monitoring**: Prometheus client (prom-client)
- **Testing**: Mocha + Chai + Supertest
- **File Upload**: Multer

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 6
- **HTTP Client**: Axios
- **Routing**: React Router v7
- **Styling**: CSS (custom + utility classes)
- **Testing**: Jest + Babel
- **UI Components**: Custom component library

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx (frontend)
- **Monitoring**: Prometheus-ready endpoints

## Prerequisites

- **Node.js** 20+ (for local development)
- **MongoDB** 7+ (local or Docker)
- **Docker** & **Docker Compose** (for containerization)
- **Git** (for version control)

## Local Installation

### 1. Clone the Repository
```bash
git clone https://github.com/HamzaMami/opentowork.git
cd opentowork
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### 3. Configure Environment Variables

**Backend (.env):**
```bash
cd backend
cp .env.example .env  # If available, or create manually
```

Required variables:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/opentowork
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

**Frontend (.env):**
Optional - defaults to `http://localhost:5000`
```
VITE_API_URL=http://localhost:5000
```

## Running Locally

### Option 1: Native Development

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

**Prerequisites:**
- MongoDB must be running on `localhost:27017`

### Option 2: Docker Compose (Recommended)

Start the entire stack with one command:
```bash
docker-compose up
```

This starts:
- **MongoDB** on `localhost:27017`
- **Backend API** on `localhost:5000`
- **Frontend** on `localhost:80`

Stop the stack:
```bash
docker-compose down
```

Stop and remove volumes:
```bash
docker-compose down -v
```

## Testing

### Backend Tests (Mocha/Chai)
```bash
cd backend
npm test
```

Includes:
- `/health` endpoint validation
- `/metrics` endpoint validation
- Response timing checks

### Frontend Tests (Jest)
```bash
cd frontend
npm test
```

Includes:
- Utility function tests
- Component rendering tests
- Format utility validation

### Test Coverage
Run with coverage report:
```bash
npm test -- --coverage
```

## API Endpoints

### Health & Monitoring

**Health Check:**
```http
GET /health
```
Response:
```json
{
  "status": "ok",
  "uptime": 1234.56,
  "timestamp": "2026-04-25T10:30:00.000Z",
  "mongodb": "connected"
}
```

**Prometheus Metrics:**
```http
GET /metrics
```
Returns Prometheus-format metrics for monitoring and alerting.

### Authentication

**Register:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password",
  "role": "client"  // or "freelancer"
}
```

**Login:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure_password"
}
```

### Wallet

**Get Wallet:**
```http
GET /api/wallet
Authorization: Bearer {token}
```

**Add Funds (Clients):**
```http
POST /api/wallet/deposit
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 100,
  "paymentMethod": {"type": "card", "last4": "4242"}
}
```

**Withdraw Funds (Freelancers):**
```http
POST /api/wallet/withdraw
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 50,
  "withdrawalMethod": {"type": "bank"}
}
```

## Production Deployment

### Build Docker Images

**Backend:**
```bash
docker build -f docker/backend/Dockerfile -t opentowork-backend:latest .
```

**Frontend:**
```bash
docker build -f docker/frontend/Dockerfile -t opentowork-frontend:latest .
```

### Kubernetes Deployment

See [k8s/README.md](k8s/README.md) for Kubernetes manifests and deployment guidelines.

Includes:
- Deployment configurations for backend and frontend
- Service definitions for internal/external access
- ConfigMaps for environment settings
- Secrets for sensitive data (passwords, tokens)
- Ingress configuration for external routing

### Environment Variables for Production

Set these in your deployment platform (K8s secrets, Docker secrets, etc.):

```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/opentowork
JWT_SECRET=strong-production-secret-key
NODE_ENV=production
VITE_API_URL=https://api.yourdomain.com
```

## CI/CD Pipeline Integration

The project is ready for CI/CD integration. Recommended steps:

1. **Test Stage**: Run `npm test` in both backend and frontend
2. **Build Stage**: Build Docker images
3. **Push Stage**: Push to container registry (Docker Hub, ECR, etc.)
4. **Deploy Stage**: Deploy to Kubernetes or Docker Swarm

Example GitHub Actions workflow available upon request.

## Troubleshooting

### Backend won't start
- Check MongoDB connection: `mongo mongodb://localhost:27017/opentowork`
- Verify `MONGO_URI` in `.env`
- Check port 5000 is available: `netstat -an | grep 5000`

### Frontend build warnings
- Large chunk warning is non-fatal
- To fix, implement route-based code splitting in future versions

### Socket.IO connection issues
- Ensure backend is running
- Check CORS settings if frontend and backend on different origins
- Verify firewall allows WebSocket connections

### Docker Compose fails
- Ensure Docker daemon is running
- Free up ports 80, 5000, 27017
- Run `docker-compose logs` to see detailed errors

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "feature: description"`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

## License

This project is part of an ITBS university DevOps course and is for educational purposes.

## Contact

**Project Lead**: Hamza Mami  
**GitHub**: [HamzaMami](https://github.com/HamzaMami)  
**Email**: Contact via GitHub

---

**Last Updated**: April 25, 2026  
**Version**: 1.0.0 (DevOps Ready)
