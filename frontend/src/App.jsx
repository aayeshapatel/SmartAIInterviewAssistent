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



//
//
// // frontend/src/App.jsx
//
// import React, { useState, useRef, useEffect } from 'react'
// let ipcRenderer = null
// try {
//   // only available inside Electron
//   ipcRenderer = window.require('electron').ipcRenderer
// } catch {
//   ipcRenderer = { on: () => {}, removeListener: () => {} }
// }
//
// // Electron’s IPC in the renderer
// // const { ipcRenderer } = window.require('electron')
//
// export default function App() {
//   // Recording state
//   const [recording, setRecording] = useState(false)
//   // AI answer text
//   const [answer, setAnswer] = useState('')
//   // Font size in px
//   const [fontSize, setFontSize] = useState(14)
//
//   // Refs for the MediaRecorder and audio chunks
//   const mediaRecorderRef = useRef(null)
//   const chunksRef = useRef([])
//
//   // 1) Build and POST the audio to your FastAPI backend,
//   //    then chain classify → generate, and finally setAnswer
//   async function processAudioBlob(blob) {
//     try {
//       // Transcribe
//       const form = new FormData()
//       form.append('file', blob, 'clip.webm')
//       const transResp = await fetch('http://localhost:8000/transcribe/', {
//         method: 'POST',
//         body: form
//       })
//       const { text } = await transResp.json()
//
//       // Classify
//       const classResp = await fetch('http://localhost:8000/classify/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ text })
//       })
//       const { category } = await classResp.json()
//
//       // Generate
//       const genResp = await fetch('http://localhost:8000/generate/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ question: text, category })
//       })
//       const { answer: aiAnswer } = await genResp.json()
//
//       setAnswer(aiAnswer)
//     } catch (err) {
//       console.error('Error during AI pipeline:', err)
//     }
//   }
//
//   // 2) Called by the button or hotkey to start/stop recording
//   const handleRecordToggle = async () => {
//     if (!recording) {
//       // Start recording
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
//       chunksRef.current = []
//
//       const recorder = new MediaRecorder(stream)
//       mediaRecorderRef.current = recorder
//
//       recorder.ondataavailable = e => {
//         if (e.data.size > 0) chunksRef.current.push(e.data)
//       }
//
//       recorder.onstop = async () => {
//         const blob = new Blob(chunksRef.current, { type: chunksRef.current[0].type })
//         // Stop all tracks
//         stream.getTracks().forEach(track => track.stop())
//         // Process audio to AI
//         await processAudioBlob(blob)
//       }
//
//       recorder.start()
//       setRecording(true)
//     } else {
//       // Stop recording & processing
//       mediaRecorderRef.current.stop()
//       setRecording(false)
//     }
//   }
//
//   // 3) Listen for the Electron hotkey event
// //   useEffect(() => {
// //     ipcRenderer.on('hotkey:record-toggle', handleRecordToggle)
// //     return () => {
// //       ipcRenderer.removeListener('hotkey:record-toggle', handleRecordToggle)
// //     }
// //   }, [recording])
// //     // register once, when the component mounts
// //    ipcRenderer.on('hotkey:record-toggle', handleRecordToggle)
// //    return () => {
// //      ipcRenderer.removeListener('hotkey:record-toggle', handleRecordToggle)
// //    }
// //  }, [])
//
//      useEffect(() => {
//        // Register hotkey listener once
//        ipcRenderer.on('hotkey:record-toggle', handleRecordToggle)
//        return () => {
//          // Cleanup on unmount
//          ipcRenderer.removeListener('hotkey:record-toggle', handleRecordToggle)
//        }
//      }, [])  // empty deps: run only once
//
//   return (
//     <div
//       style={{
//         WebkitAppRegion: 'drag',
//         position: 'fixed',
//         top: 20,
//         left: 20,
//         zIndex: 9999
//       }}
//     >
// //       <div style={{ WebkitAppRegion: 'no-drag', background: 'transparent', padding: 10 }}>
//            <div
//              style={{
//                position:      'fixed',
//                top:           20,
//                left:          20,
//                zIndex:        9999,
//                WebkitAppRegion: 'drag',   // make the whole container draggable
//                width:         'auto',
//                height:        'auto',
//              }}
//            >
//         {/* Font-Size Slider */}
//         <label style={{ display: 'block', marginBottom: 8 }}>
//           Font size:&nbsp;
//           <input
//             type="range"
//             min="10"
//             max="24"
//             value={fontSize}
//             onChange={e => setFontSize(Number(e.target.value))}
//           />
//           &nbsp;{fontSize}px
//         </label>
//
//         {/* Start/Stop Recording Button */}
//         <button onClick={handleRecordToggle}>
//           {recording ? 'Stop & Process' : 'Start Recording'}
//         </button>
//
//         {/* AI Answer Card */}
//         {answer && (
//           <div
//             style={{
//               marginTop: 12,
//               padding: 12,
//               border: '1px solid rgba(255,255,255,0.6)',
//               borderRadius: 8,
//               background: 'rgba(0,0,0,0.4)',
//               color: 'white',
//               maxWidth: '80vw',
//               maxHeight: '80vh',
//               resize: 'both',
//               overflow: 'auto',
//               fontSize: `${fontSize}px`
//             }}
//           >
//             <h3 style={{ marginTop: 0 }}>AI Answer</h3>
//             <p>{answer}</p>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }


// frontend/src/App.jsx
//
// import React, { useState, useRef, useEffect } from 'react'
//
// // Safely grab ipcRenderer only when running inside Electron
// let ipcRenderer = { on: () => {}, removeListener: () => {} }
// try {
//   ipcRenderer = window.require('electron').ipcRenderer
// } catch {
//   // not in Electron, so noop
// }
//
// export default function App() {
//   const [recording, setRecording] = useState(false)
//   const [answer, setAnswer]       = useState('')
//   const [fontSize, setFontSize]   = useState(14)
//
//   const mediaRecorderRef = useRef(null)
//   const chunksRef        = useRef([])
//
//   // Send audio blob to backend → transcribe → classify → generate
//   async function processAudioBlob(blob) {
//     try {
//       // 1) Transcribe
//       const form = new FormData()
//       form.append('file', blob, 'clip.webm')
//       const transResp = await fetch('http://localhost:8000/transcribe/', {
//         method: 'POST',
//         body: form
//       })
//       const { text } = await transResp.json()
//
//       // 2) Classify
//       const classResp = await fetch('http://localhost:8000/classify/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ text })
//       })
//       const { category } = await classResp.json()
//
//       // 3) Generate
//       const genResp = await fetch('http://localhost:8000/generate/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ question: text, category })
//       })
//       const { answer: aiAnswer } = await genResp.json()
//
//       setAnswer(aiAnswer)
//     } catch (err) {
//       console.error('Error in AI pipeline:', err)
//     }
//   }
//
//   // Toggle recording on/off (button or hotkey)
//   const handleRecordToggle = async () => {
//     if (!recording) {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
//       chunksRef.current = []
//       const recorder = new MediaRecorder(stream)
//       mediaRecorderRef.current = recorder
//
//       recorder.ondataavailable = e => {
//         if (e.data.size) chunksRef.current.push(e.data)
//       }
//
//       recorder.onstop = async () => {
//         const blob = new Blob(chunksRef.current, { type: chunksRef.current[0].type })
//         stream.getTracks().forEach(t => t.stop())
//         await processAudioBlob(blob)
//       }
//
//       recorder.start()
//       setRecording(true)
//     } else {
//       mediaRecorderRef.current.stop()
//       setRecording(false)
//     }
//   }
//
//   // Listen once for F7 from main process
//   useEffect(() => {
//     ipcRenderer.on('hotkey:record-toggle', handleRecordToggle)
//     return () => {
//       ipcRenderer.removeListener('hotkey:record-toggle', handleRecordToggle)
//     }
//   }, [])  // empty deps → run only on mount
//
//   return (
//     <div
//       style={{
//         position:         'fixed',
//         top:              20,
//         left:             20,
//         zIndex:           9999,
//         WebkitAppRegion:  'drag',    // entire overlay draggable
//       }}
//     >
//       <div style={{ WebkitAppRegion: 'no-drag', padding: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 8 }}>
//         {/* Font-size slider */}
//         <label style={{ display: 'block', marginBottom: 8, color: 'white' }}>
//           Font size:&nbsp;
//           <input
//             type="range"
//             min="10"
//             max="30"
//             value={fontSize}
//             onChange={e => setFontSize(+e.target.value)}
//           />
//           &nbsp;{fontSize}px
//         </label>
//
//         {/* Start/Stop button */}
//         <button
//           onClick={handleRecordToggle}
//           style={{ marginBottom: 12, padding: '6px 12px' }}
//         >
//           {recording ? 'Stop & Process' : 'Start Recording'}
//         </button>
//
//         {/* AI Answer Card */}
//         {answer && (
//           <div
//             style={{
//               padding:      12,
//               background:   'rgba(255,255,255,0.1)',
//               borderRadius: 6,
//               color:        'white',
//               fontSize:     `${fontSize}px`,
//               maxWidth:     '80vw',
//               maxHeight:    '80vh',
//               overflow:     'auto',
//               resize:       'both',
//             }}
//           >
//             <h3 style={{ marginTop: 0 }}>AI Answer</h3>
//             <p>{answer}</p>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

//
//
//
//
//
// // frontend/src/App.jsx
//
// import React, { useState, useRef, useEffect, useCallback } from 'react'
//
// // Safely grab ipcRenderer only inside Electron
// let ipcRenderer = { on: () => {}, removeListener: () => {} }
// try {
//   ipcRenderer = window.require('electron').ipcRenderer
// } catch {
//   // not in Electron, noop
// }
//
// export default function App() {
//   const [recording, setRecording] = useState(false)
//   const [answer,    setAnswer]    = useState('')
//   const [fontSize,  setFontSize]  = useState(14)
//
//   const mediaRecorderRef = useRef(null)
//   const chunksRef        = useRef([])
//
//   // 1) Sends your audio blob through the AI pipeline
//   const processAudioBlob = async (blob) => {
//     try {
//       // Transcribe
//       const form = new FormData()
//       form.append('file', blob, 'clip.webm')
//       const transResp = await fetch('http://localhost:8000/transcribe/', { method: 'POST', body: form })
//       const { text } = await transResp.json()
//
//       // Classify
//       const classResp = await fetch('http://localhost:8000/classify/', {
//         method: 'POST',
//         headers:{ 'Content-Type': 'application/json' },
//         body: JSON.stringify({ text })
//       })
//       const { category } = await classResp.json()
//
//       // Generate
//       const genResp = await fetch('http://localhost:8000/generate/', {
//         method: 'POST',
//         headers:{ 'Content-Type': 'application/json' },
//         body: JSON.stringify({ question: text, category })
//       })
//       const { answer: aiAnswer } = await genResp.json()
//
//       setAnswer(aiAnswer)
//     } catch (err) {
//       console.error('Error in AI pipeline:', err)
//     }
//   }
//
//   // 2) start/stop recording
//   const handleRecordToggle = useCallback(async () => {
//       console.log('🖥️ Renderer: handleRecordToggle (recording=', recording, ')')
//     if (!recording) {
//         console.log('🖥️ Renderer: starting recording')
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
//       chunksRef.current = []
//
//       const recorder = new MediaRecorder(stream)
//       mediaRecorderRef.current = recorder
//
//       recorder.ondataavailable = e => {
//         if (e.data.size) chunksRef.current.push(e.data)
//       }
//
//       recorder.onstop = async () => {
//         const blob = new Blob(chunksRef.current, { type: chunksRef.current[0].type })
//         stream.getTracks().forEach(t => t.stop())
//         await processAudioBlob(blob)
//       }
//
//       recorder.start()
//       setRecording(true)
//     } else {
//         console.log('🖥️ Renderer: stopping recording')
//       mediaRecorderRef.current.stop()
//       setRecording(false)
//     }
//   }, [recording])
//
//   // 3) Register the F7 hotkey listener
//   useEffect(() => {
//       console.log('🖥️ Renderer: registering hotkey listener')
//     ipcRenderer.on('hotkey:record-toggle', handleRecordToggle)
//     return () => {
//       ipcRenderer.removeListener('hotkey:record-toggle', handleRecordToggle)
//     }
//   }, [handleRecordToggle])
//
//   // 4) Fallback window keydown (F7)
//   useEffect(() => {
//     const onKeyDown = (e) => {
//       if (e.key === 'F7') {
//         console.log('🖥️ Renderer: keydown F7 detected in window')
//         handleRecordToggle()
//       }
//     }
//     window.addEventListener('keydown', onKeyDown)
//     return () => window.removeEventListener('keydown', onKeyDown)
//   }, [handleRecordToggle])
//
//
//   return (
//     <div
//       style={{
//         position:        'fixed',
//         top:             20,
//         left:            20,
//         zIndex:          9999,
//         width:           '400px',
//       }}
//     >
//       {/* Draggable title bar */}
//       <div
//         style={{
//           WebkitAppRegion: 'drag',
//           height:          '30px',
//           width:           '100%',
//           cursor:          'move',
//         }}
//       />
//
//       {/* Controls & content */}
//       <div
//         style={{
//           WebkitAppRegion:'no-drag',
//           background:    'rgba(0,0,0,0.5)',
//           padding:       '12px',
//           borderRadius:  '8px',
//         }}
//       >
//         {/* Font-size slider */}
//         <label style={{ color: 'white', display: 'block', marginBottom: 8 }}>
//           Font size:&nbsp;
//           <input
//             type="range"
//             min="10"
//             max="30"
//             value={fontSize}
//             onChange={e => setFontSize(Number(e.target.value))}
//           />
//           &nbsp;<strong>{fontSize}px</strong>
//         </label>
//
//         {/* Record toggle button */}
//         <button
//           onClick={handleRecordToggle}
//           style={{ marginBottom: 12, padding: '6px 12px' }}
//         >
//           {recording ? 'Stop & Process' : 'Start Recording'}
//         </button>
//
//         {/* AI Answer Card */}
//         {answer && (
//           <div
//             style={{
//               padding:      '12px',
//               background:   'rgba(255,255,255,0.1)',
//               borderRadius: '6px',
//               color:        'white',
//               fontSize:     `${fontSize}px`,
//               maxWidth:     '100%',
//               maxHeight:    '60vh',
//               overflow:     'auto',
//               resize:       'both',
//             }}
//           >
//             <h3 style={{ marginTop: 0 }}>AI Answer</h3>
//             <p>{answer}</p>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }
//
//
//
//
//
//
// import React, { useState, useRef, useEffect, useCallback } from 'react'
//
// export default function App() {
//   const [recording, setRecording] = useState(false)
//   const [answer,    setAnswer]    = useState('')
//   const [fontSize,  setFontSize]  = useState(14)
//
//   const mediaRecorderRef = useRef(null)
//   const chunksRef        = useRef([])
//
//   // 1) Audio → AI pipeline
//   const processAudioBlob = async (blob) => {
//     try {
//       // Transcribe
//       const form = new FormData()
//       form.append('file', blob, 'clip.webm')
//       const { text } = await (await fetch('http://localhost:8000/transcribe/', {
//         method: 'POST', body: form
//       })).json()
//
//       // Classify
//       const { category } = await (await fetch('http://localhost:8000/classify/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ text })
//       })).json()
//
//       // Generate
//       const { answer: aiAnswer } = await (await fetch('http://localhost:8000/generate/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ question: text, category })
//       })).json()
//
//       setAnswer(aiAnswer)
//     } catch (err) {
//       console.error('🚨 AI pipeline error', err)
//     }
//   }
//
//   // 2) Toggle recording
//   const handleRecordToggle = useCallback(async () => {
//     console.log('🔔 Renderer: handleRecordToggle, recording=', recording)
//     if (!recording) {
//       console.log('▶️ start recording')
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
//       chunksRef.current = []
//       const recorder = new MediaRecorder(stream)
//       mediaRecorderRef.current = recorder
//
//       recorder.ondataavailable = e => {
//         if (e.data.size) chunksRef.current.push(e.data)
//       }
//       recorder.onstop = async () => {
//           console.log('⏹️ Recorder stopped — chunks length:', chunksRef.current.length);
//            try {
//             const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || 'audio/webm' });
//             stream.getTracks().forEach(t => t.stop());
//             await processAudioBlob(blob);
//           } catch (err) {
//             console.error('❌ onstop handler error', err);
//           }
//           };
// //         const blob = new Blob(chunksRef.current, { type: chunksRef.current[0].type })
// //         stream.getTracks().forEach(t => t.stop())
// //         await processAudioBlob(blob)
// //       }
//       recorder.start()
//       setRecording(true)
//     } else {
//       console.log('⏹️ stop recording')
//       mediaRecorderRef.current.stop()
//       setRecording(false)
//     }
//   }, [recording])
//
//
//   return (
//     <div
//       style={{
//         position: 'fixed',
//         top:      20,
//         left:     20,
//         zIndex:   9999,
//
//       }}
//     >
//
//       {/* Drag handle */}
//       <div
//         style={{
//           WebkitAppRegion: 'drag',
//           height:          24,
//           display:        'flex',
//           alignItems:     'center',
//           justifyContent: 'center',
//           color:          'rgba(255,255,255,0.7)',
//           cursor:         'move',
//           userSelect:     'none',
//         }}
//       >
//         ⋮ ⋮ ⋮
//       </div>
//
//       {/* No‐drag content */}
//       <div style={{
//         WebkitAppRegion: 'no-drag',
//         background:      'rgba(0,0,0,0.6)',
//         padding:         12,
//         borderRadius:    8,
//       }}>
//         {/* Font‐size */}
//         <label style={{ color: 'white' }}>
//           Font size:&nbsp;
//           <input
//             type="range"
//             min="10" max="30"
//             value={fontSize}
//             onChange={e => setFontSize(+e.target.value)}
//           />
//           &nbsp;<strong>{fontSize}px</strong>
//         </label>
//
//         {/* Record button */}
//         <button
//           onClick={handleRecordToggle}
//           style={{ margin: '12px 0', padding: '6px 12px' }}
//         >
//           { recording ? 'Stop & Process' : 'Start Recording' }
//         </button>
//
//         {/* AI Answer card */}
//         {answer && (
//           <div style={{
//             padding:      12,
//             background:   'rgba(255,255,255,0.1)',
//             borderRadius: 6,
//             color:        'white',
//             fontSize:     `${fontSize}px`,
// //             maxWidth:     '100%',
//             maxHeight:    '60vh',
// //             width: '100%',
// //             height:'100%',
//             overflow:     'auto',
//             resize:       'both'
//           }}>
//             <h3 style={{ marginTop: 0 }}>AI Answer</h3>
//             <p>{answer}</p>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }










// frontend/src/App.jsx

import React, { useState, useRef, useCallback } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'

// ————————————————————————————————
// 1) MainOverlay: your existing overlay + “Setup Profile” button
// ————————————————————————————————
function MainOverlay() {
  const navigate = useNavigate()
  const [recording, setRecording] = useState(false)
  const [answer,    setAnswer]    = useState('')
  const [fontSize,  setFontSize]  = useState(14)

  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])

  // 1) Audio → AI pipeline
  const processAudioBlob = async (blob) => {
    try {
      // Transcribe
      const form = new FormData()
      form.append('file', blob, 'clip.webm')
      const { text } = await (await fetch('http://localhost:8000/transcribe/', {
        method: 'POST', body: form
      })).json()

      // Classify
      const { category } = await (await fetch('http://localhost:8000/classify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })).json()

//       // Generate
//       const { answer: aiAnswer } = await (await fetch('http://localhost:8000/generate/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ question: text, category })
//       })).json()
        // Generate with profile
        // 1. Load profile from localStorage
        const stored = localStorage.getItem('candidateProfile')
        const profile = stored ? JSON.parse(stored) : {}

        // 2. Build payload
        const payload = {
          question: text,
          category,
          profile,        // { resume, role, company }
        }

        // 3. Send to your backend
        const { answer: aiAnswer } = await (await fetch(
          'http://localhost:8000/generate/',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        )).json()


      setAnswer(aiAnswer)
    } catch (err) {
      console.error('🚨 AI pipeline error', err)
    }
  }

  // 2) Toggle recording
  const handleRecordToggle = useCallback(async () => {
    if (!recording) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = e => {
        if (e.data.size) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || 'audio/webm' })
          stream.getTracks().forEach(t => t.stop())
          await processAudioBlob(blob)
        } catch (err) {
          console.error('❌ onstop handler error', err)
        }
      }

      recorder.start()
      setRecording(true)
    } else {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }, [recording])

  return (
    <div
      style={{
        position: 'fixed',
        top:      20,
        left:     20,
        zIndex:   9999,
      }}
    >
      {/* Drag handle */}
      <div
        style={{
          WebkitAppRegion: 'drag',
          height:          24,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          color:          'rgba(255,255,255,0.7)',
          cursor:         'move',
          userSelect:     'none',
        }}
      >
        ⋮ ⋮ ⋮
      </div>

      {/* No‐drag content */}
      <div style={{
        WebkitAppRegion: 'no-drag',
        background:      'rgba(0,0,0,0.6)',
        padding:         12,
        borderRadius:    8,
      }}>
        {/* **Setup Profile** button */}
         <button
           onClick={() => window.open('http://localhost:5173/profile-setup', '_blank')}
           style={{ marginBottom: 12, padding: '6px 12px' }}
         >
           Setup Profile
         </button>

        {/* Font‐size slider */}
        <label style={{ color: 'white' }}>
          Font size:&nbsp;
          <input
            type="range"
            min="10" max="30"
            value={fontSize}
            onChange={e => setFontSize(+e.target.value)}
          />
          &nbsp;<strong>{fontSize}px</strong>
        </label>

        {/* Record button */}
        <button
          onClick={handleRecordToggle}
          style={{ margin: '12px 0', padding: '6px 12px' }}
        >
          { recording ? 'Stop & Process' : 'Start Recording' }
        </button>

        {/* AI Answer card */}
        {answer && (
          <div style={{
            padding:      12,
            background:   'rgba(255,255,255,0.1)',
            borderRadius: 6,
            color:        'white',
            fontSize:     `${fontSize}px`,
            maxHeight:    '60vh',
            overflow:     'auto',
            resize:       'both'
          }}>
            <h3 style={{ marginTop: 0 }}>AI Answer</h3>
            <p>{answer}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ————————————————————————————————
// 2) ProfileSetupForm stub
// ————————————————————————————————
function ProfileSetupForm() {
  const [resume, setResume]   = useState('')
  const [role, setRole]       = useState('')
  const [company, setCompany] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    // Save to browser storage for now
    const profile = { resume, role, company }
    localStorage.setItem('candidateProfile', JSON.stringify(profile))
    // Go back to main overlay
    navigate('/')
  }

   return (
    <div
      style={{
        position: 'fixed',
        top:      20,
        left:     20,
        zIndex:   9999,
      }}
    >
      {/* 1) Drag handle (always draggable) */}
      <div

        style={{
          WebkitAppRegion: 'drag',
          height:          24,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          color:           'rgba(255,255,255,0.7)',
          cursor:          'move',
          userSelect:      'none',
        }}
      >
        ⋮ ⋮ ⋮
      </div>

      {/* 2) Non-draggable form container */}
      <div
        className="no-drag"

        style={{
          WebkitAppRegion: 'no-drag',
          background:      'rgba(0,0,0,0.6)',
          color:           'white',
          padding:         20,
          borderRadius:    8,
          width:           300,       // adjust as needed
        }}
      >
        <h2>Profile Setup</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Resume Text:</label>
            <textarea
              required
              value={resume}
              onChange={e => setResume(e.target.value)}
              style={{ width: '100%', height: 100 }}
              placeholder="Paste your resume here"
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Target Role:</label>
            <input
              required
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              style={{ width: '100%' }}
              placeholder="e.g. Site Reliability Engineer"
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Company Name:</label>
            <input
              required
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              style={{ width: '100%' }}
              placeholder="e.g. Cogent Labs"
            />
          </div>
          <button type="submit" style={{ marginRight: 8, padding: '6px 12px' }}>
            Save & Return
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{ padding: '6px 12px' }}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
 }



// ————————————————————————————————
// 3) App: route definitions
// ————————————————————————————————
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainOverlay />} />
      <Route path="/profile-setup" element={<ProfileSetupForm />} />
    </Routes>
  )
}
