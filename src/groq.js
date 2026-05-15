const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY

async function groqChat(content, max_tokens = 400) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content }],
      max_tokens
    })
  })
  const data = await response.json()
  return data.choices[0].message.content.trim()
}

function parseJSON(text) {
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return []
  }
}

export async function transcribeAudio(audioBlob) {
  const formData = new FormData()
  formData.append('file', new File([audioBlob], 'recording.mp4', { type: 'audio/mp4' }))
  formData.append('model', 'whisper-large-v3-turbo')
  formData.append('language', 'en')

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
    body: formData
  })

  const data = await response.json()
  return data.text
}

export async function fetchSuggestions(query, courseType) {
  if (query.length < 2) return []
  const text = await groqChat(
    `List courses/degrees related to "${query}" in "${courseType}" education in India.
Return ONLY a JSON array of strings. Maximum 6 options. No explanation.`, 200)
  return parseJSON(text)
}

export async function fetchBranchSuggestions(query, courseName) {
  if (query.length < 2) return []
  const text = await groqChat(
    `List branches or specializations related to "${query}" in "${courseName}" in India.
Return ONLY a JSON array of strings. Maximum 6 options. No explanation.`, 200)
  return parseJSON(text)
}

export async function fetchTopicContext(topic, subject, courseName, year, subBranch, classLevel, stream) {
  const isSchool = !!classLevel
  const text = await groqChat(
    `You are an expert ${isSchool ? 'NCERT' : 'university'} teacher for "${subject}".
Student level: ${classLevel || year} ${courseName}${subBranch ? ' ' + subBranch : ''}${stream ? ' ' + stream : ''}
Topic: "${topic}"

Provide a concise knowledge summary including:
1. What this topic is about (2-3 lines)
2. Key terms and their correct meaning
3. Important formulas or theorems if any
4. Common mistakes students make
5. Exam important points

Keep it concise — only used to understand lecture context.`, 800)
  return text
}

export async function extractTodos(transcript) {
  const text = await groqChat(
    `Extract all action items, tasks, todos, deadlines, and reminders from this transcript.
For each item, if a time/date/deadline is mentioned, include it.

Return ONLY a JSON array like this:
[
  { "text": "Send report to client", "due": "Friday" },
  { "text": "Submit assignment", "due": "tomorrow" },
  { "text": "Buy groceries", "due": null }
]

If nothing found, return [].
No explanation.

Transcript:
${transcript}`, 500)
  return parseJSON(text)
}

export async function generateNotes(transcript, setup, topicContext) {
  let prompt = ''

  if (setup.userType === 'personal') {
    switch (setup.personal_mode) {

      case 'diary':
        prompt = `You are a warm, empathetic companion — like a trusted friend who truly listens.
Someone just recorded their thoughts. Read what they said and respond with genuine empathy.

Title: ${setup.title}
Language: ${setup.language_pref}

RULES:
- Be human, warm, non-judgmental
- Acknowledge their feelings first
- Do NOT give unsolicited advice
- Just make them feel heard and understood
- If they seem distressed, gently ask if they want to talk more
- Keep response conversational, not clinical

--- WHAT THEY SAID ---
${transcript}
--- END ---

${setup.language_pref === 'Hinglish' ? 'Respond in Hinglish.' : ''}
${setup.language_pref === 'Hindi' ? 'Respond in Hindi.' : ''}`
        break

      case 'advice':
        prompt = `You are a wise, warm friend who gives genuine practical advice — not robotic suggestions.
Someone recorded something they need help with. Listen carefully and respond like a trusted friend would.

Topic: ${setup.title}
Language: ${setup.language_pref}

RULES:
- Be warm and human first, advisor second
- Acknowledge what they said
- Give practical, honest advice
- Ask a follow-up question if needed
- Be direct but kind
- No bullet point lists — talk like a real person

--- WHAT THEY SAID ---
${transcript}
--- END ---

${setup.language_pref === 'Hinglish' ? 'Respond in Hinglish like a desi friend would.' : ''}
${setup.language_pref === 'Hindi' ? 'Respond in Hindi.' : ''}`
        break

      case 'goals':
        prompt = `You are a motivating life coach. Someone just recorded their goal or vision.
Help them turn it into a clear, actionable plan.

Goal: ${setup.title}
Language: ${setup.language_pref}

Output:
🎯 Goal (clearly stated)
...

📋 Step-by-step Plan
1. ...
2. ...

⏰ Timeline suggestion
...

⏰ Reminders suggested (if any deadlines mentioned)
...

💪 Motivational note
...

RULES:
- Be encouraging and realistic
- Break big goals into small steps
- Only use what they actually said
- If any deadlines mentioned, highlight as reminders

--- WHAT THEY SAID ---
${transcript}
--- END ---

${setup.language_pref === 'Hinglish' ? 'Write in Hinglish.' : ''}
${setup.language_pref === 'Hindi' ? 'Write in Hindi.' : ''}`
        break

      case 'braindump':
        prompt = `You are an expert at organizing chaotic thoughts into clarity.
Someone just did a brain dump — random thoughts, ideas, whatever came to mind.
Organize it beautifully.

Title: ${setup.title}
Language: ${setup.language_pref}

Output:
💡 Key Ideas
- ...

✅ Action Items
- ...

🔗 Connections / Patterns noticed
- ...

❓ Open Questions
- ...

RULES:
- Only use what was actually said
- Find patterns and connections
- Separate facts from opinions
- Keep it clean and scannable

--- WHAT THEY SAID ---
${transcript}
--- END ---

${setup.language_pref === 'Hinglish' ? 'Write in Hinglish.' : ''}
${setup.language_pref === 'Hindi' ? 'Write in Hindi.' : ''}`
        break

      default:
        prompt = `Organize these personal thoughts into clean notes.
--- TRANSCRIPT ---
${transcript}
--- END ---`
    }

  } else if (setup.userType === 'professional') {
    prompt = `You are an expert meeting assistant.
Meeting Type: ${setup.meeting_type}
Topic: ${setup.topic}
Output Format: ${setup.output_format}
Language: ${setup.language_pref}

Extract and organize from this meeting recording:

📋 Summary
...

✅ Action Items (with owner if mentioned)
- ...

🎯 Decisions Made
- ...

⏰ Deadlines & Reminders (if any mentioned)
- ...

❓ Open Questions
- ...

RULES:
- Only use what was actually said
- Be concise and professional
- Mark urgent items with 🔴

--- TRANSCRIPT ---
${transcript}
--- END ---

${setup.language_pref === 'Hinglish' ? 'Write in Hinglish.' : ''}
${setup.language_pref === 'Hindi' ? 'Write in Hindi.' : ''}`

  } else {
    prompt = `You are a note-taking assistant. Convert what the professor said into clean, simple, short notes.

STRICT RULES:
- Use ONLY what is in the transcript
- Do NOT add extra information from your own knowledge
- Do NOT teach the topic yourself
- Keep notes short, simple, and to the point
- Use topic context ONLY to understand terminology correctly

Pre-information (context only):
- Course: ${setup.course_name} (${setup.course_type})
- Level: ${setup.year || setup.classLevel || ''}
- Subject: ${setup.subject}
- Topic: ${setup.topic}

Topic Context (for terminology only):
${topicContext}

--- TRANSCRIPT START ---
${transcript}
--- TRANSCRIPT END ---

Format: ${setup.notes_style}
Language: ${setup.language_pref}
${setup.language_pref === 'Hinglish' ? 'Write in Hinglish.' : ''}
${setup.language_pref === 'Hindi' ? 'Write in Hindi.' : ''}

Also at the end, if professor mentioned any:
⏰ Reminders / Deadlines
- (exam dates, submission deadlines, next class topics)

Mark with ⭐ ONLY if professor specifically said something is important.
If transcript is short — generate short notes. Do not pad.`
  }

  const text = await groqChat(prompt, 2000)
  return text
}