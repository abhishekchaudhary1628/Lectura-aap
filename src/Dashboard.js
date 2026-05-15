import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

export default function Dashboard({ onNewRecording, onViewNotes, onLibrary, onSettings }) {
  const [recordings, setRecordings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('personal')
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => { fetchRecordings() }, [])

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

    const bars = Array.from({ length: 80 }, (_, i) => ({
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

      bars.forEach(bar => {
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

      particles.forEach((p1, i) => {
        particles.slice(i + 1, i + 5).forEach(p2 => {
          const dx = p1.x - p2.x, dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(255,60,60,${0.06 * (1 - dist / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })

      animRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize) }
  }, [])

  const fetchRecordings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setRecordings([]); setLoading(false); return }
    const { data } = await supabase
      .from('recordings')
      .select('*, notes(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setRecordings(data || [])
    setLoading(false)
  }

  const personalRecs = recordings.filter(r => r.course_type === 'personal')
  const studentRecs = recordings.filter(r =>
    ['Engineering', 'Medical', 'Commerce', 'Arts', 'Law', 'School', 'Coaching'].includes(r.course_type)
  )
  const professionalRecs = recordings.filter(r =>
    ['professional', 'journalist', 'researcher', 'doctor', 'creator'].includes(r.course_type)
  )

  const getCurrentRecs = () => {
    if (activeTab === 'personal') return personalRecs
    if (activeTab === 'student') return studentRecs
    if (activeTab === 'professional') return professionalRecs
    return []
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
  const formatTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })

  const getIcon = (r) => {
    if (r.course_type === 'personal') {
      if (r.topic?.includes('diary')) return '◖'
      if (r.topic?.includes('advice')) return '◒'
      if (r.topic?.includes('goals')) return '◉'
      return '◎'
    }
    if (r.course_type === 'professional') return '▣'
    return '◈'
  }

  const getAccent = (r) => {
    if (r.course_type === 'personal') return { color: '#a855f7', rgb: '168,85,247' }
    if (r.course_type === 'professional') return { color: '#00ffcc', rgb: '0,255,204' }
    return { color: '#ff3030', rgb: '255,48,48' }
  }

  const tabs = [
    { id: 'personal', label: 'Personal', icon: '◎', count: personalRecs.length, color: '#a855f7', rgb: '168,85,247' },
    { id: 'student', label: 'Academic', icon: '◈', count: studentRecs.length, color: '#ff3030', rgb: '255,48,48' },
    { id: 'professional', label: 'Corporate', icon: '▣', count: professionalRecs.length, color: '#00ffcc', rgb: '0,255,204' },
    { id: 'comingsoon', label: 'More', icon: '🔒', count: null, color: '#333', rgb: '51,51,51' },
  ]

  const stats = [
    { id: 'personal', label: 'Personal Logs', count: personalRecs.length, color: '#a855f7', rgb: '168,85,247', icon: '◎', desc: 'Diary · Goals · Thoughts' },
    { id: 'student', label: 'Academic DB', count: studentRecs.length, color: '#ff3030', rgb: '255,48,48', icon: '◈', desc: 'Lectures · Notes · Prep' },
    { id: 'professional', label: 'Corporate Sync', count: professionalRecs.length, color: '#00ffcc', rgb: '0,255,204', icon: '▣', desc: 'Meetings · Tasks · Calls' },
  ]

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
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(0,255,204,0.8); }
          50% { opacity: 0.4; box-shadow: 0 0 2px rgba(0,255,204,0.3); }
        }
        @keyframes scanline {
          0% { top: -2px; }
          100% { top: 100%; }
        }

        .rec-card {
          background: rgba(6,0,0,0.92);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px; padding: 18px;
          cursor: pointer; transition: all 0.25s;
          position: relative; overflow: hidden;
          font-family: 'Share Tech Mono', monospace;
        }
        .rec-card::before {
          content: '';
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 2px;
          transition: opacity 0.3s;
          opacity: 0.6;
        }
        .rec-card:hover {
          background: rgba(255,255,255,0.035);
          border-color: rgba(255,255,255,0.1);
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.5);
        }
        .rec-card:hover::before { opacity: 1; }

        .stat-card {
          background: rgba(6,0,0,0.92);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px; padding: 20px;
          cursor: pointer; transition: all 0.25s;
          position: relative; overflow: hidden;
        }
        .stat-card:hover, .stat-card.active {
          background: rgba(255,255,255,0.03);
          transform: translateY(-2px);
        }
        .stat-card .scan {
          position: absolute; left: 0; right: 0;
          height: 1px; opacity: 0;
          transition: opacity 0.3s;
        }
        .stat-card:hover .scan, .stat-card.active .scan { opacity: 1; animation: scanline 2s linear infinite; }

        .tab-pill {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px; border-radius: 6px;
          border: 1px solid transparent;
          font-size: 12px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
          font-family: 'Share Tech Mono', monospace;
          letter-spacing: 0.05em; white-space: nowrap;
          background: transparent; color: #333;
        }
        .tab-pill.active {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.08);
          color: #fff;
        }
        .tab-pill:hover:not(.active) { color: #555; background: rgba(8,0,0,0.9); }

        .new-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 20px;
          background: transparent;
          border: 1px solid rgba(255,48,48,0.4);
          border-radius: 6px;
          color: #ff3030; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.25s;
          font-family: 'Share Tech Mono', monospace;
          letter-spacing: 0.1em; text-transform: uppercase;
          position: relative; overflow: hidden;
        }
        .new-btn::before {
          content: '';
          position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,48,48,0.08), transparent);
          transition: left 0.4s;
        }
        .new-btn:hover {
          background: rgba(255,48,48,0.06);
          border-color: rgba(255,48,48,0.7);
          box-shadow: 0 0 20px rgba(255,48,48,0.15);
          color: #ff5555;
        }
        .new-btn:hover::before { left: 100%; }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #111; border-radius: 2px; }
      `}</style>

      {/* Canvas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.5 }} />

      {/* Vignette */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.75) 100%)'
      }} />

      {/* Navbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(3,3,3,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '0 32px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px', height: '30px',
            background: 'linear-gradient(135deg, #ff3030, #770000)',
            borderRadius: '6px', fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px rgba(255,48,48,0.3)'
          }}>🎙️</div>
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '16px', fontWeight: '400',
            color: '#fff', letterSpacing: '0.1em'
          }}>LECTURA</span>
        </div>

        {/* Status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 14px',
          background: 'rgba(0,255,204,0.04)',
          border: '1px solid rgba(0,255,204,0.1)',
          borderRadius: '4px',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '11px', color: 'rgba(0,255,204,0.6)',
          letterSpacing: '0.1em'
        }}>
          <div style={{
            width: '6px', height: '6px', background: '#00ffcc',
            borderRadius: '50%', animation: 'pulse-dot 2s ease-in-out infinite'
          }} />
          SYS ONLINE
        </div>

        {/* New button */}
      <div style={{ display: 'flex', gap: '8px' }}>
  <button className="new-btn" onClick={onLibrary}
    style={{ borderColor: 'rgba(168,85,247,0.4)', color: '#a855f7' }}>
    ◎ LIBRARY
  </button>
  <button className="new-btn" onClick={onSettings}
    style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#444' }}>
    ⚙ SETTINGS
  </button>
  <button className="new-btn" onClick={onNewRecording}>
    + NEW SESSION
  </button>
</div>  
      </div>

      {/* Main */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px', animation: 'fadeUp 0.5s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '3px', height: '28px', background: 'linear-gradient(180deg, #ff3030, #a855f7)', borderRadius: '2px' }} />
            <h1 style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '26px', fontWeight: '400',
              color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase'
            }}>DATA STREAMS</h1>
          </div>
          <p style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '11px', color: '#2a2a2a', letterSpacing: '0.1em'
          }}>
            // <span style={{ color: '#00ffcc' }}>{recordings.length}</span> ACTIVE RECORD{recordings.length !== 1 ? 'S' : ''} IN LOCAL VAULT
          </p>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px', marginBottom: '28px',
          animation: 'fadeUp 0.5s 0.1s ease both'
        }}>
          {stats.map(s => (
            <div key={s.id} className={`stat-card ${activeTab === s.id ? 'active' : ''}`}
              onClick={() => setActiveTab(s.id)}>
              <div className="scan" style={{ background: `linear-gradient(90deg, transparent, rgba(${s.rgb},0.4), transparent)` }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '20px', color: s.color, opacity: 0.8 }}>{s.icon}</span>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '22px', fontWeight: '400', color: s.color,
                  textShadow: `0 0 20px rgba(${s.rgb},0.5)`
                }}>{s.count}</span>
              </div>

              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '11px', color: '#888',
                letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px'
              }}>{s.label}</div>
              <div style={{ fontSize: '10px', color: '#2a2a2a', letterSpacing: '0.05em' }}>{s.desc}</div>
              
              {/* Bottom accent */}
              <div style={{
                position: 'absolute', bottom: 0, left: '10%', right: '10%', height: '1px',
                background: `linear-gradient(90deg, transparent, rgba(${s.rgb},${activeTab === s.id ? '0.4' : '0.15'}), transparent)`,
                transition: 'all 0.3s'
              }} />
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '4px', marginBottom: '20px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.04)',
          borderRadius: '8px', padding: '4px', width: 'fit-content',
          animation: 'fadeUp 0.5s 0.15s ease both'
        }}>
          {tabs.map(tab => (
            <button key={tab.id}
              className={`tab-pill ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ color: activeTab === tab.id ? tab.color : '#333' }}>
              <span>{tab.icon}</span>
              {tab.label}
              {tab.count !== null && (
                <span style={{
                  padding: '1px 7px', borderRadius: '3px', fontSize: '10px',
                  background: `rgba(${tab.rgb},${activeTab === tab.id ? '0.12' : '0.04'})`,
                  color: activeTab === tab.id ? tab.color : '#2a2a2a',
                  transition: 'all 0.2s'
                }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div style={{ animation: 'fadeUp 0.5s 0.2s ease both' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  height: '80px', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.04)',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 75%)',
                  backgroundSize: '200% auto', animation: 'shimmer 1.5s infinite'
                }} />
              ))}
            </div>
          ) : activeTab === 'comingsoon' ? (
            <div style={{
              textAlign: 'center', padding: '80px 20px',
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '10px'
            }}>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '40px', color: '#1a1a1a', marginBottom: '16px'
              }}>🔒</div>
              <h3 style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '14px', color: '#888',
                letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px'
              }}>ACCESS RESTRICTED</h3>
              <p style={{ fontSize: '11px', color: '#1a1a1a', letterSpacing: '0.05em' }}>
                More modes coming in future updates
              </p>
            </div>
          ) : getCurrentRecs().length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '80px 20px',
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '10px'
            }}>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '36px', color: '#111', marginBottom: '16px',
                opacity: 0.5
              }}>
                {activeTab === 'personal' ? '◎' : activeTab === 'student' ? '◈' : '▣'}
              </div>
              <h3 style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '13px', color: '#2a2a2a',
                letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px'
              }}>VAULT EMPTY</h3>
              <p style={{ fontSize: '11px', color: '#1a1a1a', marginBottom: '24px', letterSpacing: '0.05em' }}>
                No {activeTab} records found
              </p>
              <button className="new-btn" onClick={onNewRecording} style={{ margin: '0 auto' }}>
                + INITIALIZE
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {getCurrentRecs().map((r, idx) => {
                const accent = getAccent(r)
                return (
                  <div key={r.id} className="rec-card"
                    style={{
                      animation: `fadeUp 0.4s ${idx * 0.04}s ease both`,
                      '--accent-color': accent.color
                    }}
                    onClick={() => onViewNotes(r.notes?.[0]?.ai_draft, r.notes?.[0]?.merged_final, r)}>

                    {/* Left bar */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: '2px',
                      background: `linear-gradient(180deg, transparent, ${accent.color}, transparent)`
                    }} />

                    <div style={{ paddingLeft: '12px' }}>
                      {/* Top row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: '18px', color: accent.color,
                            textShadow: `0 0 12px rgba(${accent.rgb},0.5)`
                          }}>{getIcon(r)}</span>
                          <div style={{
                            fontSize: '13px', fontWeight: '500', color: '#ccc',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            maxWidth: '160px'
                          }}>
                            {r.topic || r.subject || 'Recording'}
                          </div>
                        </div>
                        <span style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: '10px', color: '#1a1a1a', letterSpacing: '0.05em'
                        }}>→</span>
                      </div>

                      {/* Bottom row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {r.subject && r.subject !== r.topic ? (
                          <span style={{
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: '10px', color: '#2a2a2a',
                            background: `rgba(${accent.rgb},0.06)`,
                            border: `1px solid rgba(${accent.rgb},0.1)`,
                            padding: '2px 8px', borderRadius: '3px',
                            letterSpacing: '0.05em'
                          }}>{r.subject}</span>
                        ) : <span />}
                        <span style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: '10px', color: '#1e1e1e', letterSpacing: '0.05em'
                        }}>
                          {formatDate(r.created_at)} {formatTime(r.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}