import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import Home from './Home'
import Setup from './Setup'
import Record from './Record'
import Dashboard from './Dashboard'
import Notes from './Notes'
import Library from './Library'
import Settings from './Settings'

function App() {
  const [session, setSession] = useState(null)
  const [screen, setScreen] = useState('dashboard')
  const [userType, setUserType] = useState(null)
  const [setupData, setSetupData] = useState(null)
  const [notes, setNotes] = useState(null)
  const [transcript, setTranscript] = useState(null)
  const [todos, setTodos] = useState([])
  const [viewedRecording, setViewedRecording] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    supabase.auth.onAuthStateChange((_event, session) => setSession(session))
  }, [])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const handleUserSelect = (type) => { setUserType(type); setScreen('setup') }

  const handleStart = (formData) => {
    setSetupData({ ...formData, userType })
    setScreen('record')
  }

  const handleDone = (generatedNotes, rawTranscript, extractedTodos) => {
    setNotes(generatedNotes)
    setTranscript(rawTranscript)
    setTodos(extractedTodos || [])
    setViewedRecording(null)
    setScreen('notes')
  }

  const handleViewNotes = (aiDraft, mergedFinal, recording) => {
    setNotes(mergedFinal || aiDraft)
    setTranscript(null)
    setTodos([])
    setViewedRecording(recording)
    setScreen('notes')
  }

  return (
    <div>
      {!session ? (
        <Auth />
      ) : screen === 'dashboard' ? (
        <Dashboard
          onNewRecording={() => setScreen('home')}
          onViewNotes={handleViewNotes}
          onLibrary={() => setScreen('library')}
          onSettings={() => setScreen('settings')}
        />
      ) : screen === 'home' ? (
        <Home onSelect={handleUserSelect} onBack={() => setScreen('dashboard')} />
      ) : screen === 'setup' ? (
        <Setup userType={userType} onStart={handleStart} onBack={() => setScreen('home')} />
      ) : screen === 'record' ? (
        <Record setup={setupData} onDone={handleDone} onBack={() => setScreen('setup')} />
        ) : screen === 'library' ? (
        <Library
          onBack={() => setScreen('dashboard')}
          onViewNotes={handleViewNotes}
        />
      ) : screen === 'settings' ? (
        <Settings onBack={() => setScreen('dashboard')} />
      ) : screen === 'notes' ? (
        <Notes
          notes={notes}
          transcript={transcript}
          todos={todos}
          setup={setupData}
          recording={viewedRecording}
          onBack={() => setScreen('dashboard')}
        />
      ) : null}
    </div>
  )
}

export default App