import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

export default function Settings({ onBack }) {
  const [user, setUser] = useState(null)
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'English')
  const [notesStyle, setNotesStyle] = useState(localStorage.getItem('notesStyle') || 'Bullet')
  const [notifications, setNotifications] = useState(localStorage.getItem('notifs') !== 'false')
  const [saved, setSaved] = useState(false)
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

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
      { amp: 25, freq: 0.016, speed: 0.05, color: [140, 0, 255], y: 0.6 },
      { amp: 50, freq: 0.007, speed: 0.02, color: [0, 180, 255], y: 0.7 },
    ]
    const bars = Array.from({ length: 80 }, (_, i) => ({
      x: (canvas.width / 80) * i,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.06 + 0.02,
      colorIndex: Math.floor(Math.random() * waves.length)
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
      animRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize) }
  }, [])

  const handleSave = () => {
    localStorage.setItem('lang', language)
    localStorage.setItem('notesStyle', notesStyle)
    localStorage.setItem('notifs', notifications)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete ALL recordings? This cannot be undone.')) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('notes').delete().in('recording_id',
      (await supabase.from('recordings').select('id').eq('user_id', user.id)).data?.map(r => r.id) || []
    )
    await supabase.from('recordings').delete().eq('user_id', user.id)
    alert('All recordings deleted.')
  }

  const Section = ({ title, children }) => (
    <div style={{
      marginBottom: '24px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '10px', overflow: 'hidden',
      animation: 'fadeUp 0.5s ease both'
    }}>
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '10px', color: '#333', letterSpacing: '0.15em'
      }}>// {title}</div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  )

  const Row = ({ label, desc, children }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: '16px'
    }}>
      <div>
        <div style={{ fontSize: '13px', color: '#ccc', marginBottom: '3px' }}>{label}</div>
        {desc && <div style={{ fontSize: '11px', color: '#222' }}>{desc}</div>}
      </div>
      {children}
    </div>
  )

  const Select = ({ value, onChange, options }) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        padding: '7px 12px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '6px', color: '#ccc',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '11px', outline: 'none',
        letterSpacing: '0.05em', cursor: 'pointer'
      }}>
      {options.map(o => <option key={o} value={o} style={{ background: '#111' }}>{o}</option>)}
    </select>
  )

  const Toggle = ({ value, onChange }) => (
    <div onClick={() => onChange(!value)}
      style={{
        width: '40px', height: '22px',
        background: value ? 'rgba(255,48,48,0.3)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${value ? 'rgba(255,48,48,0.4)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '11px', cursor: 'pointer',
        position: 'relative', transition: 'all 0.3s'
      }}>
      <div style={{
        position: 'absolute', top: '3px',
        left: value ? '21px' : '3px',
        width: '14px', height: '14px',
        background: value ? '#ff3030' : '#333',
        borderRadius: '50%', transition: 'all 0.3s',
        boxShadow: value ? '0 0 8px rgba(255,48,48,0.6)' : 'none'
      }} />
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: '#030303',
      color: '#fff', fontFamily: "'Inter', sans-serif",
      position: 'relative', overflow: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Syne:wght@700;800&family=Share+Tech+Mono&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .back-btn {
          padding: 7px 14px; background: transparent;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 6px; color: #333;
          font-size: 11px; cursor: pointer; transition: all 0.2s;
          font-family: 'Share Tech Mono', monospace; letter-spacing: 0.08em;
        }
        .back-btn:hover { border-color: rgba(255,255,255,0.12); color: #666; }
        .save-btn {
          padding: 10px 24px;
          background: rgba(255,48,48,0.1);
          border: 1px solid rgba(255,48,48,0.2);
          border-radius: 6px; color: #ff3030;
          fontFamily: 'Share Tech Mono', monospace;
          fontSize: '12px'; cursor: pointer; transition: all 0.2s;
          letter-spacing: 0.1em; font-family: 'Share Tech Mono', monospace;
          font-size: 12px;
        }
        .save-btn:hover { background: rgba(255,48,48,0.15); box-shadow: 0 0 20px rgba(255,48,48,0.1); }
        .danger-btn {
          padding: 9px 20px;
          background: transparent;
          border: 1px solid rgba(255,48,48,0.15);
          border-radius: 6px; color: #ff3030; opacity: 0.5;
          font-size: 12px; cursor: pointer; transition: all 0.2s;
          font-family: 'Share Tech Mono', monospace; letter-spacing: 0.08em;
        }
        .danger-btn:hover { opacity: 1; border-color: rgba(255,48,48,0.4); background: rgba(255,48,48,0.05); }
        .logout-btn {
          padding: 9px 20px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px; color: #444;
          font-size: 12px; cursor: pointer; transition: all 0.2s;
          font-family: 'Share Tech Mono', monospace; letter-spacing: 0.08em;
        }
        .logout-btn:hover { border-color: rgba(255,255,255,0.15); color: #888; }
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
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
            <div style={{ width: '3px', height: '18px', background: 'linear-gradient(180deg, #ff3030, #a855f7)', borderRadius: '2px' }} />
            <span style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '14px', color: '#555', letterSpacing: '0.15em'
            }}>SETTINGS</span>
          </div>
        </div>

        <button className="save-btn" onClick={handleSave}>
          {saved ? '✓ SAVED' : 'SAVE CHANGES'}
        </button>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '680px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Account */}
        <Section title="ACCOUNT">
          <Row label="Email" desc="Your login email">
            <span style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '12px', color: '#333', letterSpacing: '0.05em'
            }}>{user?.email}</span>
          </Row>
          <Row label="Member since" desc="">
            <span style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '12px', color: '#333'
            }}>{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : '—'}</span>
          </Row>
        </Section>

        {/* Preferences */}
        <Section title="PREFERENCES">
          <Row label="Default Language" desc="Language for AI generated notes">
            <Select value={language} onChange={setLanguage} options={['English', 'Hinglish', 'Hindi']} />
          </Row>
          <Row label="Notes Style" desc="How AI formats your notes">
            <Select value={notesStyle} onChange={setNotesStyle} options={['Bullet', 'Paragraph', 'Mixed']} />
          </Row>
          <Row label="Notifications" desc="Reminders and action item alerts">
            <Toggle value={notifications} onChange={setNotifications} />
          </Row>
        </Section>

        {/* About */}
        <Section title="ABOUT">
          <Row label="App Version" desc="">
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: '#222' }}>v1.0.0 BETA</span>
          </Row>
          <Row label="AI Model" desc="Transcription">
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: '#222' }}>Whisper Large v3 Turbo</span>
          </Row>
          <Row label="Notes AI" desc="">
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: '#222' }}>LLaMA 3.3 70B</span>
          </Row>
        </Section>

        {/* Danger zone */}
        <Section title="DANGER ZONE">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="danger-btn" onClick={handleDeleteAll}>
              DELETE ALL RECORDINGS
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              SIGN OUT
            </button>
          </div>
        </Section>
      </div>
    </div>
  )
}