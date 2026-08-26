# Architecture

The client is a Vite React single-page application. `AuthContext` restores a stored JWT by calling `/auth/me`; protected routes wait for that process, and permission guards affect presentation only. Axios centrally attaches the bearer token and reacts to expired sessions.

The Express API follows route → authentication → permission → Zod validation → controller → service → MySQL. Controllers shape HTTP responses; all SQL remains in services or authentication/permission middleware. Queries are parameterized. Central middleware maps errors to the common response contract and suppresses raw database details.

The responsive application layout uses a persistent desktop sidebar and an overlay drawer on smaller screens. Navigation entries are derived from server-returned permissions.
