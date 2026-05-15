import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [isForgot, setIsForgot] = useState(false)
  const [typed, setTyped] = useState('')
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  const phrases = [
    'Record your lectures...',
    'AI transcribes instantly...',
    'Smart notes generated...',
    'Never miss a word again.',
  ]

  useEffect(() => {
    let phraseIndex = 0
    let charIndex = 0
    let deleting = false
    let timer
    const type = () => {
      const current = phrases[phraseIndex]
      if (!deleting) {
        setTyped(current.slice(0, charIndex + 1))
        charIndex++
        if (charIndex === current.length) {
          deleting = true
          timer = setTimeout(type, 1800)
          return
        }
      } else {
        setTyped(current.slice(0, charIndex - 1))
        charIndex--
        if (charIndex === 0) {
          deleting = false
          phraseIndex = (phraseIndex + 1) % phrases.length
        }
      }
      timer = setTimeout(type, deleting ? 35 : 65)
    }
    timer = setTimeout(type, 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
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
      r: Math.random() * 2 + 0.5,
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
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const handleAuth = async () => {
    setLoading(true)
    setMessage('')
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('Account created! You can now login.')
    }
    setLoading(false)
  }

  const handleForgot = async () => {
    if (!email) { setMessage('Please enter your email first'); return }
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })
    if (error) setMessage(error.message)
    else setMessage('Reset link sent! Check your email.')
    setLoading(false)
  }

  const cardContent = () => {
    if (isForgot) return (
      <>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'linear-gradient(135deg, rgba(255,48,48,0.15), rgba(255,48,48,0.05))',
            border: '1px solid rgba(255,48,48,0.2)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px', margin: '0 auto 16px',
            boxShadow: '0 0 30px rgba(255,48,48,0.1)'
          }}>🔑</div>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '22px', fontWeight: '800',
            color: '#fff', marginBottom: '8px', letterSpacing: '-0.02em'
          }}>Forgot password?</h2>
          <p style={{ color: '#2a2a2a', fontSize: '13px', lineHeight: 1.6 }}>
            Enter your email and we'll send<br />you a reset link right away.
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            fontSize: '10px', color: '#222', display: 'block',
            marginBottom: '8px', letterSpacing: '0.1em'
          }}>EMAIL ADDRESS</label>
          <input className="auth-inp" type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            onKeyDown={e => e.key === 'Enter' && handleForgot()} />
        </div>

        <button className="auth-btn" onClick={handleForgot} disabled={loading}>
          {loading ? 'Sending...' : '📨 Send Reset Link'}
        </button>

        {message && (
          <div style={{
            marginTop: '12px', padding: '10px 14px',
            background: message.includes('sent') ? 'rgba(0,200,80,0.06)' : 'rgba(255,40,40,0.06)',
            border: `1px solid ${message.includes('sent') ? 'rgba(0,200,80,0.15)' : 'rgba(255,40,40,0.1)'}`,
            borderRadius: '8px', fontSize: '12px', textAlign: 'center',
            color: message.includes('sent') ? '#4caf50' : '#ff6b6b',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}>
            {message.includes('sent') ? '✅' : '⚠️'} {message}
          </div>
        )}

        <button onClick={() => { setIsForgot(false); setMessage('') }}
          style={{
            width: '100%', marginTop: '12px', padding: '10px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px', color: '#2a2a2a',
            fontSize: '13px', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#555' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#2a2a2a' }}>
          ← Back to sign in
        </button>
      </>
    )

    return (
      <>
        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: '20px', fontWeight: '800',
          color: '#fff', marginBottom: '4px', letterSpacing: '-0.02em'
        }}>
          {isLogin ? 'Sign in' : 'Get started'}
        </h2>
        <p style={{ color: '#1e1e1e', fontSize: '12px', marginBottom: '22px' }}>
          {isLogin ? 'Welcome back to Lectura' : 'Create your free account'}
        </p>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '10px', color: '#1e1e1e', display: 'block', marginBottom: '7px', letterSpacing: '0.1em' }}>EMAIL</label>
          <input className="auth-inp" type="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
            <label style={{ fontSize: '10px', color: '#1e1e1e', letterSpacing: '0.1em' }}>PASSWORD</label>
            {isLogin && (
              <span onClick={() => { setIsForgot(true); setMessage('') }}
                style={{
                  fontSize: '11px', color: '#ff3030',
                  cursor: 'pointer', opacity: 0.7,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.target.style.opacity = '1'}
                onMouseLeave={e => e.target.style.opacity = '0.7'}>
                Forgot?
              </span>
            )}
          </div>
          <input className="auth-inp" type="password" value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleAuth()} />
        </div>

        <button className="auth-btn" onClick={handleAuth} disabled={loading}>
          {loading ? 'Loading...' : isLogin ? 'Sign in →' : 'Create account →'}
        </button>

        {message && (
          <div style={{
            marginTop: '10px', padding: '9px 12px',
            background: message.includes('created') ? 'rgba(0,200,80,0.06)' : 'rgba(255,40,40,0.06)',
            border: `1px solid ${message.includes('created') ? 'rgba(0,200,80,0.12)' : 'rgba(255,40,40,0.1)'}`,
            borderRadius: '7px', fontSize: '11px', textAlign: 'center',
            color: message.includes('created') ? '#4caf50' : '#ff6b6b'
          }}>{message}</div>
        )}

        <p style={{ marginTop: '18px', textAlign: 'center', fontSize: '12px', color: '#1a1a1a' }}>
          {isLogin ? "No account? " : "Have account? "}
          <span onClick={() => { setIsLogin(!isLogin); setMessage('') }}
            style={{ color: '#ff3030', cursor: 'pointer', fontWeight: '500' }}>
            {isLogin ? 'Sign up free' : 'Sign in'}
          </span>
        </p>
      </>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#030303',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      position: 'relative', overflow: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,40,40,0.5), 0 4px 20px rgba(255,40,40,0.4); }
          50% { box-shadow: 0 0 0 10px rgba(255,40,40,0), 0 4px 20px rgba(255,40,40,0.6); }
        }
        @keyframes cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .auth-card { animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .auth-inp {
          width: 100%; padding: 11px 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px; color: #fff;
          font-size: 13px; outline: none;
          transition: all 0.25s; box-sizing: border-box;
          font-family: 'Inter', sans-serif; color-scheme: dark;
        }
        .auth-inp:focus {
          border-color: rgba(255,50,50,0.5);
          background: rgba(255,30,30,0.04);
          box-shadow: 0 0 0 3px rgba(255,40,40,0.07);
        }
        .auth-inp::placeholder { color: #1a1a1a; }
        .auth-btn {
          width: 100%; padding: 11px;
          background: linear-gradient(135deg, #ff3030, #aa0000);
          border: none; border-radius: 8px;
          color: #fff; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: all 0.25s; letter-spacing: 0.02em;
          position: relative; overflow: hidden;
        }
        .auth-btn::before {
          content: '';
          position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: left 0.5s;
        }
        .auth-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(255,40,40,0.4); }
        .auth-btn:hover::before { left: 100%; }
        .auth-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
        .cursor {
          display: inline-block; width: 2px; height: 0.9em;
          background: #ff3030; margin-left: 2px;
          animation: cursor 1s step-end infinite; vertical-align: middle;
        }
        .mic-icon { animation: pulse 2s ease-in-out infinite, float 3s ease-in-out infinite; }
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        background: 'radial-gradient(ellipse at 30% 50%, rgba(5,0,0,0.45) 0%, rgba(0,0,0,0.78) 100%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: '1000px', padding: '20px',
        display: 'flex', alignItems: 'center', gap: '80px'
      }}>
        {/* LEFT */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div className="mic-icon" style={{
              width: '46px', height: '46px',
              background: 'linear-gradient(135deg, #ff3030, #770000)',
              borderRadius: '14px', fontSize: '22px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>🎙️</div>
            <div>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontSize: '24px',
                fontWeight: '800', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1
              }}>Lectura</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,80,80,0.5)', letterSpacing: '0.08em', marginTop: '3px' }}>
                AI NOTE TAKING
              </div>
            </div>
          </div>

          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: '800',
            color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15,
            marginBottom: '20px', minHeight: '120px'
          }}>
            {typed}<span className="cursor" />
          </div>

          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px', lineHeight: 1.7, fontWeight: '300', maxWidth: '380px' }}>
            Record lectures, meetings & thoughts.<br />AI does the rest — instantly.
          </p>

          <div style={{ display: 'flex', gap: '20px', marginTop: '32px' }}>
            {[{ icon: '⚡', label: 'Instant' }, { icon: '🎯', label: 'Accurate' }, { icon: '🔒', label: 'Private' }].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>{f.icon}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="auth-card" style={{ width: '360px', flexShrink: 0 }}>
          <div style={{
            background: 'rgba(6,0,0,0.92)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderTop: '1px solid rgba(255,50,50,0.25)',
            borderRadius: '14px', padding: '28px 26px',
            boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 60px rgba(255,30,30,0.05)'
          }}>
            {cardContent()}
          </div>
        </div>
      </div>
    </div>
  )
}