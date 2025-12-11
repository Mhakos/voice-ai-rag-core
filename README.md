# 🧠 Cerebro Digital CMM - Voice AI Ready Architecture

Este proyecto implementa una arquitectura **RAG (Retrieval-Augmented Generation)** contenerizada para la gestión de conocimiento técnico y cumplimiento normativo (ISO 27001).

Diseñado como el núcleo ("Core") para un sistema de **Voice AI**, permitiendo la ingesta de documentos técnicos, vectorización semántica y recuperación de contexto de baja latencia.

## 🚀 Tech Stack & Arquitectura

* **Core Backend:** Node.js (Express), JavaScript ES6+.
* **AI & LLM Ops:** Hugging Face Inference API, Prompt Engineering (System Prompts).
* **Vector Database:** PostgreSQL + `pgvector` (Búsqueda por Distancia de Coseno).
* **Pipeline ETL:** Procesamiento de binarios (PDF), limpieza y "Chunking" dinámico.
* **Frontend:** React.js + Vite (Interfaz de Chat Moderna).
* **Infraestructura:** Docker & Docker Compose (Microservicios aislados).
* **Observabilidad:** Sistema de Logging transaccional en SQL.

## 🛠️ Instalación y Despliegue

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/Mhakos/voice-ai-rag-core.git](https://github.com/Mhakos/voice-ai-rag-core.git)
    cd voice-ai-rag-core
    ```

2.  **Configurar Variables de Entorno:**
    Crear un archivo `.env` en la raíz:
    ```env
    HF_API_KEY=tu_clave_de_hugging_face
    DATABASE_URL=postgres://usuario_ia:password_seguro@db:5432/ia_database
    ```

3.  **Desplegar con Docker:**
    ```bash
    docker compose up --build
    ```

4.  **Ingestar Conocimiento (ETL):**
    ```bash
    docker exec -it ia_brain_backend node ingest.js
    ```

## 🔮 Roadmap para Voice AI (Próximos Pasos)

* [ ] Integración de **STT (Speech-to-Text)** usando OpenAI Whisper.
* [ ] Implementación de **TTS (Text-to-Speech)** para respuestas de audio.
* [ ] Conexión con Telefonía (Twilio/SIP) para manejo de llamadas.

---
Desarrollado por **Mhakos Pavone**.