require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const HF_API_KEY = process.env.HF_API_KEY;
const DB_URL = process.env.DATABASE_URL;

// Modelos (Mantenemos los que funcionan)
const MODEL_EMBEDDING_URL = "https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5";
const MODEL_CHAT_URL = "https://router.huggingface.co/hf-inference/models/HuggingFaceH4/zephyr-7b-beta";

const pool = new Pool({ connectionString: DB_URL });

// --- Vectorizar ---
async function generarEmbedding(texto) {
    const response = await fetch(MODEL_EMBEDDING_URL, {
        headers: { Authorization: `Bearer ${HF_API_KEY}`, "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ inputs: [texto], options: { wait_for_model: true } })
    });
    
    if (!response.ok) throw new Error(`Error Embedding`);
    const result = await response.json();
    if (Array.isArray(result) && Array.isArray(result[0])) {
         if (typeof result[0][0] === 'number') return result[0];
         return result.flat(); 
    }
    return result;
}

// --- Generar Respuesta ---
async function generarRespuesta(contexto, pregunta) {
    const prompt = `<|system|>
You are a helpful assistant. Use the context to answer directly.
Context: ${contexto}</s>
<|user|>
${pregunta}</s>
<|assistant|>`;

    const response = await fetch(MODEL_CHAT_URL, {
        headers: { Authorization: `Bearer ${HF_API_KEY}`, "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 200, return_full_text: false } })
    });

    if (!response.ok) throw new Error(`Error Chat`);
    const result = await response.json();
    return result[0]?.generated_text || "Sin respuesta";
}

// --- NUEVA FUNCIÓN: GUARDAR LOG ---
async function guardarLog(pregunta, respuesta, fuente) {
    try {
        await pool.query(
            "INSERT INTO query_logs (pregunta, respuesta, fuente) VALUES ($1, $2, $3)",
            [pregunta, respuesta, fuente]
        );
        console.log("📝 Log guardado en base de datos.");
    } catch (e) {
        console.error("Error guardando log:", e);
    }
}

app.post('/chat', async (req, res) => {
    let respuestaFinal = "";
    let fuenteFinal = "";

    try {
        const { pregunta } = req.body;
        console.log(`\n💬 Pregunta: "${pregunta}"`);

        // 1. Embedding
        const vectorPregunta = await generarEmbedding(pregunta);
        const vectorString = JSON.stringify(vectorPregunta);

        // 2. Retrieval
        const busqueda = await pool.query(
            `SELECT content FROM knowledge_base ORDER BY embedding <=> $1 LIMIT 3`,
            [vectorString]
        );

        if (busqueda.rows.length === 0) {
            respuestaFinal = "No encontré información en el documento.";
            fuenteFinal = "Sistema";
        } else {
            const contextoEncontrado = busqueda.rows.map(row => row.content).join("\n---\n");
            
            // 3. Generación (Try/Catch para Fallback)
            try {
                const respuestaIA = await generarRespuesta(contextoEncontrado, pregunta);
                respuestaFinal = respuestaIA.trim();
                fuenteFinal = "IA Generativa";
            } catch (chatError) {
                console.log("⚠️ Usando Fallback de BD");
                respuestaFinal = "La IA está saturada. Contexto encontrado: " + contextoEncontrado.substring(0, 300) + "...";
                fuenteFinal = "Base de Datos (Fallback)";
            }
        }

        // 4. OBSERVABILIDAD (Guardamos lo que pasó)
        await guardarLog(pregunta, respuestaFinal, fuenteFinal);

        res.json({ 
            respuesta: respuestaFinal,
            fuente: fuenteFinal
        });

    } catch (error) {
        console.error("❌ Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('--- 🛡️ RAG Brain con Observabilidad listo en puerto 3000 ---');
});