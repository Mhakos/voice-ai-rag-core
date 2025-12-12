import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [pregunta, setPregunta] = useState('')
  const [mensajes, setMensajes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [escuchando, setEscuchando] = useState(false)

  // --- 1. CONFIGURACIÓN DE VOZ (Speech-to-Text) ---
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const recognition = SpeechRecognition ? new SpeechRecognition() : null

  if (recognition) {
    recognition.continuous = false
    recognition.lang = 'es-ES' // Configurado para español
    recognition.interimResults = false
  }

  const toggleEscucha = () => {
    if (!recognition) return alert("Tu navegador no soporta voz (Usa Chrome/Edge).")

    if (escuchando) {
      recognition.stop()
      setEscuchando(false)
    } else {
      recognition.start()
      setEscuchando(true)
      setPregunta('') // Limpiar input
    }
  }

  // Evento: Cuando la voz se convierte en texto
  if (recognition) {
    recognition.onresult = (event) => {
      const textoEscuchado = event.results[0][0].transcript
      setPregunta(textoEscuchado)
      setEscuchando(false)
      // Opcional: Enviar automáticamente al terminar de hablar
      // enviarPregunta(null, textoEscuchado) 
    }

    recognition.onend = () => {
      setEscuchando(false)
    }
  }

  // --- 2. TEXT-TO-SPEECH (La IA habla) ---
  const hablar = (texto) => {
    // Detenemos si ya estaba hablando
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(texto)
    utterance.lang = 'es-ES'
    utterance.rate = 1.0 // Velocidad normal
    window.speechSynthesis.speak(utterance)
  }

  // --- 3. LÓGICA DEL CHAT ---
  const enviarPregunta = async (e) => {
    if (e) e.preventDefault()
    if (!pregunta.trim()) return

    const nuevosMensajes = [...mensajes, { rol: 'usuario', texto: pregunta }]
    setMensajes(nuevosMensajes)
    setCargando(true)
    setPregunta('')

    try {
      const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: pregunta })
      })
      const data = await response.json()

      const respuestaIA = data.respuesta
      
      setMensajes([...nuevosMensajes, { 
        rol: 'ia', 
        texto: respuestaIA, 
        fuente: data.fuente 
      }])

      // ¡AQUÍ LA IA HABLA! 🔊
      hablar(respuestaIA)

    } catch (error) {
      setMensajes([...nuevosMensajes, { rol: 'error', texto: 'Error conectando con el servidor.' }])
    } finally {
      setCargando(false)
    }
  }

  // Estilos "Inline" para asegurar el centrado
  const estilosPantalla = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#f0f2f5',
    position: 'fixed',
    top: 0,
    left: 0,
    margin: 0,
    padding: 0
  }

  return (
    <div style={estilosPantalla}>
      <div className="chat-container">
        <h1>🎙️ Voice AI Assistant</h1>
        
        <div className="chat-box">
          {mensajes.length === 0 && <p style={{textAlign:'center', color:'#888', marginTop:'50px'}}>Presiona el micrófono y haz una pregunta sobre el CV.</p>}
          {mensajes.map((msg, i) => (
            <div key={i} className={`mensaje ${msg.rol}`}>
              <strong>{msg.rol === 'usuario' ? 'Tú' : 'IA'}:</strong> {msg.texto}
              {msg.fuente && <span className="fuente">({msg.fuente})</span>}
            </div>
          ))}
          {cargando && <div className="mensaje ia">Thinking...</div>}
        </div>

        <form onSubmit={enviarPregunta}>
          {/* BOTÓN DE MICRÓFONO */}
          <button 
            type="button" 
            onClick={toggleEscucha} 
            className={`mic-btn ${escuchando ? 'listening' : ''}`}
            title="Dictar pregunta"
          >
            {escuchando ? '🔴' : '🎤'}
          </button>

          <input 
            type="text" 
            value={pregunta} 
            onChange={(e) => setPregunta(e.target.value)} 
            placeholder={escuchando ? "Escuchando..." : "Escribe o dicta tu pregunta..."}
            disabled={escuchando}
          />
          <button type="submit" disabled={cargando || escuchando}>Enviar</button>
        </form>
      </div>
    </div>
  )
}

export default App