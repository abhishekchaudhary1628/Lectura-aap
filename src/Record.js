import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { transcribeAudio, generateNotes, fetchTopicContext, extractTodos } from './groq'

export default function Record({ setup, onDone, onBack }) {
  const [recording, setRecording] = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const [status, setStatus] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [bars, setBars] = useState(Array(20).fill(4))
  const mediaRecorder = useRef(null)
  const chunks = useRef([])
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const timerRef = useRef(null)
  const barAnimRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    let t = 0
    const waves = [
      { amp: 70, freq: 0.01, speed: 0.03, color: [255, 50, 50], y: 0.35 },
      { amp: 50, freq: 0.016, speed: 0.05, color: [255, 130, 50], y: 0.45 },
      { amp: 90, freq: 0.007, speed: 0.02, color: [255, 0, 100], y: 0.55 },
      { amp: 35, freq: 0.022, speed: 0.07, color: [255, 80, 160], y: 0.6 },
      { amp: 55, freq: 0.013, speed: 0.04, color: [140, 0, 255], y: 0.4 },
      { amp: 40, freq: 0.019, speed: 0.06, color: [0, 180, 255], y: 0.5 },
    ]
    const bgBars = Array.from({ length: 80 }, (_, i) => ({
      x: (canvas.width / 80) * i,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.06 + 0.02,
      colorIndex: Math.floor(Math.random() * waves.length)
    }))
    const orbs = Array.from({ length: 8 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 80 + 40,
      speed: Math.random() * 0.003 + 0.001,
      phase: Math.random() * Math.PI * 2,
      color: waves[Math.floor(Math.random() * waves.length)].color
    }))
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 1.5 + 0.5,
      color: waves[Math.floor(Math.random() * waves.length)].color,
      opacity: Math.random() * 0.5 + 0.1
    }))
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      t += 0.01
      orbs.forEach(orb => {
        orb.x += Math.sin(t * orb.speed * 10 + orb.phase) * 0.8
        orb.y += Math.cos(t * orb.speed * 8 + orb.phase) * 0.5
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r)
        grad.addColorStop(0, `rgba(${orb.color.join(',')},0.22)`)
        grad.addColorStop(1, `rgba(${orb.color.join(',')},0)`)
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      })
      waves.forEach(wave => {
        ctx.beginPath()
        ctx.moveTo(0, canvas.height * wave.y)
        for (let x = 0; x <= canvas.width; x += 3) {
          const y = canvas.height * wave.y +
            Math.sin(x * wave.freq + t * wave.speed * 100) * wave.amp +
            Math.sin(x * wave.freq * 2.5 + t * wave.speed * 60) * (wave.amp * 0.35) +
            Math.sin(x * wave.freq * 0.5 + t * wave.speed * 40) * (wave.amp * 0.5)
          ctx.lineTo(x, y)
        }
        const grad = ctx.createLinearGradient(0, 0, canvas.width, 0)
        grad.addColorStop(0, `rgba(${wave.color.join(',')},0)`)
        grad.addColorStop(0.3, `rgba(${wave.color.join(',')},0.55)`)
        grad.addColorStop(0.7, `rgba(${wave.color.join(',')},0.55)`)
        grad.addColorStop(1, `rgba(${wave.color.join(',')},0)`)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.stroke()
      })
      bgBars.forEach(bar => {
        const h = 15 + Math.abs(Math.sin(t * bar.speed * 10 + bar.phase)) * 100
        const alpha = 0.08 + Math.abs(Math.sin(t * bar.speed * 10 + bar.phase)) * 0.15
        const c = waves[bar.colorIndex].color
        const grad = ctx.createLinearGradient(0, canvas.height - h, 0, canvas.height)
        grad.addColorStop(0, `rgba(${c.join(',')},${alpha})`)
        grad.addColorStop(1, `rgba(${c.join(',')},0)`)
        ctx.fillStyle = grad
        ctx.fillRect(bar.x, canvas.height - h, canvas.width / 80 - 1, h)
      })
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color.join(',')},${p.opacity})`
        ctx.fill()
      })
      animRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize) }
  }, [])

  // Animated bars when recording
  useEffect(() => {
    if (recording) {
      const animateBars = () => {
        setBars(Array(20).fill(0).map(() => Math.random() * 50 + 8))
        barAnimRef.current = setTimeout(animateBars, 100)
      }
      animateBars()
    } else {
      clearTimeout(barAnimRef.current)
      setBars(Array(20).fill(4))
    }
    return () => clearTimeout(barAnimRef.current)
  }, [recording])

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(timerRef.current)
      if (!audioURL) setElapsed(0)
    }
    return () => clearInterval(timerRef.current)
  }, [recording])

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.current = new MediaRecorder(stream)
    chunks.current = []
    mediaRecorder.current.ondataavailable = (e) => { chunks.current.push(e.data) }
    mediaRecorder.current.onstop = async () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' })
      const url = URL.createObjectURL(blob)
      setAudioURL(url)
      setStatus('Uploading audio...')
      const fileName = `recording_${Date.now()}.webm`
      const { error } = await supabase.storage.from('recordings').upload(fileName, blob)
      if (error) { setStatus('Upload failed ❌'); return }
      setStatus('Transcribing... 🎙️')
      const transcript = await transcribeAudio(blob)
      let topicContext = ''
      if (setup.userType === 'student') {
        setStatus('Loading context... 🧠')
        topicContext = await fetchTopicContext(setup.topic, setup.subject, setup.course_name, setup.year, setup.subBranch, setup.classLevel, setup.stream)
      }
      setStatus('Generating notes... 🤖')
      const notes = await generateNotes(transcript, setup, topicContext)
      let todos = []
      if (['professional', 'student'].includes(setup.userType) || ['goals', 'braindump'].includes(setup.personal_mode)) {
        setStatus('Extracting action items...')
        todos = await extractTodos(transcript)
      }
      setStatus('Saving...')
      const { data: rec } = await supabase.from('recordings').insert({
        user_id: (await supabase.auth.getUser()).data.user.id,
        subject: setup.subject || setup.title || setup.topic || '',
        topic: setup.topic || setup.title || setup.personal_mode || '',
        course_type: setup.course_type || setup.userType,
        course_name: setup.course_name || setup.userType,
        year: setup.year || setup.classLevel || '',
        language_pref: setup.language_pref,
        notes_style: setup.notes_style || 'Bullet',
        audio_url: fileName
      }).select().single()
      if (rec) {
        await supabase.from('notes').insert({ recording_id: rec.id, ai_draft: notes })
        if (todos.length > 0) {
          const { data: { user } } = await supabase.auth.getUser()
          await supabase.from('todos').insert(todos.map(t => ({ user_id: user.id, recording_id: rec.id, text: t.text, due_date: t.due || null })))
        }
      }
      setStatus('Done! ✅')
      onDone(notes, transcript, todos)
    }
    mediaRecorder.current.start()
    setRecording(true)
  }

  const stopRecording = () => { mediaRecorder.current.stop(); setRecording(false) }

  const getTitle = () => {
    if (setup.userType === 'student') return `${setup.subject} — ${setup.topic}`
    if (setup.userType === 'personal') return setup.title
    return setup.topic || 'Recording'
  }

  const getSubtitle = () => {
    if (setup.userType === 'student') return `${setup.course_name || ''} ${setup.subBranch ? '(' + setup.subBranch + ')' : ''} ${setup.year || ''}`
    if (setup.userType === 'professional') return setup.meeting_type
    return setup.userType?.toUpperCase()
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#030303',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', sans-serif",
      position: 'relative', overflow: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Syne:wght@700;800&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes scanline {
          0% { top: 0; opacity: 0.6; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes expand {
          0% { width: 0; }
          100% { width: 100%; }
        }
        @keyframes barGrow {
          from { height: 4px; }
          to { height: var(--h); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255,48,48,0.3); }
          50% { box-shadow: 0 0 60px rgba(255,48,48,0.7), 0 0 100px rgba(255,48,48,0.3); }
        }

        .back-btn {
          padding: 7px 14px; background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 6px; color: #888;
          font-size: 11px; cursor: pointer; transition: all 0.2s;
          font-family: 'Share Tech Mono', monospace; letter-spacing: 0.08em;
        }
        .back-btn:hover { border-color: rgba(255,255,255,0.3); color: #ccc; }
        .back-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(3,3,3,0.5) 0%, rgba(0,0,0,0.88) 100%)'
      }} />

      {/* Navbar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(3,3,3,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '0 28px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="back-btn" onClick={onBack} disabled={recording}>← BACK</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '3px', height: '18px', background: 'linear-gradient(180deg, #ff3030, #a855f7)', borderRadius: '2px' }} />
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '13px', color: '#555', letterSpacing: '0.15em' }}>
              RECORDING SESSION
            </span>
          </div>
        </div>
        {recording && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 14px',
            background: 'rgba(255,48,48,0.06)',
            border: '1px solid rgba(255,48,48,0.15)',
            borderRadius: '4px',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '13px', color: '#ff3030', letterSpacing: '0.15em'
          }}>
            <div style={{
              width: '6px', height: '6px', background: '#ff3030',
              borderRadius: '50%', animation: 'blink 1s ease-in-out infinite',
              boxShadow: '0 0 8px rgba(255,48,48,0.8)'
            }} />
            {formatTime(elapsed)}
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{
        position: 'relative', zIndex: 10,
        flex: 1, display: 'flex',
        flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '48px', padding: '80px 24px 40px'
      }}>

        {/* Info block */}
        {!status && (
          <div style={{
            textAlign: 'center',
            animation: 'fadeUp 0.6s ease both'
          }}>
            {/* Top line */}
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '15px', color: '#333',
              letterSpacing: '0.2em', marginBottom: '16px'
            }}>// {getSubtitle()}</div>

            {/* Main title */}
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: '800', color: '#fff',
              letterSpacing: '-0.03em', lineHeight: 1.1,
              marginBottom: '20px'
            }}>{getTitle()}</div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                setup.userType?.toUpperCase(),
                setup.language_pref,
                setup.notes_style || setup.personal_mode
              ].filter(Boolean).map((tag, i) => (
                <span key={i} style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '10px', color: '#ff3030',
                  background: 'rgba(255,48,48,0.06)',
                  border: '1px solid rgba(255,48,48,0.12)',
                  padding: '4px 12px', borderRadius: '3px',
                  letterSpacing: '0.1em'
                }}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        {status && (
          <div style={{ textAlign: 'center', animation: 'fadeUp 0.4s ease both' }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '28px', fontWeight: '800',
              color: '#fff', marginBottom: '24px'
            }}>{getTitle()}</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              justifyContent: 'center',
              padding: '14px 28px',
              background: 'rgba(255,48,48,0.04)',
              border: '1px solid rgba(255,48,48,0.1)',
              borderRadius: '6px',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '13px', color: 'rgba(255,80,80,0.7)',
              letterSpacing: '0.1em'
            }}>
              <div style={{
                width: '6px', height: '6px', background: '#ff3030',
                borderRadius: '50%', animation: 'blink 1s ease-in-out infinite',
                boxShadow: '0 0 8px rgba(255,48,48,0.8)'
              }} />
              {status}
            </div>
            <div style={{
              marginTop: '16px', height: '1px',
              background: 'rgba(255,255,255,0.04)',
              overflow: 'hidden', width: '360px'
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, transparent, #ff3030)',
                animation: 'expand 1.5s ease infinite alternate'
              }} />
            </div>
          </div>
        )}

        {/* THE UNIQUE BUTTON SECTION */}
        {!status && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '24px'
          }}>
            {/* Visualizer bars — always visible, active when recording */}
            <div style={{
              display: 'flex', alignItems: 'flex-end',
              gap: '4px', height: '64px'
            }}>
              {bars.map((h, i) => (
                <div key={i} style={{
                  width: '6px',
                  height: recording ? `${h}px` : '4px',
                  background: recording
                    ? `hsl(${340 + i * 5}, 90%, ${50 + i * 1}%)`
                    : 'rgba(255,255,255,0.08)',
                  borderRadius: '3px',
                  transition: 'height 0.1s ease',
                  boxShadow: recording ? `0 0 6px hsl(${340 + i * 5}, 90%, 50%)` : 'none'
                }} />
              ))}
            </div>

            {/* Main button */}
            {!recording ? (
              <div
                onClick={startRecording}
                style={{
                  position: 'relative',
                  width: '200px', height: '200px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                {/* Outer hexagon-ish shape via clip-path */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(255,48,48,0.04)',
                  border: '1px solid rgba(255,48,48,0.25)',
                  clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
                  transition: 'all 0.3s',
                  boxShadow: '0 0 40px rgba(255,48,48,0.15)'
                }} />
                <div style={{
                  position: 'absolute', inset: '12px',
                  background: 'transparent',
                  border: '1px solid rgba(255,48,48,0.1)',
                  clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)'
                }} />
                {/* Center content */}
                <div style={{
                  position: 'relative', zIndex: 2,
                  textAlign: 'center', pointerEvents: 'none'
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎙️</div>
                  <div style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '11px', color: '#ff3030',
                    letterSpacing: '0.2em'
                  }}>START</div>
                </div>
              </div>
            ) : (
              <div
                onClick={stopRecording}
                style={{
                  position: 'relative',
                  width: '200px', height: '200px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'glow-pulse 2s ease-in-out infinite'
                }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(255,48,48,0.08)',
                  border: '1px solid rgba(255,48,48,0.6)',
                  clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
                  boxShadow: '0 0 60px rgba(255,48,48,0.4), inset 0 0 40px rgba(255,48,48,0.1)'
                }} />
                <div style={{
                  position: 'absolute', inset: '12px',
                  background: 'transparent',
                  border: '1px solid rgba(255,48,48,0.2)',
                  clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)'
                }} />
                <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏹</div>
                  <div style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '11px', color: '#ff3030',
                    letterSpacing: '0.2em', animation: 'blink 1.5s ease-in-out infinite'
                  }}>STOP</div>
                </div>
              </div>
            )}

            {/* Hint text */}
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '10px', color: '#1a1a1a',
              letterSpacing: '0.15em'
            }}>
              {recording ? '// TAP TO STOP RECORDING' : '// TAP TO BEGIN SESSION'}
            </div>
          </div>
        )}

        {/* Audio player */}
        {audioURL && !status && (
          <audio controls src={audioURL} style={{
            width: '300px', opacity: 0.5,
            filter: 'invert(1) hue-rotate(180deg)',
            animation: 'fadeUp 0.4s ease both'
          }} />
        )}
      </div>
    </div>
  )
}