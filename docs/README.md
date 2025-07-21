# Sanchalak Documentation

Welcome to the documentation for the Sanchalak Unified Government Scheme Eligibility System.

## 📚 Table of Contents
- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Service Overview](#service-overview)
- [Setup & Deployment](#setup--deployment)
- [Environment Variables](#environment-variables)
- [API & Service Docs](#api--service-docs)
- [Scheme Canonical Models](#scheme-canonical-models)
- [Contributing](#contributing)

---

## Project Overview
Sanchalak is a modular, production-ready platform for conversational data collection, eligibility checking, and scheme management for government benefit programs. It integrates LLM-driven chat, scheme logic, and data storage, and is designed for extensibility, reliability, and real-world deployment.

---

## Architecture
- ![Architecture Diagram](sanchalak_architecture.svg)
- See [`sanchalak_architecture.svg`](sanchalak_architecture.svg) for a full system overview.

---

## Service Overview
- **UI Frontend**: Next.js/React, multilingual, voice-enabled chat.
- **UI Backend**: Node.js GraphQL server for audio, TTS, and chat integration.
- **Schemabot**: Python GraphQL API for conversational data extraction and eligibility.
- **Scheme Server**: Python FastAPI, Prolog, and MongoDB for scheme logic and canonical models.
- **EFR Server**: Python FastAPI for farmer registry and CRUD operations.
- **LM Studio**: LLM inference (Qwen2-57B-Instruct or compatible).
- **MongoDB**: Data storage for scheme server and EFR.

---

## Setup & Deployment
- **Local Development**: See [README.md](../README.md#quick-start)
- **Docker Compose**: See [README.md](../README.md#docker-compose-productionserver)
- **Environment Variables**: See [docker/.env](../docker/.env)

---

## Environment Variables
- All sensitive keys and service URLs are managed via `.env.local` (for dev) and `docker/.env` (for Docker).
- See the sample in [docker/.env](../docker/.env) for all required variables.

---

## API & Service Docs
- **UI Backend GraphQL**: [src/app/new_ui/backend/README.md](../src/app/new_ui/backend/README.md)
- **Schemabot GraphQL**: [src/schemabot/GRAPHQL_API.md](../src/schemabot/GRAPHQL_API.md)
- **Scheme Server**: [src/scheme_server/README.md](../src/scheme_server/README.md) (if available)
- **EFR Server**: [src/efr_server/README.md](../src/efr_server/README.md) (if available)

---

## Scheme Canonical Models
- Canonical scheme YAMLs: [`src/scheme_server/outputs/`](../src/scheme_server/outputs/)
- Prolog rules: [`src/scheme_server/outputs/pm-kisan/REFERENCE_prolog_system.pl`](../src/scheme_server/outputs/pm-kisan/REFERENCE_prolog_system.pl)

---

## Contributing
- Fork, branch, and submit PRs.
- Please keep code modular and document new features.

---

## License
MIT (c) AnnamAI Team 