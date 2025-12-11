require('dotenv').config();
const fs = require('fs');
const pdf = require('pdf-parse');
const { Pool } = require('pg');

// CONFIGURACIÓN
const HF_API_KEY = process.env.HF_API_KEY;
const DB_URL = process.env.DATABASE_URL;

// CAMBIO DE MODELO: Usamos BAAI/bge-small-en-v1.5
// Este modelo es mucho mejor entendiendo que queremos vectores, no comparaciones.
const MODEL_URL = "https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5";

const pool = new Pool({ connectionString: DB_URL });

async function generarEmbedding(texto) {
    // Reintentos automáticos por si la red parpadea
    for (let intento = 1; intento <= 3; intento++) {
        try {
            const response = await fetch(MODEL_URL, {
                headers: { 
                    Authorization: `Bearer ${HF_API_KEY}`, 
                    "Content-Type": "application/json" 
                },
                method: "POST",
                // Enviamos el texto en lista [] para asegurar formato correcto
                body: JSON.stringify({ 
                    inputs: [texto], 
                    options: { wait_for_model: true }
                })
            });

            if (response.ok) {
                const result = await response.json();
                
                // La API de BGE suele ser muy limpia, pero validamos por seguridad
                if (Array.isArray(result)) {
                    // Caso 1: Array simple [0.1, 0.2...]
                    if (typeof result[0] === 'number') return result;
                    // Caso 2: Array anidado [[0.1, 0.2...]]
                    if (Array.isArray(result[0])) return result[0];
                    // Caso 3: Objeto raro (API update)
                    if (result[0]?.embedding) return result[0].embedding;
                }
                
                // Si llegamos aquí, la respuesta es rara, la imprimimos para debug
                console.log("⚠️ Respuesta inusual de API:", JSON.stringify(result).substring(0, 50));
                return result[0]; // Intentamos devolver lo que haya
            }

            // Si falla, leemos el error
            const errorText = await response.text();
            
            // Si el modelo está "dormido" (503), esperamos un poco más
            if (response.status === 503) {
                console.log(`⏳ Despertando modelo IA... (Intento ${intento}/3)`);
                await new Promise(r => setTimeout(r, 10000)); // Esperar 10 seg
                continue;
            }

            throw new Error(`Error API (${response.status}): ${errorText}`);

        } catch (error) {
            if (intento === 3) throw error; // Si falló 3 veces, nos rendimos
            console.log(`🔸 Reintentando por error de red...`);
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

async function main() {
    try {
        console.log("🚀 Iniciando ingestión con Modelo BGE...");

        // 1. LEER PDF
        const filePath = './documentos/CVS.pdf';
        if (!fs.existsSync(filePath)) throw new Error(`No encuentro: ${filePath}`);

        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(dataBuffer);
        // Limpiamos saltos de línea para mejorar la calidad de la IA
        const textoLimpio = pdfData.text.replace(/\n+/g, ' ').trim();

        console.log(`📄 PDF leído. Longitud: ${textoLimpio.length} caracteres.`);

        // 2. PREPARAR BASE DE DATOS
        console.log("🔧 Configurando base de datos...");
        await pool.query("DROP TABLE IF EXISTS knowledge_base");
        
        // BAAI/bge-small-en-v1.5 usa 384 dimensiones (Igual que MiniLM)
        await pool.query(`
            CREATE TABLE knowledge_base (
                id SERIAL PRIMARY KEY,
                content TEXT,
                embedding vector(384) 
            );
        `);

        // 3. TROCEAR (Chunking)
        const chunks = textoLimpio.match(/[\s\S]{1,500}/g) || [];
        console.log(`🔪 Texto troceado en ${chunks.length} partes.`);

        // 4. PROCESAR
        console.log("🧠 Vectorizando documentos...");
        
        for (let i = 0; i < chunks.length; i++) {
            try {
                const vector = await generarEmbedding(chunks[i]);
                
                // Validación de seguridad antes de guardar
                if (!vector || !Array.isArray(vector)) {
                    throw new Error("La IA no devolvió un vector válido.");
                }

                const vectorString = JSON.stringify(vector);
                
                await pool.query(
                    "INSERT INTO knowledge_base (content, embedding) VALUES ($1, $2)",
                    [chunks[i], vectorString]
                );
                
                process.stdout.write(`\r✅ Chunk ${i + 1}/${chunks.length} guardado correctamente.`);
                
                // Pausa anti-bloqueo
                await new Promise(r => setTimeout(r, 500)); 

            } catch (err) {
                console.error(`\n❌ Falló chunk ${i}:`, err.message);
            }
        }

        console.log("\n\n🎉 ¡MISIÓN CUMPLIDA! Tu base de datos vectorial está lista.");

    } catch (error) {
        console.error("\n❌ Error grave:", error.message);
    } finally {
        await pool.end();
    }
}

main();