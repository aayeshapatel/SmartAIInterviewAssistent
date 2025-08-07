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
        // 1. Fetch the saved profile from your FastAPI server
         const profileRes = await fetch('http://localhost:8000/api/profile')
         const profile    = await profileRes.json()

         // 2. Build payload including the fetched profile
         const payload = { question: text, category, profile }

         // 3. Send to your backend generate endpoint
         const { answer: aiAnswer } = await (
           await fetch('http://localhost:8000/generate/', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(payload),
           })
         ).json()


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
              onClick={() =>
                window.open(
                  'http://localhost:8000/profile-setup',
                  '_blank',
                  'width=500,height=600'
                )
              }
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
