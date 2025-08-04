// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'
//
// function App() {
//   const [count, setCount] = useState(0)
//
//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }
//
// export default App

// frontend/src/App.jsx
import React, { useState, useRef } from 'react'

export default function App() {
  const [recording, setRecording] = useState(false)
  const [answer, setAnswer] = useState('')
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  // Function to call your FastAPI backend
  async function processAudioBlob(blob) {
    // 1) Transcribe
    const form = new FormData()
    form.append('file', blob, 'clip.webm')
    const { text } = await fetch('http://localhost:8000/transcribe/', {
      method: 'POST',
      body: form
    }).then(r => r.json())

    // 2) Classify
    const { category } = await fetch('http://localhost:8000/classify/', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ text })
    }).then(r => r.json())

    // 3) Generate
    const { answer } = await fetch('http://localhost:8000/generate/', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ question: text, category })
    }).then(r => r.json())

    setAnswer(answer)
  }

  const handleRecordClick = async () => {
    if (!recording) {
      // Start recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0].type })
        await processAudioBlob(blob)
        stream.getTracks().forEach(t => t.stop())
      }

      recorder.start()
      setRecording(true)
    } else {
      // Stop & process
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <button onClick={handleRecordClick}>
        {recording ? 'Stop & Process' : 'Start Recording'}
      </button>

      {answer && (
        <div
          style={{
            marginTop: 20,
            padding: 10,
            border: '1px solid #ccc',
            borderRadius: 8,
            resize: 'both',
            overflow: 'auto',
            maxWidth: '80vw',
            maxHeight: '80vh',
            background: 'rgba(250,250,250,0.6)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <h3>AI Answer</h3>
          <p>{answer}</p>
        </div>
      )}
    </div>
  )
}
