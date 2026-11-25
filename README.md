# Bulk Action Platform

A scalable CRM Bulk Action Platform built using Node.js, Express.js, PostgreSQL, and Prisma ORM. The platform allows users to perform bulk operations on contact records asynchronously with background processing, execution logs, statistics, and API rate limiting.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Language:** JavaScript
- **Worker:** Custom PostgreSQL-backed job queue
- **Rate Limiting:** express-rate-limit
- **API Testing:** Postman

## Features

- Create, retrieve, and manage contacts.
- Perform bulk updates on multiple contact records.
- Asynchronous bulk action processing.
- Background worker for processing queued jobs.
- Persistent job storage using PostgreSQL.
- Track successful, failed, and skipped records.
- Detailed execution logs for each bulk action.
- Bulk action statistics and progress tracking.
- Duplicate email validation.
- Handle invalid or missing contact records.
- API rate limiting to prevent excessive requests.
- Database transactions and row locking for concurrent job processing.

## Project Structure

```text
bulk-action-platform/
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   │   └── prisma.js
│   │
│   ├── controllers/
│   │   ├── contacts.controller.js
│   │   └── bulkAction.controller.js
│   │
│   ├── middleware/
│   │   └── rateLimiter.js
│   │
│   ├── routes
