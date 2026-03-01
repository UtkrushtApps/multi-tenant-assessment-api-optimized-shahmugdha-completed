# Node.js + MongoDB Intermediate Optimization Task

## Task Overview

Utkrusht operates a multi-tenant proof-of-skills SaaS platform where each customer (tenant) runs assessments and collects large volumes of candidate submissions. The backend is a Node.js (Express) REST API backed by MongoDB via Mongoose, and it is already fully functional and deployed using Docker. However, as some tenants grow to hundreds of thousands of submissions, listing and reporting endpoints begin to respond significantly slower than for smaller tenants, even though the logic and results are correct.

In this task, you will work on an existing, working codebase that intentionally includes subtle performance issues in how MongoDB is queried and how the Node.js API processes and returns data. The optimization focus is **balanced**: you will need to reason about both the MongoDB layer (query patterns, schema usage, data access) and the Node.js API layer (how endpoints fetch, aggregate, and shape responses). Your goal is to preserve the current functional behavior while improving performance and scalability for large tenants.

## Helpful Tips

- Consider how request patterns differ between small and large tenants and what that implies for query design and data access.
- Consider how your Express routing, controllers, services, and data-access code are structured, and whether responsibilities are clearly separated for easier optimization.
- Think about how asynchronous operations interact with the Node.js event loop, especially when multiple database queries are issued per request.
- Think about how much data is being transferred between MongoDB and the API, and which fields are actually required by the client.
- Explore ways to avoid unnecessary round-trips to the database when composing responses that involve related entities.
- Explore how pagination, sorting, and filtering are currently implemented and how they behave as data volume grows.
- Review how validation, middleware, and helpers are used in the request pipeline and whether they introduce avoidable overhead.
- Review error propagation from the database layer up through API responses to ensure failures are surfaced consistently and logged appropriately.
- Analyze how query patterns and schema choices affect performance under concurrent access from multiple tenants.
- Analyze whether different endpoints repeatedly perform similar calculations or transformations that could be simplified or centralized.
- Consider strategies to keep data-access and service modules testable and easy to reason about while making performance-related changes.
- Consider using modern Node.js language features (async/await, Promise utilities) to manage concurrent work cleanly without blocking.
- Explore resilience techniques such as connection pooling and careful handling of long-running or heavy queries.
- Review opportunities to encapsulate shared logic (filter construction, pagination, response shaping) into reusable utilities.

## Database Access

- Host: `<DROPLET_IP>`
- Port: `27017`
- Database name: `utkrusht_multitenant`
- Username: `utkrusht_user`
- Password: `utkrusht_pass`

The Node.js API already connects to this database using Mongoose from within the Docker network. You can also connect directly using any MongoDB client tools you prefer (e.g., MongoDB Compass, mongosh) to inspect collections, analyze query performance, and experiment with index usage.

## Objectives

- Understand the existing multi-tenant assessment API behavior, especially how listing and reporting endpoints behave for tenants with very different data volumes.
- Identify the main performance bottlenecks affecting large tenants across both the MongoDB and Node.js layers, without changing the functional behavior of the endpoints.
- Improve the performance characteristics of the slowest endpoints by refining data access patterns, eliminating unnecessary work, and making the API more efficient under load.
- Ensure that the optimized implementation remains easy to read and maintain, with clear separation of concerns between routing, business logic, and data access.
- Preserve correctness and API contracts: clients should receive the same functional results (status codes, payload structure), but with reduced latency and better scalability.
- Aim for changes that would reasonably support further growth in data volume and concurrent tenants without significant rewrites.

## How to Verify

- Use an HTTP client (such as Postman, curl, or a browser) to call the existing endpoints for both smaller and larger tenants before making changes, and note response times and behavior.
- After your optimizations, call the same endpoints again to confirm that response times for data-heavy tenants are noticeably reduced while results remain functionally equivalent.
- Observe how many database operations are issued per request (for example, by reviewing logs or attaching a profiler) and verify that redundant or repeated queries have been reduced.
- For database-related changes, verify that the most frequently used queries behave efficiently under load (e.g., they no longer degrade significantly as data volume grows) and can be executed without excessive memory use.
- Confirm that endpoints which return potentially large result sets behave more predictably and do not unnecessarily fetch or process data that is not required by the client.
- Ensure that error handling and logging remain consistent and helpful after your changes, with no regressions in robustness.

## NOT TO INCLUDE

This repository already contains a fully functional API and database setup. You should **not**:

- Rebuild the application from scratch or replace the framework/library choices.
- Add step-by-step implementation instructions or copy-paste snippets from this README into the code.
- Change deployment automation (Docker, docker-compose, run.sh) beyond what is strictly necessary to keep things running.
- Remove or bypass existing error handling or validation in ways that reduce robustness or security.
- Introduce breaking changes to existing endpoint contracts (paths, methods, basic response shapes) unless strictly required to fix a bug.
