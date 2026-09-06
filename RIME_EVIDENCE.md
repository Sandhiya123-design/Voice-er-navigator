\# Rime Evidence



\## Hard Voice Engineering Claim



Voice ER Navigator addresses the problem of \*\*interruption and recovery during an active voice interaction\*\*.



When the user provides newly critical information while the assistant is speaking, the system can:



1\. Stop the current audio response.

2\. Accept the new spoken input.

3\. Detect the newly critical intent.

4\. Update the explicit emergency state.

5\. Invalidate the stale response.

6\. Generate a new response using Rime TTS.

7\. Play the new response.



The goal is to ensure that the assistant does not continue responding to an outdated emergency state after the situation has changed.



\---



\## Why This Is Voice-Specific



The problem is tied directly to spoken interaction.



The assistant may already be producing speech when the user needs to provide new information.



For example:



```text

Assistant is speaking

&#x20;       ↓

User says:

"Wait! He's unconscious now!"

&#x20;       ↓

Current speech is interrupted

&#x20;       ↓

New input is processed

&#x20;       ↓

Emergency state changes

&#x20;       ↓

New voice response is generated

\---



\## Acceptance Test



\### Test Name



\*\*Critical Interruption and Recovery\*\*



\### Initial Scenario



The user reports:



> "My father is having difficulty breathing."



The assistant enters the breathing-difficulty conversation flow and asks about consciousness and breathing status.



\### Stress Event



While the assistant is speaking, the user interrupts with:



> "Wait! He's unconscious now!"



\### Expected Behavior



```text

1\. Rime is speaking.

2\. User interrupts.

3\. Current audio stops.

4\. New speech is recognized.

5\. Unconsciousness intent is detected.

6\. State changes to CRITICAL\_UNCONSCIOUS.

7\. Previous response becomes stale and is discarded.

8\. New critical response is generated.

9\. New response is spoken using Rime.

Observed Result

PASS



The prototype successfully demonstrated:



Active Rime voice output.

User interruption during speech.

Cancellation of the previous audio response.

Recognition of newly spoken information.

Transition to CRITICAL\_UNCONSCIOUS.

Discarding of the stale response.

Generation and playback of a new Rime response.

Additional Recovery Test



After the critical interruption, the user can report:



"He is conscious now."



The state controller recognizes the change and provides a recovery response while retaining awareness that the person was previously unresponsive.



The prototype also handles additional changes such as:



"He is conscious but started vomiting."



The system updates the response based on the newly detected information.



State Priority



Critical information is evaluated before lower-priority conversational information.



Example:



Normal conversation

&#x20;      ↓

Breathing difficulty

&#x20;      ↓

Consciousness check

&#x20;      ↓

User interruption

&#x20;      ↓

Unconsciousness detected

&#x20;      ↓

CRITICAL\_UNCONSCIOUS



Unconsciousness has higher priority than normal conversational updates.



Rime Integration



Rime is used as the primary voice-output system in the prototype.



The backend sends response text to the Rime TTS API and returns generated WAV audio to the browser.



The frontend plays the generated audio as the assistant's spoken response.



Rime is therefore part of the core interaction rather than an optional playback feature.



Reproducibility

Backend



From the project root:



node server.js

Frontend



From the frontend directory:



npm run dev

Manual Acceptance Test



Use the following sequence:



"My father is having difficulty breathing."



"He is conscious."



\[Interrupt while the assistant is speaking]



"Wait! He is unconscious now!"

Expected State

CRITICAL\_UNCONSCIOUS

Expected Behavior



The previous voice response stops and a new Rime-generated critical response is played.



Limitations



This prototype currently uses browser speech recognition and a manual microphone interaction for interruption.



Recognition quality may vary depending on the browser, microphone, background noise, and network conditions.



The emergency responses are predefined safety-oriented responses rather than free-form medical advice.



The prototype does not diagnose medical conditions.



Safety Boundary



Voice ER Navigator is an emergency navigation prototype.



It should not be treated as a medical diagnostic or treatment system.



For a real emergency, users should contact their local emergency service and follow instructions from emergency dispatchers or trained professionals.

