# Bulk Action Platform

A backend application that enables users to perform bulk updates on CRM contacts through asynchronous background processing.

The platform accepts bulk-action requests, queues them in PostgreSQL, processes records using a separate worker, and tracks the result of each record.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Language:** JavaScript
- **Queue:** Custom PostgreSQL-backed job queue
- **Load Testing:** Autocannon
- **API Testing:** Postman

## Features

- Create and retrieve CRM contacts.
- Perform bulk updates on multiple contacts.
- Process bulk actions asynchronously using a background worker.
- Store queued jobs and execution logs in PostgreSQL.
- Track successful, failed, and skipped records.
- Retrieve action status and processing progress.
- Retrieve execution logs with status filters.
- Handle invalid contact IDs and duplicate IDs.
- Handle duplicate email conflicts.
- Rate limit bulk-action requests to 10 requests per minute per IP address.
- Support pagination for bulk-action and log retrieval.

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
├── generated/
├── app.js
├── index.js
├── prisma.config.ts
├── package.json
├── .env.example
├── BAP.postman_collection.json
├── seed-load-test.js
├── get-test-ids.js
├── create-load-test-action.js
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Tushaar8/bulk-action-platform.git
cd bulk-action-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME"
```

Replace the database credentials with your PostgreSQL configuration.

### 4. Generate Prisma Client and run migrations

```bash
npx prisma generate
npx prisma migrate dev
```

## Running the Application

The API server and background worker run as separate processes.

**Terminal 1 – Start the API server**

```bash
npm run dev
```

**Terminal 2 – Start the background worker**

```bash
npx tsx src/workers/bulkAction.worker.js
```

API base URL:

```text
http://localhost:5000
```

## API Endpoints

| Method | Endpoint                        | Description                |
| ------ | ------------------------------- | -------------------------- |
| GET    | `/contacts`                     | Retrieve contacts          |
| POST   | `/contacts`                     | Create a contact           |
| POST   | `/bulk-actions`                 | Create a bulk action       |
| GET    | `/bulk-actions`                 | Retrieve bulk actions      |
| GET    | `/bulk-actions/:actionId`       | Retrieve action details    |
| GET    | `/bulk-actions/:actionId/stats` | Retrieve action statistics |
| GET    | `/bulk-actions/:actionId/logs`  | Retrieve execution logs    |

### Log Filtering

Filter execution logs by status:

```text
GET /bulk-actions/:actionId/logs?status=success
GET /bulk-actions/:actionId/logs?status=failed
GET /bulk-actions/:actionId/logs?status=skipped
```

Pagination is supported for action and log retrieval.

## Creating a Bulk Action

**POST** `/bulk-actions`

Example request:

```json
{
  "entity": "contacts",
  "action": "update",
  "ids": [1, 2, 3],
  "data": {
    "status": "Inactive"
  }
}
```

The API responds with HTTP `202 Accepted` when the action is queued.

The background worker processes the records asynchronously.

## Job Processing Architecture

The platform uses a custom PostgreSQL-backed job queue instead of an external queue service.

Processing flow:

1. The client submits a bulk-action request.
2. The API validates the request and creates a bulk-action record.
3. The job is stored in PostgreSQL with a queued status.
4. The background worker fetches pending jobs.
5. PostgreSQL row locking with `FOR UPDATE SKIP LOCKED` helps prevent multiple workers from claiming the same job simultaneously.
6. The worker processes contact records in batches.
7. Individual results are stored as execution logs.
8. The bulk-action status and statistics are updated.

### Architecture Diagram

```text
              Client / Postman
                     |
                     v
               Express API
                     |
                     v
              Request Validation
                     |
                     v
              PostgreSQL DB
              /            \
             v              v
       Bulk Actions      Contacts
             |
             v
       Background Worker
             |
             v
       Record Processing
             |
             v
       Execution Logs
             |
             v
       Status & Statistics
             |
             v
           Client
```

## Scalability and Horizontal Scaling

The application separates API handling from background processing.

- API servers and background workers can run as separate processes.
- Multiple worker instances can be deployed to distribute queued jobs.
- PostgreSQL `FOR UPDATE SKIP LOCKED` supports safe concurrent job claiming.
- PostgreSQL stores job data and execution logs centrally.
- Batch processing reduces the overhead of handling large requests as individual jobs.

The current implementation uses a PostgreSQL-backed queue. Further production improvements could include worker concurrency tuning, retry handling, crash recovery, monitoring, and account-level rate limiting.

## Load Testing

Autocannon was used to test API performance locally.

**Test 1 – GET `/contacts`**

Command:

```bash
npx autocannon -c 50 -d 20 http://localhost:5000/contacts
```

Observed results:

- Concurrent connections: 50
- Duration: 20 seconds
- Average throughput: approximately 1,708 requests/second
- Average latency: approximately 28.79 ms
- Errors: 0

**Test 2 – GET `/bulk-actions`**

Command:

```bash
npx autocannon -c 50 -d 20 "http://localhost:5000/bulk-actions?page=1&limit=10"
```

Observed results:

- Concurrent connections: 50
- Duration: 20 seconds
- Average throughput: approximately 1,018 requests/second
- Average latency: approximately 48.56 ms
- Errors: 0

**Bulk Processing Test**

A bulk action containing 2,000 contact IDs was submitted and processed successfully.

| Metric        |    Result |
| ------------- | --------: |
| Total records |     2,000 |
| Successful    |     2,000 |
| Failed        |         0 |
| Skipped       |         0 |
| Remaining     |         0 |
| Progress      |      100% |
| Final status  | Completed |

_Note: Autocannon results are local API GET-request benchmarks. They are not production benchmarks or measurements of background-worker throughput._

## Rate Limiting

Bulk-action creation is limited to 10 requests per minute per IP address.

Requests exceeding this limit receive an HTTP `429 Too Many Requests` response.

## Postman Collection

The repository includes:

```text
BAP.postman_collection.json
```

Import this collection into Postman to test the available API endpoints.

## Future Improvements

- Configurable worker concurrency.
- Automatic retries for failed jobs.
- Improved crash recovery and job retry mechanisms.
- Account-level rate limiting.
- Scheduled bulk actions.
- Production monitoring and performance metrics.
- Additional CRM entity support.

## Repository

GitHub: https://github.com/Tushaar8/bulk-action-platform
