\# Voice ER Navigator



> When the situation changes, the voice assistant changes with it.



Voice ER Navigator is a voice-first emergency navigation prototype designed to maintain explicit conversation state and recover when critical information changes during a spoken interaction.



\## 🚨 Problem



During an emergency, a user's situation can change while a voice assistant is already speaking.



For example:



\- The assistant is asking about breathing difficulty.

\- The user suddenly reports that the person has become unconscious.

\- Continuing the old response can become irrelevant.

\- The assistant needs to stop the current response, process the new information, update its state, and respond to the new situation.



Voice ER Navigator focuses on this interruption and recovery problem.



\## 💡 Solution



Voice ER Navigator uses an explicit emergency-state controller.



The system:



1\. Receives spoken input.

2\. Detects relevant emergency intents.

3\. Evaluates the priority of new information.

4\. Updates the emergency state.

5\. Generates a predefined safety-focused response.

6\. Sends the response to Rime for speech generation.

7\. Plays the generated voice response.

8\. Cancels stale speech when the user interrupts with new information.



\## 🎤 Why Voice?



Voice is the primary interaction method.



During an emergency, users may need to keep their attention on the person rather than continuously interacting with a screen or keyboard.



The prototype therefore uses:



\- Browser speech recognition for voice input.

\- Rime TTS for primary voice output.

\- Explicit state management for emergency conversation flow.

\- Interruption handling for changing conditions.



\## ⚡ Key Feature: Interruption + Recovery



The main voice-engineering challenge is handling a critical interruption while the assistant is speaking.



Example:



```text

User:

"My father is having difficulty breathing."



Assistant:

"Stay with him. Is he conscious and responding?"



User:

"He is conscious."



Assistant:

"Tell me whether his breathing is getting worse or staying about the same."



User interrupts:

"Wait! He's unconscious now!"



System:

Current speech is stopped

&#x20;       ↓

New speech is processed

&#x20;       ↓

State → CRITICAL\_UNCONSCIOUS

&#x20;       ↓

Previous response is discarded

&#x20;       ↓

New Rime response is generated
🧠 Architecture
Browser Speech Recognition
            ↓
       Intent Detection
            ↓
 Priority + State Controller
            ↓
      Emergency State
            ↓
    Safe Predefined Response
            ↓
          Rime TTS
            ↓
      Audio Playback
            ↑
     User Interrupts
            ↓
   Invalidate Old Request
            ↓
       New Speech Input
🛡️ Safety

Voice ER Navigator is a prototype for emergency navigation.

It does not:

Diagnose medical conditions.
Replace emergency professionals.
Provide a medical diagnosis based on symptoms.
Replace local emergency services.

The system uses predefined safety-focused responses and directs users toward local emergency services and trained professionals when critical information is detected.

🧩 Emergency States

The prototype includes explicit states for situations such as:

Breathing difficulty
Critical unconsciousness
Chest pain
Stroke warning signs
Severe bleeding
Seizure
Severe allergic reaction
Fainting
Severe burn
Vomiting
Severe abdominal pain

Critical information is given higher priority than normal conversational information.

🛠️ Technology Stack
Frontend
React
Vite
Browser Speech Recognition
JavaScript
Backend
Node.js
Express
REST API
Voice
Rime TTS
📁 Project Structure
voice-er-navigator/
│
├── emergency/
│   └── emergencyEngine.js
│
├── services/
│   └── rimeService.js
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── server.js
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── RIME_EVIDENCE.md
⚙️ Setup
1. Clone the repository

Those are just formatting artifacts.

### Copy this clean version:

```markdown
## ⚙️ Setup

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd voice-er-navigator
2. Install backend dependencies
npm install
3. Configure the Rime API key

Create a .env file in the project root:

RIME_API_KEY=your_rime_api_key_here

Do not commit the .env file.

4. Install frontend dependencies
cd frontend
npm install
5. Start the backend

From the project root:

node server.js

The backend runs on:

http://localhost:3000
6. Start the frontend

Open another terminal:

cd frontend
npm run dev

Then open the local Vite URL shown in the terminal.

🧪 Core Acceptance Test
Interruption and Recovery Test
Start the Voice ER Navigator.
Say that a person is having difficulty breathing.
Allow the assistant to begin a Rime-generated response.
Interrupt the assistant while it is speaking.
Say that the person is now unconscious.
Verify that the old audio stops.
Verify that the new input is recognized.
Verify that the state changes to CRITICAL_UNCONSCIOUS.
Verify that the previous response is discarded.
Verify that a new Rime-generated critical response plays.
Expected Result
Old response
     ↓
Interrupted
     ↓
Old audio cancelled
     ↓
New critical information
     ↓
CRITICAL_UNCONSCIOUS
     ↓
New Rime response
📄 Evidence

See RIME_EVIDENCE.md for the detailed voice-engineering acceptance test, procedure, result, and limitations.
## Deliverables

- Live Demo: https://voice-er-navigator.onrender.com
- GitHub Repository: https://github.com/Sandhiya123-design/Voice-er-navigator
- Demo Video: [Voice ER Navigator Demo](./submission/Voice_ER_Navigator_Demo.mp4)
- Rime Evidence: RIME_EVIDENCE.md

⚠️ Prototype Notice

This project is an experimental hackathon prototype and is not intended for clinical diagnosis, treatment, or replacement of emergency services.
