import { useState, useEffect, useRef } from 'react'

export default function Home({ onSelect, onBack }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

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

  const activeUsers = [
    { id: 'personal', icon: '◎', title: 'Personal', desc: 'Diary · Goals · Brain Dump · Advice' },
    { id: 'student', icon: '◈', title: 'Academic', desc: 'Lectures · Notes · Exam Prep' },
    { id: 'professional', icon: '▣', title: 'Corporate', desc: 'Meetings · Tasks · Action Items' },
  ]

  const colors = {
    personal: { color: '#a855f7', rgb: '168,85,247' },
    student: { color: '#ff3030', rgb: '255,48,48' },
    professional: { color: '#00ffcc', rgb: '0,255,204' },
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#030303',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      position: 'relative', overflow: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Syne:wght@700;800&family=Share+Tech+Mono&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .user-card {
          display: flex; align-items: center; gap: '16px';
          padding: 18px 22px;
          background: rgba(6,0,0,0.92);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px; cursor: pointer;
          transition: all 0.25s; margin-bottom: 10px;
          position: relative; overflow: hidden;
          animation: fadeUp 0.5s ease both;
        }
        .user-card:hover {
          background: rgba(12,0,0,0.95);
          transform: translateX(4px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
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
        background: 'radial-gradient(ellipse at center, rgba(3,3,3,0.6) 0%, rgba(0,0,0,0.88) 100%)'
      }} />

      {/* Navbar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(3,3,3,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '0 28px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px',
            background: 'linear-gradient(135deg, #ff3030, #770000)',
            borderRadius: '7px', fontSize: '13px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 10px rgba(255,48,48,0.3)'
          }}>🎙️</div>
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '15px', color: '#fff', letterSpacing: '0.1em'
          }}>LECTURA</span>
        </div>
        <button className="back-btn" onClick={onBack}>← DASHBOARD</button>
      </div>

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: '480px',
        padding: '80px 24px 40px'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '36px', animation: 'fadeUp 0.5s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '3px', height: '24px', background: 'linear-gradient(180deg, #ff3030, #a855f7)', borderRadius: '2px' }} />
            <h2 style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '18px', color: '#fff',
              letterSpacing: '0.15em', textTransform: 'uppercase'
            }}>SELECT MODE</h2>
          </div>
          <p style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '11px', color: '#222',
            letterSpacing: '0.1em', paddingLeft: '13px'
          }}>// CHOOSE YOUR SESSION TYPE</p>
        </div>

        {/* Cards */}
        {activeUsers.map((u, idx) => {
          const accent = colors[u.id] || { color: '#fff', rgb: '255,255,255' }
          return (
            <div key={u.id} className="user-card"
              style={{ animationDelay: `${idx * 0.08}s` }}
              onClick={() => onSelect(u.id)}>

              {/* Left accent bar */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px',
                background: `linear-gradient(180deg, transparent, ${accent.color}, transparent)`
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingLeft: '12px', width: '100%' }}>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '24px', color: accent.color,
                  textShadow: `0 0 16px rgba(${accent.rgb},0.6)`,
                  width: '32px', flexShrink: 0
                }}>{u.icon}</span>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '13px', color: '#ccc',
                    letterSpacing: '0.08em', marginBottom: '4px'
                  }}>{u.title.toUpperCase()}</div>
                  <div style={{ fontSize: '11px', color: '#222' }}>{u.desc}</div>
                </div>

                <div style={{
                  width: '24px', height: '24px',
                  border: `1px solid rgba(${accent.rgb},0.2)`,
                  borderRadius: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: accent.color, fontSize: '12px',
                  background: `rgba(${accent.rgb},0.06)`
                }}>→</div>
              </div>
            </div>
          )
        })}

        {/* Coming soon */}
        <div style={{
          padding: '14px 22px',
          background: 'rgba(255,255,255,0.01)',
          border: '1px dashed rgba(255,255,255,0.04)',
          borderRadius: '12px', marginTop: '4px',
          display: 'flex', alignItems: 'center', gap: '12px',
          paddingLeft: '24px'
        }}>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: '#302e2e', letterSpacing: '0.1em' }}>
            🔒 MORE MODES COMING SOON...
          </span>
        </div>
      </div>
    </div>
  )
}