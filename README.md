# ClinicConnect - Online Clinic Appointment Scheduling System

CMPE 172 Term Project - Full Stack Enterprise Application

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 3.2 |
| Database | MySQL 8.x (Relational SQL) |
| Persistence | JDBC with handwritten SQL (no ORM/JPA) |
| API | RESTful HTTP endpoints |
| Security | Spring Security + JWT |
| Frontend | React 18 + Vite |
| Integration | Mock Notification Service (REST) |
| Observability | SLF4J logging + `/health` endpoint |

## Architecture

```
[React Frontend] --HTTP/REST--> [Spring Boot Controllers]
                                       |
                                [Service Layer]
                                (Transactions, Business Logic,
                                 Concurrency Control)
                                       |
                                [Repository Layer]
                                (Handwritten JDBC SQL)
                                       |
                                   [MySQL DB]
                                       
Service Layer --REST--> [Mock Notification Service]
```

**Layered Architecture:** Controller -> Service -> Repository -> Database

## Prerequisites

- **Java 17+** (JDK)
- **Maven 3.8+**
- **MySQL 8.x**
- **Node.js 18+** and **npm**

## Quick Start

### 1. Setup MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Create the database
CREATE DATABASE clinic_connect;
```

### 2. Configure Backend

Edit `backend/src/main/resources/application.properties`:
```properties
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

### 3. Run Backend

```bash
cd backend
./mvnw spring-boot:run
```
The API will start at `http://localhost:8080`.

### 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
```
The frontend will start at `http://localhost:3000`.

## Default Accounts

All seed accounts use the password: **`password123`**

| Username | Role | Name |
|----------|------|------|
| admin | ADMIN | System Admin |
| dr.smith | DOCTOR | John Smith (Family Medicine) |
| dr.johnson | DOCTOR | Sarah Johnson (Pediatrics) |
| dr.chen | DOCTOR | Michael Chen (Dermatology) |
| patient1 | PATIENT | Alice Williams |
| patient2 | PATIENT | Bob Brown |

## API Endpoints

### Public Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | Patient registration |
| GET | `/api/doctors` | List all doctors |
| GET | `/api/services` | List clinic services |
| GET | `/api/departments` | List departments |
| GET | `/api/slots/available` | Browse available slots |
| GET | `/health` | Health check |

### Patient Endpoints (Authenticated)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/appointments/book` | Book appointment (transactional) |
| PUT | `/api/appointments/{id}/cancel` | Cancel appointment |
| GET | `/api/appointments/my` | View own appointments |

### Doctor Endpoints (Authenticated)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/slots` | Create single slot |
| POST | `/api/slots/batch` | Batch generate slots |
| PUT | `/api/slots/{id}/close` | Close a slot |
| DELETE | `/api/slots/{id}` | Delete available slot |
| GET | `/api/slots/my-schedule` | View own schedule |
| PUT | `/api/appointments/{id}/complete` | Mark appointment complete |

### Admin Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/users` | List all users |
| PUT | `/api/admin/users/{id}/toggle-active` | Toggle user status |
| GET | `/api/admin/dashboard` | Dashboard statistics |

## Enterprise Features

### Double-Booking Prevention (Concurrency Control)

The booking flow uses **pessimistic locking** with `SELECT ... FOR UPDATE`:

1. Transaction begins with `SERIALIZABLE` isolation
2. Slot row is locked via `SELECT * FROM availability_slots WHERE slot_id = ? FOR UPDATE`
3. Slot status is verified as `AVAILABLE`
4. Appointment record is created
5. Slot status is updated to `BOOKED`
6. Transaction commits atomically

This ensures **ACID compliance**:
- **Atomicity**: Both appointment creation and slot update succeed or fail together
- **Consistency**: Slot uniqueness constraint + status check prevents invalid state
- **Isolation**: `SERIALIZABLE` level prevents lost updates between concurrent bookings
- **Durability**: InnoDB ensures committed data survives crashes

### Mock External Service Integration

After booking/cancellation, the service layer calls a mock Notification Service via REST API, simulating a distribution boundary. This demonstrates:
- Coarse-grained REST API integration
- Best-effort notification (failure doesn't roll back booking)
- Logging of external service calls

### Observability

- Application events are logged via SLF4J
- Health endpoint at `GET /health` reports application and database status
- Spring Boot Actuator enabled at `/actuator/health`

## Database Schema

6 core tables with proper PKs, FKs, indexes, and constraints:

- `users` - All user accounts (PATIENT, DOCTOR, ADMIN)
- `departments` - Clinic departments
- `doctors` - Doctor profiles (FK to users, departments)
- `services` - Clinic services with duration/pricing
- `availability_slots` - Provider time slots (FK to doctors) with version column for optimistic locking
- `appointments` - Booked appointments (FKs to users, doctors, services, slots) with UNIQUE constraint on slot_id
- `notifications_log` - Notification audit trail

## Project Structure

```
backend/
├── src/main/java/com/clinicconnect/
│   ├── ClinicConnectApplication.java
│   ├── config/          # Security, JWT, CORS
│   ├── controller/      # REST endpoints
│   ├── dto/             # Request/Response DTOs
│   ├── exception/       # Global error handling
│   ├── integration/     # Mock notification client
│   ├── model/           # Entity classes
│   │   └── enums/       # Status enumerations
│   ├── repository/      # JDBC repositories (handwritten SQL)
│   └── service/         # Business logic layer
│       └── impl/        # Service implementations
├── src/main/resources/
│   ├── application.properties
│   ├── schema.sql       # DDL
│   └── data.sql         # Seed data
└── pom.xml

frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── context/         # React context (Auth)
│   ├── pages/           # Page components
│   ├── services/        # API client
│   ├── App.jsx          # Root with routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Sutter Health-inspired styles
├── index.html
├── package.json
└── vite.config.js
```
