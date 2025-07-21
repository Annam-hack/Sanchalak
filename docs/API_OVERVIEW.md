# Sanchalak API Documentation

## Table of Contents
- [Schemabot GraphQL API](#schemabot-graphql-api)
- [Translation & Audio REST API](#translation--audio-rest-api)
- [Other Service Endpoints](#other-service-endpoints)
- [Troubleshooting & Tips](#troubleshooting--tips)

---

## Schemabot GraphQL API

**Endpoint:** `http://localhost:8003/graphql`

- Single endpoint for all chat, conversation, and eligibility operations
- Real-time subscriptions via WebSocket
- [Full schema, types, and example queries/mutations below]

### Example Operations
#### Start Conversation
```graphql
mutation StartConversation($input: StartConversationInput!) {
  startConversation(input: $input) {
    id
    stage
    messages(limit: 1) { content role timestamp }
    progress { overallPercentage basicInfo { collected total percentage isComplete } }
  }
}
```
#### Send Message
```graphql
mutation SendMessage($input: SendMessageInput!) {
  sendMessage(input: $input) { id content role timestamp }
}
```
#### Real-time Chat Subscription
```graphql
subscription ChatStream($sessionId: String!) {
  messageStream(sessionId: $sessionId) { id content role timestamp }
}
```
#### Get Available Schemes
```graphql
query GetAvailableSchemes {
  availableSchemes { scheme_code name description }
}
```

### Example Client Usage
- **JavaScript/TypeScript:**
```js
import { request, gql } from 'graphql-request';
const endpoint = 'http://localhost:8003/graphql';
// ...see full example in src/schemabot/GRAPHQL_API.md
```
- **Python:**
```python
import requests
# ...see full example in src/schemabot/GRAPHQL_API.md
```
- **cURL:**
```bash
curl -X POST http://localhost:8003/graphql -H "Content-Type: application/json" -d '{...}'
```

> **See [`src/schemabot/GRAPHQL_API.md`](../src/schemabot/GRAPHQL_API.md) for the full schema, all types, and more examples.**

---

## Translation & Audio REST API

**Base URL:** `http://localhost:8000` (or as configured)

### Endpoints
- **POST /transcribe/**
  - Multipart audio upload, returns transcription, language, confidence, etc.
- **POST /tts/**
  - JSON body: `{ "text": ..., "target_language": ... }`, returns TTS audio path
- **GET /tts/audio/{filename}**
  - Returns audio file
- **GET /health**
  - Returns API health status

### Example Usage
- **Transcription:**
```bash
curl -X POST http://localhost:8000/transcribe/ -F "file=@audio.mp3"
```
- **TTS:**
```bash
curl -X POST http://localhost:8000/tts/ -H "Content-Type: application/json" -d '{"text": "Hello", "target_language": "hi"}'
```

> **See [`src/translation/API_INTEGRATION_README.md`](../src/translation/API_INTEGRATION_README.md) for full details, request/response formats, and troubleshooting.**

---

## Other Service Endpoints

- **EFR Server:** `http://localhost:8001` (see OpenAPI docs at `/docs` if available)
- **Scheme Server:** `http://localhost:8002` (see OpenAPI docs at `/docs` if available)
- **UI Backend GraphQL:** `http://localhost:3001/graphql`
- **UI Frontend:** `http://localhost:3000`
- **LM Studio:** `http://localhost:1234`
- **MongoDB:** `mongodb://localhost:27017`

---

## Troubleshooting & Tips
- For CORS, connection, or auth errors, check environment variables and Docker `.env`.
- Use the GraphQL Playground at `/graphql` for interactive queries.
- For REST APIs, use `/health` endpoints to verify service status.
- See each service's README or API doc for more details.

---

## References
- [Schemabot GraphQL API Full Doc](../src/schemabot/GRAPHQL_API.md)
- [Translation API Integration Guide](../src/translation/API_INTEGRATION_README.md) 