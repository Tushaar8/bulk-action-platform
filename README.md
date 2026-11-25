# Bulk Action Platform

A backend application that allows users to update multiple CRM contacts at once using asynchronous background processing.

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JavaScript

## Features

- Create and manage contacts.
- Perform bulk updates on multiple contacts.
- Process bulk actions asynchronously using a background worker.
- Track successful, failed, and skipped records.
- View bulk action status, statistics, and execution logs.
- Handle duplicate emails and invalid contact IDs.
- Rate limiting to prevent excessive API requests.
- Store jobs and logs in PostgreSQL.

## Project Structure

```text
bulk-action-platform/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── workers/
├── app.js
├── index.js
├── package.json
├── prisma.config.ts
├── .env.example
└── README.md
```

## Installation

**1. Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/bulk-action-platform.git
cd bulk-action-platform
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

Create a `.env` file in the project root:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME"
```

Replace the database details with your PostgreSQL credentials.

**4. Generate Prisma Client and run migrations**

```bash
npx prisma generate
npx prisma migrate dev
```

## Run the Application

Start the API server:

```bash
npm run dev
```

Start the background worker in a separate terminal:

```bash
npx tsx src/workers/bulkAction.worker.js
```

API URL: `http://localhost:5000`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/contacts` | Get all contacts |
| POST | `/contacts` | Create a contact |
| POST | `/bulk-actions` | Create a bulk action |
| GET | `/bulk-actions` | Get all bulk actions |
| GET | `/bulk-actions/:actionId` | Get action details |
| GET | `/bulk-actions/:actionId/stats` | Get action statistics |
| GET | `/bulk-actions/:actionId/logs` | Get execution logs |

## Bulk Action Example

**POST** `/bulk-actions`

Request body:

```json
{
  "entity": "Contact",
  "action": "update",
  "recordIds": [1, 2, 3],
  "data": {
    "status": "Inactive"
  }
}
```

The API queues the request and returns a response immediately. The background worker processes the records and stores the results.

## Job Processing

The application uses a PostgreSQL-backed job queue.

- Jobs are stored in PostgreSQL.
- A background worker processes pending jobs.
- `FOR UPDATE SKIP LOCKED` helps prevent multiple workers from processing the same job.
- Each record's result is stored in execution logs.

## Rate Limiting

Bulk action creation is limited to 10 requests per minute per IP address.
