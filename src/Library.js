import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

export default function Library({ onBack, onViewNotes, onDelete }) {
  const [recordings, setRecordings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => { fetchAll() }, [])

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

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('recordings')
      .select('*, notes(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setRecordings(data || [])
    setLoading(false)
  }
  const handleDelete = async (id, e) => {
  e.stopPropagation()
  if (!window.confirm('Delete this recording?')) return
  await supabase.from('notes').delete().eq('recording_id', id)
  await supabase.from('recordings').delete().eq('id', id)
  setRecordings(prev => prev.filter(r => r.id !== id))
}
  const filters = [
    { id: 'all', label: 'ALL', color: '#fff' },
    { id: 'personal', label: 'PERSONAL', color: '#a855f7' },
    { id: 'student', label: 'ACADEMIC', color: '#ff3030' },
    { id: 'professional', label: 'CORPORATE', color: '#00ffcc' },
  ]

  const getAccent = (r) => {
    if (r.course_type === 'personal') return { color: '#a855f7', rgb: '168,85,247' }
    if (r.course_type === 'professional') return { color: '#00ffcc', rgb: '0,255,204' }
    return { color: '#ff3030', rgb: '255,48,48' }
  }

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

  const filtered = recordings.filter(r => {
    const matchFilter = filter === 'all' ||
      (filter === 'personal' && r.course_type === 'personal') ||
      (filter === 'student' && ['Engineering', 'Medical', 'Commerce', 'Arts', 'Law', 'School', 'Coaching'].includes(r.course_type)) ||
      (filter === 'professional' && ['professional', 'journalist', 'researcher', 'doctor', 'creator'].includes(r.course_type))
    const matchSearch = !search ||
      r.topic?.toLowerCase().includes(search.toLowerCase()) ||
      r.subject?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()

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
        .lib-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px; padding: 18px;
          cursor: pointer; transition: all 0.25s;
          position: relative; overflow: hidden;
          animation: fadeUp 0.4s ease both;
        }
        .lib-card:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.1);
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
        }
        .filter-btn {
          padding: 6px 14px;
          border-radius: 4px; border: 1px solid rgba(255,255,255,0.06);
          font-size: 11px; cursor: pointer; transition: all 0.2s;
          font-family: 'Share Tech Mono', monospace;
          letter-spacing: 0.1em; background: transparent; color: #333;
        }
        .filter-btn.active { background: rgba(255,255,255,0.06); }
        .search-inp {
          padding: 10px 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 6px; color: #ccc;
          font-size: 13px; outline: none; width: 100%;
          font-family: 'Share Tech Mono', monospace;
          letter-spacing: 0.05em; box-sizing: border-box;
          transition: border 0.2s;
        }
        .search-inp:focus { border-color: rgba(255,48,48,0.3); }
        .search-inp::placeholder { color: #1e1e1e; }
        .back-btn {
          padding: 7px 14px; background: transparent;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 6px; color: #333;
          font-size: 11px; cursor: pointer; transition: all 0.2s;
          font-family: 'Share Tech Mono', monospace; letter-spacing: 0.08em;
        }
        .back-btn:hover { border-color: rgba(255,255,255,0.12); color: #666; }
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
            }}>LIBRARY</span>
          </div>
        </div>
        <span style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '11px', color: '#1e1e1e', letterSpacing: '0.1em'
        }}>
          // <span style={{ color: '#ff3030' }}>{filtered.length}</span> RECORDS
        </span>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Search */}
        <div style={{ marginBottom: '20px', animation: 'fadeUp 0.5s ease both' }}>
          <input className="search-inp" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="// SEARCH RECORDS..." />
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap',
          animation: 'fadeUp 0.5s 0.1s ease both'
        }}>
          {filters.map(f => (
            <button key={f.id} className={`filter-btn ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
              style={{ color: filter === f.id ? f.color : '#333', borderColor: filter === f.id ? `rgba(${f.color === '#fff' ? '255,255,255' : f.color === '#a855f7' ? '168,85,247' : f.color === '#ff3030' ? '255,48,48' : '0,255,204'},0.2)` : 'rgba(255,255,255,0.06)' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                height: '90px', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.04)',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 75%)',
                backgroundSize: '200% auto', animation: 'shimmer 1.5s infinite'
              }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: '10px'
          }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '32px', color: '#111', marginBottom: '16px' }}>◎</div>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: '#222', letterSpacing: '0.15em' }}>
              NO RECORDS FOUND
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {filtered.map((r, idx) => {
              const accent = getAccent(r)
              return (
                <div key={r.id} className="lib-card"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                  onClick={() => onViewNotes(r.notes?.[0]?.ai_draft, r.notes?.[0]?.merged_final, r)}>

                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px',
                    background: `linear-gradient(180deg, transparent, ${accent.color}, transparent)`
                  }} />

                  <div style={{ paddingLeft: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: '18px', color: accent.color,
                          textShadow: `0 0 12px rgba(${accent.rgb},0.5)`
                        }}>{getIcon(r)}</span>
                        <div style={{
                          fontSize: '13px', fontWeight: '500', color: '#ccc',
                          whiteSpace: 'nowrap', overflow: 'hidden',
                          textOverflow: 'ellipsis', maxWidth: '180px'
                        }}>
                          {r.topic || r.subject || 'Recording'}
                        </div>
                      </div>
                      <span style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '9px', color: '#1a1a1a', letterSpacing: '0.05em'
                      }}>{formatDate(r.created_at)}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '10px', color: accent.color, opacity: 0.5,
                        background: `rgba(${accent.rgb},0.06)`,
                        border: `1px solid rgba(${accent.rgb},0.1)`,
                        padding: '2px 8px', borderRadius: '3px', letterSpacing: '0.05em'
                      }}>{r.course_type?.toUpperCase()}</span>
                      {r.subject && r.subject !== r.topic && (
                        <span style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: '10px', color: '#2a2a2a',
                          padding: '2px 8px', letterSpacing: '0.05em'
                        }}>{r.subject}</span>
                      )}
                    <button
  onClick={(e) => handleDelete(r.id, e)}
  style={{
    padding: '4px 10px',
    background: 'transparent',
    border: '1px solid rgba(255,48,48,0.15)',
    borderRadius: '4px',
    color: 'rgba(255,48,48,0.4)',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '10px', cursor: 'pointer',
    letterSpacing: '0.05em', transition: 'all 0.2s',
    flexShrink: 0
  }}
  onMouseEnter={e => {
    e.currentTarget.style.borderColor = 'rgba(255,48,48,0.5)'
    e.currentTarget.style.color = '#ff3030'
    e.currentTarget.style.background = 'rgba(255,48,48,0.06)'
  }}
  onMouseLeave={e => {
    e.currentTarget.style.borderColor = 'rgba(255,48,48,0.15)'
    e.currentTarget.style.color = 'rgba(255,48,48,0.4)'
    e.currentTarget.style.background = 'transparent'
  }}>
  DEL
</button></div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}