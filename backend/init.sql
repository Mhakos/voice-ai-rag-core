-- Activa la extensión para guardar embeddings (vectores)
CREATE EXTENSION IF NOT EXISTS vector;

-- Crea la tabla para tus documentos (Nivel 2)
CREATE TABLE IF NOT EXISTS knowledge_base (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(1536) -- Dimensión estándar de OpenAI
);