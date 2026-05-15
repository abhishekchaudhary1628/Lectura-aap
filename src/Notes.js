import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

export default function Notes({ notes, transcript, todos, setup, recording, onBack }) {
  const [showTranscript, setShowTranscript] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [studentNotes, setStudentNotes] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [doneTodos, setDoneTodos] = useState([])
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    let t = 0

    const waves = [
      { amp: 40, freq: 0.01, speed: 0.03, color: [255, 50, 50], y: 0.5 },
      { amp: 25, freq: 0.016, speed: 0.05, color: [255, 130, 50], y: 0.6 },
      { amp: 50, freq: 0.007, speed: 0.02, color: [255, 0, 100], y: 0.7 },
      { amp: 20, freq: 0.022, speed: 0.07, color: [140, 0, 255], y: 0.55 },
      { amp: 30, freq: 0.013, speed: 0.04, color: [0, 180, 255], y: 0.65 },
    ]

    const bars = Array.from({ length: 80 }, (_, i) => ({
      x: (canvas.width / 80) * i,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.06 + 0.02,
      colorIndex: Math.floor(Math.random() * waves.length)
    }))

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      color: waves[Math.floor(Math.random() * waves.length)].color,
      opacity: Math.random() * 0.3 + 0.05
    }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      t += 0.01

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
        grad.addColorStop(0.3, `rgba(${wave.color.join(',')},0.3)`)
        grad.addColorStop(0.7, `rgba(${wave.color.join(',')},0.3)`)
        grad.addColorStop(1, `rgba(${wave.color.join(',')},0)`)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.stroke()
      })

      bars.forEach(bar => {
        const h = 10 + Math.abs(Math.sin(t * bar.speed * 10 + bar.phase)) * 70
        const alpha = 0.05 + Math.abs(Math.sin(t * bar.speed * 10 + bar.phase)) * 0.1
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

  const scheduleReminder = (todo) => {
    if (Notification.permission === 'granted') {
      new Notification('⏰ Reminder', { body: todo.text, icon: '/favicon.ico' })
    }
  }

  const getTitle = () => {
    if (recording) return recording.topic || recording.subject || 'Notes'
    if (setup?.userType === 'personal') return setup?.title
    return setup?.topic || 'Notes'
  }

  const getAccentColor = () => {
    const type = recording?.course_type || setup?.userType
    if (type === 'personal') return { color: '#a855f7', rgb: '168,85,247' }
    if (type === 'professional') return { color: '#00ffcc', rgb: '0,255,204' }
    return { color: '#ff3030', rgb: '255,48,48' }
  }

  const accent = getAccentColor()

  return (
    <div style={{
      minHeight: '100vh', background: '#030303',
      color: '#fff', fontFamily: "'Inter', sans-serif",
      position: 'relative', overflow: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Syne:wght@700;800&family=Share+Tech+Mono&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }

        .notes-content {
          animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }
        .notes-line {
          animation: slideIn 0.4s ease both;
        }

        .toggle-btn {
          padding: 8px 18px;
          border-radius: 6px; border: none;
          font-size: 12px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
          font-family: 'Share Tech Mono', monospace;
          letter-spacing: 0.05em;
        }

        .action-btn {
          padding: 8px 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 6px; color: #444;
          font-size: 12px; cursor: pointer;
          transition: all 0.2s;
          font-family: 'Share Tech Mono', monospace;
          letter-spacing: 0.05em;
        }
        .action-btn:hover {
          border-color: rgba(255,255,255,0.1);
          color: #888;
          background: rgba(255,255,255,0.05);
        }

        .todo-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 8px; margin-bottom: 8px;
          transition: all 0.2s;
          animation: fadeUp 0.4s ease both;
        }
        .todo-item:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.08);
        }

        .upload-area {
          border: 1px dashed rgba(255,255,255,0.08);
          border-radius: 10px; padding: 24px;
          text-align: center;
          background: rgba(255,255,255,0.01);
          animation: fadeUp 0.4s ease both;
        }
        .upload-inp {
          width: 100%; padding: 12px 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px; color: #ccc;
          font-size: 13px; outline: none;
          font-family: 'Inter', sans-serif;
          resize: vertical; min-height: 100px;
          transition: border 0.2s;
        }
        .upload-inp:focus {
          border-color: rgba(${accent.rgb},0.3);
        }

        .back-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 6px; color: #333;
          font-size: 12px; cursor: pointer;
          transition: all 0.2s;
          font-family: 'Share Tech Mono', monospace;
          letter-spacing: 0.05em;
        }
        .back-btn:hover {
          border-color: rgba(255,255,255,0.12);
          color: #666;
        }
      `}</style>

      {/* Canvas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* Overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(3,3,3,0.7) 0%, rgba(0,0,0,0.88) 100%)'
      }} />

      {/* Navbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(3,3,3,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '0 28px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="back-btn" onClick={onBack}>← BACK</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '6px', height: '6px',
              background: accent.color, borderRadius: '50%',
              animation: 'pulse-dot 2s ease-in-out infinite',
              boxShadow: `0 0 8px rgba(${accent.rgb},0.8)`
            }} />
            <span style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '13px', color: '#444', letterSpacing: '0.08em'
            }}>
              {getTitle()?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Toggle */}
        {transcript && (
          <div style={{
            display: 'flex', gap: '4px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '6px', padding: '3px'
          }}>
            <button className="toggle-btn" onClick={() => setShowTranscript(false)}
              style={{
                background: !showTranscript ? `rgba(${accent.rgb},0.12)` : 'transparent',
                color: !showTranscript ? accent.color : '#333',
                border: !showTranscript ? `1px solid rgba(${accent.rgb},0.2)` : '1px solid transparent'
              }}>AI NOTES</button>
            <button className="toggle-btn" onClick={() => setShowTranscript(true)}
              style={{
                background: showTranscript ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: showTranscript ? '#fff' : '#333',
                border: showTranscript ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent'
              }}>TRANSCRIPT</button>
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '5px 12px',
          background: `rgba(${accent.rgb},0.04)`,
          border: `1px solid rgba(${accent.rgb},0.1)`,
          borderRadius: '4px',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '10px', color: `rgba(${accent.rgb.split(',').map(Number).join(',')},0.6)`,
          letterSpacing: '0.1em'
        }}>
          <div style={{ width: '5px', height: '5px', background: accent.color, borderRadius: '50%' }} />
          NOTE ACTIVE
        </div>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Title block */}
        <div className="notes-content" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '3px', height: '32px',
              background: `linear-gradient(180deg, ${accent.color}, transparent)`,
              borderRadius: '2px'
            }} />
            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '28px', fontWeight: '800',
              color: '#fff', letterSpacing: '-0.02em'
            }}>{getTitle()}</h1>
          </div>
          {recording && (
            <p style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '11px', color: '#222', letterSpacing: '0.1em', paddingLeft: '15px'
            }}>
              // {recording.subject && `${recording.subject} · `}
              {recording.course_name && `${recording.course_name} · `}
              {recording.year && `${recording.year}`}
            </p>
          )}
        </div>

        {/* Notes or Transcript */}
        <div className="notes-content" style={{
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid rgba(${accent.rgb},0.08)`,
          borderTop: `1px solid rgba(${accent.rgb},0.2)`,
          borderRadius: '12px', padding: '28px',
          marginBottom: '24px',
          position: 'relative', overflow: 'hidden',
          boxShadow: `0 0 40px rgba(${accent.rgb},0.04)`
        }}>
          {/* Top accent */}
          <div style={{
            position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
            background: `linear-gradient(90deg, transparent, rgba(${accent.rgb},0.4), transparent)`
          }} />

          {/* Label */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '20px'
          }}>
            <span style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '10px', color: accent.color,
              letterSpacing: '0.15em', opacity: 0.7
            }}>
              {showTranscript ? '// RAW TRANSCRIPT' : '// AI GENERATED NOTES'}
            </span>
          </div>

          <pre style={{
            whiteSpace: 'pre-wrap', lineHeight: '1.9',
            fontFamily: showTranscript ? "'Share Tech Mono', monospace" : "'Inter', sans-serif",
            fontSize: showTranscript ? '13px' : '14px',
            color: showTranscript ? '#444' : '#ccc',
            margin: 0
          }}>
            {showTranscript ? transcript : (notes || 'No notes available.')}
          </pre>
        </div>

        {/* Student notes upload */}
        {(recording?.course_type !== 'personal' || !recording) && (
          <div style={{ marginBottom: '24px' }}>
            <button className="action-btn" onClick={() => setShowUpload(!showUpload)}>
              {showUpload ? '↑ HIDE' : '+ ADD YOUR NOTES'} — improve with your own notes
            </button>

            {showUpload && (
              <div className="upload-area" style={{ marginTop: '12px' }}>
                <p style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '11px', color: '#222',
                  letterSpacing: '0.08em', marginBottom: '12px'
                }}>// PASTE YOUR HANDWRITTEN OR TYPED NOTES</p>
                <textarea
                  className="upload-inp"
                  value={studentNotes}
                  onChange={e => setStudentNotes(e.target.value)}
                  placeholder="Type or paste your notes here to improve AI output..."
                />
                <button
                  onClick={async () => {
                    if (!studentNotes.trim() || !recording?.id) return
                    await supabase.from('notes')
                      .update({ student_notes: studentNotes })
                      .eq('recording_id', recording.id)
                    alert('Notes saved! AI merge coming soon.')
                  }}
                  style={{
                    marginTop: '12px', padding: '10px 24px',
                    background: `rgba(${accent.rgb},0.1)`,
                    border: `1px solid rgba(${accent.rgb},0.2)`,
                    borderRadius: '6px', color: accent.color,
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '12px', cursor: 'pointer',
                    letterSpacing: '0.1em', transition: 'all 0.2s'
                  }}>
                  SAVE NOTES →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action items / todos */}
        {todos && todos.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '16px'
            }}>
              <div style={{ width: '3px', height: '16px', background: '#ff3030', borderRadius: '2px' }} />
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '11px', color: '#444', letterSpacing: '0.15em'
              }}>// ACTION ITEMS & REMINDERS</span>
            </div>

            {todos.map((t, i) => (
              <div key={i} className="todo-item"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  opacity: doneTodos.includes(i) ? 0.4 : 1,
                  textDecoration: doneTodos.includes(i) ? 'line-through' : 'none'
                }}>
                <div
                  onClick={() => setDoneTodos(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                  style={{
                    width: '16px', height: '16px', flexShrink: 0,
                    border: `1px solid rgba(${accent.rgb},0.3)`,
                    borderRadius: '3px', cursor: 'pointer',
                    background: doneTodos.includes(i) ? `rgba(${accent.rgb},0.2)` : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: '2px', transition: 'all 0.2s'
                  }}>
                  {doneTodos.includes(i) && <span style={{ fontSize: '10px', color: accent.color }}>✓</span>}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#bbb' }}>{t.text}</div>
                  {t.due_date && (
                    <div style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '10px', color: '#ff3030',
                      marginTop: '4px', letterSpacing: '0.05em'
                    }}>📅 {t.due_date}</div>
                  )}
                </div>

                {t.due_date && (
                  <button onClick={() => scheduleReminder(t)}
                    style={{
                      padding: '5px 10px',
                      background: 'rgba(255,48,48,0.06)',
                      border: '1px solid rgba(255,48,48,0.12)',
                      borderRadius: '4px', cursor: 'pointer',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '10px', color: '#ff3030',
                      letterSpacing: '0.05em', transition: 'all 0.2s'
                    }}>
                    🔔 REMIND
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}