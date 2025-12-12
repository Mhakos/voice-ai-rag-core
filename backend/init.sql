-- 1. Habilitar la extensión de vectores (IA)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Crear tabla de documentos (Conocimiento)
CREATE TABLE IF NOT EXISTS knowledge_base (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(384)
);

-- 3. Crear tabla de Logs (ESTA ES LA QUE FALTABA)
CREATE TABLE IF NOT EXISTS query_logs (
    id SERIAL PRIMARY KEY,
    pregunta TEXT,
    respuesta TEXT,
    fuente TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);