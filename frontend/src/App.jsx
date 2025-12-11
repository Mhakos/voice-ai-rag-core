import { useState } from 'react'
import './App.css'

function App() {
  const [pregunta, setPregunta] = useState('')
  const [mensajes, setMensajes] = useState([])
  const [cargando, setCargando] = useState(false)

  const enviarPregunta = async (e) => {
    e.preventDefault()
    if (!pregunta.trim()) return

    const nuevosMensajes = [...mensajes, { rol: 'usuario', texto: pregunta }]
    setMensajes(nuevosMensajes)
    setCargando(true)
    setPregunta('')

    try {
      const res = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta })
      })
      const data = await res.json()
      setMensajes([...nuevosMensajes, { rol: 'ia', texto: data.respuesta, fuente: data.fuente }])
    } catch (err) {
      setMensajes([...nuevosMensajes, { rol: 'error', texto: 'Error conectando con el servidor.' }])
    } finally {
      setCargando(false)
    }
  }

  /* --------------  JSX  -------------- */
  return (
    <div className="chat-container">
      <h1>🧠 Cerebro Digital CMM</h1>

      <div className="chat-box">
        {mensajes.map((m, i) => (
          <div key={i} className={`mensaje ${m.rol}`}>
            <strong>{m.rol === 'usuario' ? 'Tú' : 'IA'}:</strong> {m.texto}
            {m.fuente && <span className="fuente">({m.fuente})</span>}
          </div>
        ))}
        {cargando && <div className="mensaje ia">Escribiendo…</div>}
      </div>

      <form onSubmit={enviarPregunta}>
        <input
          value={pregunta}
          onChange={e => setPregunta(e.target.value)}
          placeholder="Pregunta sobre el CV o documentos…"
        />
        <button type="submit" disabled={cargando}>Enviar</button>
      </form>
    </div>
  )
}

export default App