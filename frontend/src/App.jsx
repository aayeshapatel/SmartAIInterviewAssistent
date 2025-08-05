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

// // frontend/src/App.jsx
// import React, { useState, useRef, useEffect } from 'react'
//
// const { ipcRenderer } = window.require('electron')
//
// export default function App() {
//   const [recording, setRecording] = useState(false)
//   const [answer, setAnswer] = useState('')
//   const mediaRecorderRef = useRef(null)
//   const chunksRef = useRef([])
//
//
//   // Function to call your FastAPI backend
//   async function processAudioBlob(blob) {
//     // 1) Transcribe
//     const form = new FormData()
//     form.append('file', blob, 'clip.webm')
//     const { text } = await fetch('http://localhost:8000/transcribe/', {
//       method: 'POST',
//       body: form
//     }).then(r => r.json())
//
//     // 2) Classify
//     const { category } = await fetch('http://localhost:8000/classify/', {
//       method: 'POST',
//       headers: {'Content-Type':'application/json'},
//       body: JSON.stringify({ text })
//     }).then(r => r.json())
//
//     // 3) Generate
//     const { answer } = await fetch('http://localhost:8000/generate/', {
//       method: 'POST',
//       headers: {'Content-Type':'application/json'},
//       body: JSON.stringify({ question: text, category })
//     }).then(r => r.json())
//
//     setAnswer(answer)
//   }
//
//   const handleRecordClick = async () => {
//     if (!recording) {
//       // Start recording
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
//       chunksRef.current = []
//       const recorder = new MediaRecorder(stream)
//       mediaRecorderRef.current = recorder
//
//       recorder.ondataavailable = e => {
//         if (e.data.size > 0) chunksRef.current.push(e.data)
//       }
//       recorder.onstop = async () => {
//         const blob = new Blob(chunksRef.current, { type: chunksRef.current[0].type })
//         await processAudioBlob(blob)
//         stream.getTracks().forEach(t => t.stop())
//       }
//
//       recorder.start()
//       setRecording(true)
//     } else {
//       // Stop & process
//       mediaRecorderRef.current.stop()
//       setRecording(false)
//     }
//   }
//
//   return (
//     <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
//       <button onClick={handleRecordClick}>
//         {recording ? 'Stop & Process' : 'Start Recording'}
//       </button>
//
//       {answer && (
//         <div
//           style={{
//             marginTop: 20,
//             padding: 10,
//             border: '1px solid #ccc',
//             borderRadius: 8,
//             resize: 'both',
//             overflow: 'auto',
//             maxWidth: '80vw',
//             maxHeight: '80vh',
//             background: 'rgba(250,250,250,0.6)',
//             backdropFilter: 'blur(10px)'
//           }}
//         >
//           <h3>AI Answer</h3>
//           <p>{answer}</p>
//         </div>
//       )}
//     </div>
//   )
// }





// frontend/src/App.jsx

import React, { useState, useRef, useEffect } from 'react'
let ipcRenderer = null
try {
  // only available inside Electron
  ipcRenderer = window.require('electron').ipcRenderer
} catch {
  ipcRenderer = { on: () => {}, removeListener: () => {} }
}

// Electron’s IPC in the renderer
// const { ipcRenderer } = window.require('electron')

export default function App() {
  // Recording state
  const [recording, setRecording] = useState(false)
  // AI answer text
  const [answer, setAnswer] = useState('')
  // Font size in px
  const [fontSize, setFontSize] = useState(14)

  // Refs for the MediaRecorder and audio chunks
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  // 1) Build and POST the audio to your FastAPI backend,
  //    then chain classify → generate, and finally setAnswer
  async function processAudioBlob(blob) {
    try {
      // Transcribe
      const form = new FormData()
      form.append('file', blob, 'clip.webm')
      const transResp = await fetch('http://localhost:8000/transcribe/', {
        method: 'POST',
        body: form
      })
      const { text } = await transResp.json()

      // Classify
      const classResp = await fetch('http://localhost:8000/classify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const { category } = await classResp.json()

      // Generate
      const genResp = await fetch('http://localhost:8000/generate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, category })
      })
      const { answer: aiAnswer } = await genResp.json()

      setAnswer(aiAnswer)
    } catch (err) {
      console.error('Error during AI pipeline:', err)
    }
  }

  // 2) Called by the button or hotkey to start/stop recording
  const handleRecordToggle = async () => {
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
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        // Process audio to AI
        await processAudioBlob(blob)
      }

      recorder.start()
      setRecording(true)
    } else {
      // Stop recording & processing
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  // 3) Listen for the Electron hotkey event
  useEffect(() => {
    ipcRenderer.on('hotkey:record-toggle', handleRecordToggle)
    return () => {
      ipcRenderer.removeListener('hotkey:record-toggle', handleRecordToggle)
    }
  }, [recording])

  return (
    <div
      style={{
        WebkitAppRegion: 'drag',
        position: 'fixed',
        top: 20,
        left: 20,
        zIndex: 9999
      }}
    >
      <div style={{ WebkitAppRegion: 'no-drag', background: 'transparent', padding: 10 }}>
        {/* Font-Size Slider */}
        <label style={{ display: 'block', marginBottom: 8 }}>
          Font size:&nbsp;
          <input
            type="range"
            min="10"
            max="24"
            value={fontSize}
            onChange={e => setFontSize(Number(e.target.value))}
          />
          &nbsp;{fontSize}px
        </label>

        {/* Start/Stop Recording Button */}
        <button onClick={handleRecordToggle}>
          {recording ? 'Stop & Process' : 'Start Recording'}
        </button>

        {/* AI Answer Card */}
        {answer && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              border: '1px solid rgba(255,255,255,0.6)',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.4)',
              color: 'white',
              maxWidth: '80vw',
              maxHeight: '80vh',
              resize: 'both',
              overflow: 'auto',
              fontSize: `${fontSize}px`
            }}
          >
            <h3 style={{ marginTop: 0 }}>AI Answer</h3>
            <p>{answer}</p>
          </div>
        )}
      </div>
    </div>
  )
}
