import { useState, useEffect, useRef } from 'react'
import { fetchSuggestions, fetchBranchSuggestions } from './groq'

const COURSE_TYPES = ['Engineering', 'Medical', 'Commerce', 'Arts', 'Law', 'School', 'Coaching']
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']
const MEETING_TYPES = ['Client Call', 'Team Meeting', 'One on One', 'Interview', 'Brainstorming', 'Project Review', 'Other']
const OUTPUT_FORMATS = ['Action Items focused', 'Summary focused', 'Decision Log focused', 'All Combined']
const CONSULTATION_TYPES = ['General Checkup', 'Follow-up', 'Emergency', 'Specialist Consultation']
const CONTENT_TYPES = ['Podcast Episode', 'YouTube Video', 'Blog Post', 'Social Media', 'Script Planning']

export default function Setup({ userType, onStart, onBack }) {
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

  const [form, setForm] = useState({
    course_type: '', course_name: '', subBranch: '',
    year: '', subject: '', topic: '',
    language_pref: 'English', notes_style: 'Bullet'
  })
  const [courseSuggestions, setCourseSuggestions] = useState([])
  const [branchSuggestions, setBranchSuggestions] = useState([])
  const [loadingCourse, setLoadingCourse] = useState(false)
  const [loadingBranch, setLoadingBranch] = useState(false)
  const courseTimer = useRef(null)
  const branchTimer = useRef(null)

  const [proForm, setProForm] = useState({
    meeting_type: '', topic: '', output_format: 'All Combined',
    language_pref: 'English',
    interview_subject: '',
    research_context: '',
    consultation_type: '',
    content_type: '',
    personal_mode: '',
    title: ''
  })

  const isSchool = form.course_type === 'School'
  const isCoaching = form.course_type === 'Coaching'
  const skipYear = isSchool || isCoaching

  const s = {
    label: {
      fontSize: '11px', color: '#444', marginBottom: '6px',
      display: 'block', letterSpacing: '0.08em',
      fontFamily: "'Share Tech Mono', monospace"
    },
    input: {
      display: 'block', width: '100%', marginBottom: '4px',
      padding: '10px', borderRadius: '6px',
      border: '1px solid rgba(255,255,255,0.08)',
      fontSize: '14px', boxSizing: 'border-box',
      background: 'rgba(255,255,255,0.04)', color: '#ccc',
      fontFamily: "'Share Tech Mono', monospace", outline: 'none'
    },
    select: {
      display: 'block', width: '100%', marginBottom: '14px',
      padding: '10px', borderRadius: '6px',
      border: '1px solid rgba(255,255,255,0.08)',
      fontSize: '14px', boxSizing: 'border-box',
      background: 'rgba(6,0,0,0.95)', color: '#ccc',
      fontFamily: "'Share Tech Mono', monospace", outline: 'none'
    },
    suggestion: {
      padding: '8px 12px', cursor: 'pointer',
      fontSize: '13px', color: '#ccc',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      background: 'transparent'
    },
    suggestionBox: {
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
      marginBottom: '14px', background: 'rgba(6,0,0,0.95)',
      maxHeight: '180px', overflowY: 'auto'
    },
    loading: { color: '#444', fontSize: '12px', marginBottom: '10px', fontFamily: "'Share Tech Mono', monospace" }
  }

  const handleCourseInput = (val) => {
    setForm(p => ({ ...p, course_name: val, subBranch: '', year: '', subject: '', topic: '' }))
    setCourseSuggestions([])
    clearTimeout(courseTimer.current)
    if (val.length < 2) return
    courseTimer.current = setTimeout(async () => {
      setLoadingCourse(true)
      const list = await fetchSuggestions(val, form.course_type)
      setCourseSuggestions(list)
      setLoadingCourse(false)
    }, 500)
  }

  const selectCourse = (val) => {
    setForm(p => ({ ...p, course_name: val, subBranch: '', year: '', subject: '', topic: '' }))
    setCourseSuggestions([])
  }

  const handleBranchInput = (val) => {
    setForm(p => ({ ...p, subBranch: val }))
    setBranchSuggestions([])
    clearTimeout(branchTimer.current)
    if (val.length < 2) return
    branchTimer.current = setTimeout(async () => {
      setLoadingBranch(true)
      const list = await fetchBranchSuggestions(val, form.course_name)
      setBranchSuggestions(list)
      setLoadingBranch(false)
    }, 500)
  }

  const selectBranch = (val) => {
    setForm(p => ({ ...p, subBranch: val }))
    setBranchSuggestions([])
  }

  const studentCanStart = form.course_type && form.course_name && form.subject && form.topic && (skipYear || form.year)

  const proCanStart = () => {
    switch (userType) {
      case 'professional': return proForm.meeting_type && proForm.topic
      case 'journalist': return proForm.interview_subject && proForm.topic
      case 'researcher': return proForm.topic
      case 'doctor': return proForm.consultation_type
      case 'creator': return proForm.content_type && proForm.topic
      case 'personal': return proForm.personal_mode && proForm.title
      default: return false
    }
  }

  const handleStart = () => {
    if (userType === 'student') {
      onStart({ ...form, userType })
    } else {
      onStart({ ...proForm, userType })
    }
  }

  const canStart = userType === 'student' ? studentCanStart : proCanStart()

  const renderNonStudent = () => {
    switch (userType) {
      case 'professional':
        return (
          <>
            <label style={s.label}>Meeting Type *</label>
            <select value={proForm.meeting_type}
              onChange={e => setProForm(p => ({ ...p, meeting_type: e.target.value }))}
              style={s.select}>
              <option value="">Select</option>
              {MEETING_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <label style={s.label}>Topic / Agenda *</label>
            <input value={proForm.topic}
              onChange={e => setProForm(p => ({ ...p, topic: e.target.value }))}
              placeholder='e.g. Q3 Sales Review'
              style={{ ...s.input, marginBottom: '14px' }} />
            <label style={s.label}>Output Format</label>
            <select value={proForm.output_format}
              onChange={e => setProForm(p => ({ ...p, output_format: e.target.value }))}
              style={s.select}>
              {OUTPUT_FORMATS.map(f => <option key={f}>{f}</option>)}
            </select>
          </>
        )

      case 'journalist':
        return (
          <>
            <label style={s.label}>Interview Subject *</label>
            <input value={proForm.interview_subject}
              onChange={e => setProForm(p => ({ ...p, interview_subject: e.target.value }))}
              placeholder='e.g. Dr. APJ Abdul Kalam'
              style={{ ...s.input, marginBottom: '14px' }} />
            <label style={s.label}>Topic / Story *</label>
            <input value={proForm.topic}
              onChange={e => setProForm(p => ({ ...p, topic: e.target.value }))}
              placeholder='e.g. Space exploration in India'
              style={{ ...s.input, marginBottom: '14px' }} />
          </>
        )

      case 'researcher':
        return (
          <>
            <label style={s.label}>Research Topic *</label>
            <input value={proForm.topic}
              onChange={e => setProForm(p => ({ ...p, topic: e.target.value }))}
              placeholder='e.g. Effects of air pollution on lungs'
              style={{ ...s.input, marginBottom: '14px' }} />
            <label style={s.label}>Context (optional)</label>
            <input value={proForm.research_context}
              onChange={e => setProForm(p => ({ ...p, research_context: e.target.value }))}
              placeholder='e.g. Field interview with locals'
              style={{ ...s.input, marginBottom: '14px' }} />
          </>
        )

      case 'doctor':
        return (
          <>
            <label style={s.label}>Consultation Type *</label>
            <select value={proForm.consultation_type}
              onChange={e => setProForm(p => ({ ...p, consultation_type: e.target.value }))}
              style={s.select}>
              <option value="">Select</option>
              {CONSULTATION_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </>
        )

      case 'creator':
        return (
          <>
            <label style={s.label}>Content Type *</label>
            <select value={proForm.content_type}
              onChange={e => setProForm(p => ({ ...p, content_type: e.target.value }))}
              style={s.select}>
              <option value="">Select</option>
              {CONTENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <label style={s.label}>Topic *</label>
            <input value={proForm.topic}
              onChange={e => setProForm(p => ({ ...p, topic: e.target.value }))}
              placeholder='e.g. Best productivity apps 2025'
              style={{ ...s.input, marginBottom: '14px' }} />
          </>
        )

      case 'personal':
        return (
          <>
            <label style={s.label}>Mode *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              {[
                { id: 'diary', icon: '📓', title: 'Diary', desc: 'Express freely' },
                { id: 'advice', icon: '🤝', title: 'Talk & Advice', desc: 'Get guidance' },
                { id: 'goals', icon: '🎯', title: 'Goal Setting', desc: 'Plan & achieve' },
                { id: 'braindump', icon: '🧠', title: 'Brain Dump', desc: 'Organize thoughts' },
              ].map(m => (
                <div key={m.id}
                  onClick={() => setProForm(p => ({ ...p, personal_mode: m.id }))}
                  style={{
                    padding: '16px 12px', borderRadius: '10px', cursor: 'pointer',
                    border: `1px solid ${proForm.personal_mode === m.id ? 'rgba(255,48,48,0.5)' : 'rgba(255,255,255,0.06)'}`,
                    background: proForm.personal_mode === m.id ? 'rgba(255,48,48,0.08)' : 'rgba(255,255,255,0.02)',
                    textAlign: 'center', transition: 'all 0.2s',
                    boxShadow: proForm.personal_mode === m.id ? '0 0 20px rgba(255,48,48,0.15)' : 'none'
                  }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>{m.icon}</div>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#ccc' }}>{m.title}</div>
                  <div style={{ color: '#444', fontSize: '11px' }}>{m.desc}</div>
                </div>
              ))}
            </div>
            {proForm.personal_mode && (
              <>
                <label style={s.label}>
                  {proForm.personal_mode === 'diary' ? "What's on your mind?" :
                   proForm.personal_mode === 'advice' ? 'What do you need help with?' :
                   proForm.personal_mode === 'goals' ? 'What goal are you working on?' :
                   'Title'}
                </label>
                <input value={proForm.title}
                  onChange={e => setProForm(p => ({ ...p, title: e.target.value }))}
                  placeholder={
                    proForm.personal_mode === 'diary' ? 'e.g. Today was tough...' :
                    proForm.personal_mode === 'advice' ? 'e.g. Career decision' :
                    proForm.personal_mode === 'goals' ? 'e.g. Get fit in 3 months' :
                    'e.g. App ideas'
                  }
                  style={{ ...s.input, marginBottom: '14px' }} />
              </>
            )}
          </>
        )

      default: return null
    }
  }

  const userTitles = {
    student: 'Student Setup',
    professional: 'Meeting Setup',
    journalist: 'Interview Setup',
    researcher: 'Research Setup',
    doctor: 'Consultation Setup',
    creator: 'Content Setup',
    personal: 'Personal Recording'
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#030303',
      fontFamily: "'Inter', sans-serif",
      position: 'relative', overflow: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Syne:wght@700;800&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        option { background: #0a0000; color: #ccc; }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={onBack} style={{
            padding: '7px 14px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '6px', color: '#888',
            fontSize: '11px', cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: '0.08em'
          }}>← BACK</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '3px', height: '18px', background: 'linear-gradient(180deg, #ff3030, #a855f7)', borderRadius: '2px' }} />
            <span style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '13px', color: '#555', letterSpacing: '0.15em'
            }}>{userTitles[userType]?.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '500px', margin: '0 auto', padding: '80px 24px 40px' }}>

        {userType === 'student' ? (
          <>
            <label style={s.label}>Course Type *</label>
            <select value={form.course_type}
              onChange={e => setForm({ course_type: e.target.value, course_name: '', subBranch: '', year: '', subject: '', topic: '', language_pref: 'English', notes_style: 'Bullet' })}
              style={s.select}>
              <option value="">Select</option>
              {COURSE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>

            {form.course_type && (
              <>
                <label style={s.label}>{isSchool ? 'Class *' : isCoaching ? 'Coaching For *' : 'Course Name *'}</label>
                <input value={form.course_name}
                  onChange={e => handleCourseInput(e.target.value)}
                  placeholder={isSchool ? 'e.g. Class 10' : isCoaching ? 'e.g. JEE Main' : 'e.g. B.Tech'}
                  style={s.input} />
                {loadingCourse && <p style={s.loading}>Finding suggestions...</p>}
                {courseSuggestions.length > 0 && (
                  <div style={s.suggestionBox}>
                    {courseSuggestions.map(c => (
                      <div key={c} style={s.suggestion}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        onClick={() => selectCourse(c)}>{c}</div>
                    ))}
                  </div>
                )}
                {!loadingCourse && courseSuggestions.length === 0 && form.course_name && <div style={{ marginBottom: '14px' }} />}
              </>
            )}

            {form.course_name && !isSchool && !isCoaching && (
              <>
                <label style={s.label}>Branch / Specialization (if any)</label>
                <input value={form.subBranch}
                  onChange={e => handleBranchInput(e.target.value)}
                  placeholder='e.g. CSE (leave blank if none)'
                  style={s.input} />
                {loadingBranch && <p style={s.loading}>Finding suggestions...</p>}
                {branchSuggestions.length > 0 && (
                  <div style={s.suggestionBox}>
                    {branchSuggestions.map(b => (
                      <div key={b} style={s.suggestion}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        onClick={() => selectBranch(b)}>{b}</div>
                    ))}
                  </div>
                )}
                {!loadingBranch && branchSuggestions.length === 0 && form.subBranch && <div style={{ marginBottom: '14px' }} />}
              </>
            )}

            {form.course_name && !skipYear && (
              <>
                <label style={s.label}>Year *</label>
                <select value={form.year}
                  onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
                  style={s.select}>
                  <option value="">Select year</option>
                  {YEARS.map(y => <option key={y}>{y}</option>)}
                </select>
              </>
            )}

            {(form.year || skipYear) && form.course_name && (
              <>
                <label style={s.label}>Subject *</label>
                <input value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value, topic: '' }))}
                  placeholder='e.g. Computer Organization & Architecture'
                  style={{ ...s.input, marginBottom: '14px' }} />
              </>
            )}

            {form.subject && (
              <>
                <label style={s.label}>Topic *</label>
                <input value={form.topic}
                  onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
                  placeholder='e.g. Pipelining'
                  style={{ ...s.input, marginBottom: '14px' }} />
              </>
            )}

            {form.topic && (
              <>
                <label style={s.label}>Language</label>
                <select value={form.language_pref}
                  onChange={e => setForm(p => ({ ...p, language_pref: e.target.value }))}
                  style={s.select}>
                  <option value="English">English</option>
                  <option value="Hinglish">Hinglish</option>
                  <option value="Hindi">Hindi</option>
                </select>
                <label style={s.label}>Notes Style</label>
                <select value={form.notes_style}
                  onChange={e => setForm(p => ({ ...p, notes_style: e.target.value }))}
                  style={s.select}>
                  <option value="Bullet">Bullet Points</option>
                  <option value="Paragraph">Paragraph</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </>
            )}
          </>
        ) : (
          <>
            {renderNonStudent()}
            <label style={s.label}>Language</label>
            <select value={proForm.language_pref}
              onChange={e => setProForm(p => ({ ...p, language_pref: e.target.value }))}
              style={s.select}>
              <option value="English">English</option>
              <option value="Hinglish">Hinglish</option>
              <option value="Hindi">Hindi</option>
            </select>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
  <button onClick={handleStart} disabled={!canStart}
    style={{
      position: 'relative',
      padding: '16px 48px',
      background: canStart ? 'transparent' : 'transparent',
      color: canStart ? '#ff3030' : '#333',
      border: canStart ? '1px solid rgba(255,48,48,0.5)' : '1px solid rgba(255,255,255,0.06)',
      borderRadius: '4px', fontSize: '13px',
      cursor: canStart ? 'pointer' : 'not-allowed',
      letterSpacing: '0.2em',
      fontFamily: "'Share Tech Mono', monospace",
      boxShadow: canStart ? '0 0 20px rgba(255,48,48,0.2), inset 0 0 20px rgba(255,48,48,0.05)' : 'none',
      transition: 'all 0.3s',
      textTransform: 'uppercase',
      overflow: 'hidden'
    }}
    onMouseEnter={e => {
      if (!canStart) return
      e.currentTarget.style.background = 'rgba(255,48,48,0.1)'
      e.currentTarget.style.boxShadow = '0 0 40px rgba(255,48,48,0.4), inset 0 0 30px rgba(255,48,48,0.1)'
      e.currentTarget.style.color = '#fff'
    }}
    onMouseLeave={e => {
      if (!canStart) return
      e.currentTarget.style.background = 'transparent'
      e.currentTarget.style.boxShadow = '0 0 20px rgba(255,48,48,0.2), inset 0 0 20px rgba(255,48,48,0.05)'
      e.currentTarget.style.color = '#ff3030'
    }}>
    {/* Corner decorations */}
    {canStart && <>
      <span style={{ position: 'absolute', top: '-1px', left: '-1px', width: '8px', height: '8px', borderTop: '2px solid #ff3030', borderLeft: '2px solid #ff3030' }} />
      <span style={{ position: 'absolute', top: '-1px', right: '-1px', width: '8px', height: '8px', borderTop: '2px solid #ff3030', borderRight: '2px solid #ff3030' }} />
      <span style={{ position: 'absolute', bottom: '-1px', left: '-1px', width: '8px', height: '8px', borderBottom: '2px solid #ff3030', borderLeft: '2px solid #ff3030' }} />
      <span style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '8px', height: '8px', borderBottom: '2px solid #ff3030', borderRight: '2px solid #ff3030' }} />
    </>}
    ⬤ START RECORDING
  </button>

  {!canStart && (
    <p style={{
      color: '#222', fontSize: '11px',
      marginTop: '12px', fontFamily: "'Share Tech Mono', monospace",
      letterSpacing: '0.1em'
    }}>
      // COMPLETE ALL REQUIRED FIELDS
    </p>
  )}
</div>

        {!canStart && (
          <p style={{
            color: '#333', fontSize: '11px', textAlign: 'center',
            marginTop: '8px', fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: '0.05em'
          }}>
            Complete all required fields
          </p>
        )}
      </div>
    </div>
  )
}