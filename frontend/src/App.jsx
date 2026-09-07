import { useEffect, useRef, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import "./App.css";

const API_URL = "https://voice-er-navigator-api.onrender.com";

const STATES = {
  IDLE: "IDLE",
  BREATHING_DIFFICULTY: "BREATHING_DIFFICULTY",
  CHECKING_CONSCIOUSNESS: "CHECKING_CONSCIOUSNESS",
  CRITICAL_UNCONSCIOUS: "CRITICAL_UNCONSCIOUS",
};

const STATE_LABELS = {
  IDLE: "Ready",
  BREATHING_DIFFICULTY: "Breathing Difficulty",
  CHECKING_CONSCIOUSNESS: "Checking Consciousness",
  CRITICAL_UNCONSCIOUS: "Critical / Unconscious",
};

function App() {
  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    resetTranscript,
  } = useSpeechRecognition();

  const [messages, setMessages] = useState([]);
  const [emergencyState, setEmergencyState] = useState(STATES.IDLE);
  const [priority, setPriority] = useState("normal");

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [systemStatus, setSystemStatus] = useState("ready");
  const [interruptionStatus, setInterruptionStatus] = useState("idle");

  const [error, setError] = useState("");
  const [lastInterruptedText, setLastInterruptedText] = useState("");

  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  const requestIdRef = useRef(0);
  const previousListeningRef = useRef(false);
  const processingTranscriptRef = useRef("");

  /*
   * ---------------------------------------------------------
   * STOP CURRENT SPEECH
   * ---------------------------------------------------------
   *
   * Increasing requestId invalidates older requests.
   * This is important for interruption recovery.
   */
  const stopSpeaking = () => {
    requestIdRef.current += 1;

    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = "";
      } catch (err) {
        console.error("Error stopping audio:", err);
      }

      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setIsSpeaking(false);
  };

  /*
   * ---------------------------------------------------------
   * RIME TEXT-TO-SPEECH
   * ---------------------------------------------------------
   *
   * The backend calls Rime.
   * The browser receives the generated WAV audio.
   */
  const speakWithRime = async (text, requestId) => {
    if (!text) {
      return;
    }

    if (requestId !== requestIdRef.current) {
      console.log("Ignoring stale speech request.");
      return;
    }

    try {
      setIsSpeaking(true);
      setSystemStatus("speaking");
      setError("");

      console.log("Requesting Rime speech...");

      const response = await fetch(`${API_URL}/api/speak`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error("Rime backend error:", errorText);

        throw new Error("Rime speech generation failed.");
      }

      const audioBlob = await response.blob();

      console.log(
        "Rime audio received:",
        audioBlob.size,
        "bytes",
        audioBlob.type,
      );

      /*
       * If the user interrupted while Rime
       * was generating audio, discard it.
       */
      if (requestId !== requestIdRef.current) {
        console.log("Discarding stale Rime audio.");
        return;
      }

      /*
       * Clean up previous object URL.
       */
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      const audioUrl = URL.createObjectURL(audioBlob);

      audioUrlRef.current = audioUrl;

      /*
       * Create audio element.
       */
      const audio = new Audio();

      audioRef.current = audio;

      /*
       * Explicitly configure audio.
       */
      audio.preload = "auto";
      audio.src = audioUrl;

      /*
       * When audio finishes.
       */
      audio.onended = () => {
        console.log("Rime audio finished.");

        if (audioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          audioUrlRef.current = null;
        }

        if (requestId === requestIdRef.current) {
          audioRef.current = null;
          setIsSpeaking(false);
          setSystemStatus("ready");
        }
      };

      /*
       * Audio loading error.
       */
      audio.onerror = (event) => {
        console.error("Audio playback error:", event);

        if (audioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          audioUrlRef.current = null;
        }

        if (requestId === requestIdRef.current) {
          audioRef.current = null;
          setIsSpeaking(false);
          setSystemStatus("ready");
          setError("Unable to play the Rime response.");
        }
      };

      /*
       * Explicitly load the WAV.
       */
      audio.load();

      console.log("Attempting to play Rime audio...");

      /*
       * Play the generated speech.
       */
      await audio.play();

      console.log("Rime audio playback started.");
    } catch (err) {
      console.error("Rime playback error:", err);

      if (requestId === requestIdRef.current) {
        setIsSpeaking(false);
        setSystemStatus("ready");

        /*
         * Browser autoplay error.
         */
        if (err?.name === "NotAllowedError") {
          setError(
            "Browser blocked audio playback. Click the microphone once and try again.",
          );
        } else {
          setError("Rime speech could not be played.");
        }
      }
    }
  };

  /*
   * ---------------------------------------------------------
   * PROCESS USER MESSAGE
   * ---------------------------------------------------------
   */
  const processMessage = async (message) => {
    const cleanMessage = message.trim();

    if (!cleanMessage) {
      return;
    }

    /*
     * Create a new request ID.
     */
    const currentRequestId = ++requestIdRef.current;

    /*
     * Stop any previous speech.
     */
    stopSpeaking();

    /*
     * stopSpeaking increments requestId,
     * so create the final ID after stopping.
     */
    const activeRequestId = requestIdRef.current;

    setError("");
    setIsProcessing(true);
    setSystemStatus("processing");

    /*
     * Add user message.
     */
    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        text: cleanMessage,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    try {
      const response = await fetch(`${API_URL}/api/emergency/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: cleanMessage,
          currentState: emergencyState,
        }),
      });

      if (!response.ok) {
        throw new Error("Emergency analysis failed.");
      }

      const result = await response.json();

      /*
       * Ignore stale responses.
       */
      if (activeRequestId !== requestIdRef.current) {
        console.log("Ignoring stale emergency response.");
        return;
      }

      /*
       * Update emergency state.
       */
      setEmergencyState(result.state);

      setPriority(result.priority);

      /*
       * Add assistant response.
       */
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: result.response,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

      setIsProcessing(false);

      /*
       * Generate and play Rime speech.
       */
      await speakWithRime(result.response, activeRequestId);
    } catch (err) {
      console.error("Emergency processing error:", err);

      if (activeRequestId === requestIdRef.current) {
        setIsProcessing(false);
        setSystemStatus("ready");

        setError("Unable to connect to the emergency navigation service.");
      }
    }
  };

  /*
   * ---------------------------------------------------------
   * SPEECH RECOGNITION FINISHED
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (previousListeningRef.current && !listening && transcript.trim()) {
      const finalTranscript = transcript.trim();

      if (finalTranscript !== processingTranscriptRef.current) {
        processingTranscriptRef.current = finalTranscript;

        processMessage(finalTranscript);

        setTimeout(() => {
          resetTranscript();
          processingTranscriptRef.current = "";
        }, 100);
      }
    }

    previousListeningRef.current = listening;
  }, [listening, transcript]);

  /*
   * ---------------------------------------------------------
   * MOBILE SPEECH RECOGNITION FEEDBACK
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (!listening && !transcript.trim() && systemStatus === "listening") {
      console.log("Speech recognition stopped without receiving a transcript.");

      setSystemStatus("ready");

      setError(
        "No speech was detected. Please tap the microphone and speak clearly.",
      );
    }
  }, [listening, transcript, systemStatus]);

  /*
   * ---------------------------------------------------------
   * START LISTENING / INTERRUPT
   * ---------------------------------------------------------
   */
  const startListening = async () => {
    setError("");

    console.log("Starting speech recognition...");
    console.log("Browser supports speech:", browserSupportsSpeechRecognition);
    console.log("Microphone available:", isMicrophoneAvailable);

    if (!browserSupportsSpeechRecognition) {
      setError(
        "Speech recognition is not supported in this browser. Try Chrome.",
      );
      return;
    }

    if (isMicrophoneAvailable === false) {
      setError(
        "Microphone access is unavailable. Check your browser and phone microphone permissions.",
      );
      return;
    }

    // If assistant is currently speaking, this is an interruption.
    if (isSpeaking) {
      console.log("USER INTERRUPTION DETECTED");

      setInterruptionStatus("detected");
      setLastInterruptedText("User interruption detected");

      // Stop the old Rime response immediately.
      stopSpeaking();

      setSystemStatus("interrupted");
    }

    resetTranscript();

    try {
      setSystemStatus("listening");

      await SpeechRecognition.startListening({
        continuous: false,
        language: "en-US",
      });

      console.log("Speech recognition started.");
    } catch (err) {
      console.error("Speech recognition start error:", err);

      setSystemStatus("ready");

      setError(
        `Microphone could not be started: ${
          err?.message || err?.name || "Unknown browser error"
        }`,
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * RESET SESSION
   * ---------------------------------------------------------
   */
  const resetSession = async () => {
    stopSpeaking();

    try {
      await fetch(`${API_URL}/api/emergency/reset`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Reset error:", err);
    }

    setMessages([]);
    setEmergencyState(STATES.IDLE);
    setPriority("normal");
    setIsProcessing(false);
    setIsSpeaking(false);
    setInterruptionStatus("idle");
    setLastInterruptedText("");
    setSystemStatus("ready");
    setError("");

    resetTranscript();
  };

  /*
   * ---------------------------------------------------------
   * INTERRUPTION DEMO
   * ---------------------------------------------------------
   */
  const runInterruptionDemo = async () => {
    setError("");

    setInterruptionStatus("detected");

    setSystemStatus("interrupted");

    /*
     * Stop any current speech.
     */
    stopSpeaking();

    setLastInterruptedText("Wait! He's unconscious!");

    await new Promise((resolve) => setTimeout(resolve, 600));

    setInterruptionStatus("processing");

    await processMessage("Wait! He's unconscious!");

    setInterruptionStatus("recovered");
  };

  const stateLabel = STATE_LABELS[emergencyState] || "Ready";

  const getPriorityLabel = () => {
    if (priority === "critical") {
      return "Critical";
    }

    if (priority === "high") {
      return "High";
    }

    return "Normal";
  };

  const getStatusText = () => {
    if (listening) {
      return "Listening to you";
    }

    if (isProcessing) {
      return "Processing emergency information";
    }

    if (isSpeaking) {
      return "Assistant is speaking";
    }

    if (systemStatus === "interrupted") {
      return "Response interrupted";
    }

    return "Ready for voice input";
  };

  const getStatusIcon = () => {
    if (listening) {
      return "â—‰";
    }

    if (isProcessing) {
      return "â—Œ";
    }

    if (isSpeaking) {
      return "â—–";
    }

    if (systemStatus === "interrupted") {
      return "!";
    }

    return "âœ“";
  };

  return (
    <div className="app">
      {/* HEADER */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <span className="brand-pulse"></span>

            <span className="brand-cross">+</span>
          </div>

          <div>
            <div className="brand-name">Voice ER Navigator</div>

            <div className="brand-caption">
              Voice-first emergency navigation
            </div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="engine-indicator">
            <span className="online-dot"></span>

            <span>Voice Engine Online</span>
          </div>

          <div className="topbar-divider"></div>

          <div className="system-label">Prototype</div>
        </div>
      </header>

      {/* MAIN */}
      <main className="main-container">
        {/* HERO */}
        <section className="hero">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            VOICE-FIRST EMERGENCY NAVIGATION
          </div>

          <h1>
            Emergency guidance that
            <span> listens when things change.</span>
          </h1>

          <p>
            A voice-first emergency navigation prototype designed to maintain
            conversation state and recover when critical information changes.
          </p>
        </section>

        {/* SESSION STATUS */}
        <section className="session-status">
          <div className="session-status-left">
            <div className={`status-symbol ${priority}`}>
              {priority === "critical"
                ? "!"
                : priority === "high"
                  ? "!"
                  : "âœ“"}
            </div>

            <div>
              <div className="session-status-title">Emergency Session</div>

              <div className="session-status-subtitle">{stateLabel}</div>
            </div>
          </div>

          <div className="session-status-right">
            <div className="state-block">
              <span>STATE</span>

              <strong>{emergencyState}</strong>
            </div>

            <div className="state-divider"></div>

            <div className="state-block">
              <span>PRIORITY</span>

              <strong className={`priority-text ${priority}`}>
                {getPriorityLabel()}
              </strong>
            </div>
          </div>
        </section>

        {/* MAIN DASHBOARD */}
        <section className="dashboard-grid">
          {/* VOICE CONTROL */}
          <div className="card voice-card">
            <div className="card-header">
              <div>
                <div className="eyebrow">PRIMARY INTERACTION</div>

                <h2>Voice Control</h2>

                <p>
                  Speak naturally. The navigator listens, reasons through the
                  current state, and responds with voice.
                </p>
              </div>

              <div className="card-number">01</div>
            </div>

            <div className="voice-control-area">
              <div
                className={`voice-ring ${listening ? "active" : ""} ${
                  isSpeaking ? "speaking" : ""
                }`}
              >
                <button
                  className={`mic-button ${listening ? "listening" : ""} ${
                    isSpeaking ? "speaking" : ""
                  }`}
                  onClick={startListening}
                  disabled={isProcessing}
                  aria-label="Start voice input"
                >
                  <span className="mic-icon">{listening ? "â—" : "â—‰"}</span>
                </button>
              </div>

              <div className="voice-state">
                <div className="voice-state-title">
                  {getStatusIcon()} {getStatusText()}
                </div>

                <div className="voice-state-description">
                  {listening
                    ? "Describe what is happening."
                    : isSpeaking
                      ? "You can interrupt the response with new critical information."
                      : isProcessing
                        ? "Updating the emergency state..."
                        : "Tap the microphone to speak."}
                </div>
              </div>

              {transcript && (
                <div className="live-transcript">
                  <div className="transcript-label">LIVE TRANSCRIPT</div>

                  <div className="transcript-text">â€œ{transcript}â€</div>
                </div>
              )}
            </div>

            <div className="voice-footer">
              <div className="voice-capability">
                <span className="capability-icon">MIC</span>
                Browser speech recognition
              </div>

              <div className="voice-capability">
                <span className="capability-icon">R</span>
                Rime voice output
              </div>
            </div>
          </div>

          {/* EMERGENCY SESSION */}
          <div className="card conversation-card">
            <div className="card-header">
              <div>
                <div className="eyebrow">LIVE SESSION</div>

                <h2>Emergency Session</h2>

                <p>Conversation and state updates appear here in real time.</p>
              </div>

              <div className="session-live">
                <span></span>
                LIVE
              </div>
            </div>

            <div className="conversation">
              {messages.length === 0 ? (
                <div className="empty-conversation">
                  <div className="empty-icon">+</div>

                  <h3>Session ready</h3>

                  <p>
                    Tell the navigator what is happening. Your voice will start
                    the emergency workflow.
                  </p>

                  <div className="example-prompt">
                    Try saying:
                    <strong>
                      â€œMy father is having difficulty breathing.â€
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="message-list">
                  {messages.map((message, index) => (
                    <div
                      className={`message-row ${message.role}`}
                      key={`${message.time}-${index}`}
                    >
                      <div className="message-avatar">
                        {message.role === "user" ? "YOU" : "VE"}
                      </div>

                      <div className="message-content">
                        <div className="message-meta">
                          <span>
                            {message.role === "user"
                              ? "You"
                              : "Voice ER Navigator"}
                          </span>

                          <time>{message.time}</time>
                        </div>

                        <div className="message-bubble">{message.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="conversation-footer">
              <button className="secondary-button" onClick={resetSession}>
                <span>â†»</span>
                Reset Session
              </button>

              <div className="conversation-note">
                No diagnosis â€¢ Navigation only
              </div>
            </div>
          </div>
        </section>

        {/* CRITICAL ALERT */}
        {emergencyState === STATES.CRITICAL_UNCONSCIOUS && (
          <section className="critical-alert">
            <div className="critical-alert-icon">!</div>

            <div className="critical-alert-content">
              <div className="critical-label">
                CRITICAL INFORMATION DETECTED
              </div>

              <h3>The reported situation has changed.</h3>

              <p>
                The person has been reported as unconscious or not responding.
                Contact your local emergency service immediately and stay with
                the person.
              </p>
            </div>

            <div className="critical-state">
              <span>STATE</span>

              <strong>CRITICAL_UNCONSCIOUS</strong>
            </div>
          </section>
        )}

        {/* INTERRUPTION RECOVERY */}
        <section className="recovery-card">
          <div className="recovery-header">
            <div>
              <div className="eyebrow light">HARD VOICE ENGINEERING</div>

              <h2>Interruption Recovery</h2>

              <p>
                The system prioritizes newly spoken critical information over an
                older response that is still playing.
              </p>
            </div>

            <div className="recovery-status">
              <span
                className={`recovery-status-dot ${interruptionStatus}`}
              ></span>

              {interruptionStatus === "detected"
                ? "Interruption detected"
                : interruptionStatus === "processing"
                  ? "Updating state"
                  : interruptionStatus === "recovered"
                    ? "Recovered"
                    : "Monitoring"}
            </div>
          </div>

          <div className="recovery-flow">
            <div className="flow-step">
              <div className="flow-icon">01</div>

              <span>Assistant speaking</span>
            </div>

            <div className="flow-line"></div>

            <div className="flow-step">
              <div className="flow-icon">02</div>

              <span>User interrupts</span>
            </div>

            <div className="flow-line"></div>

            <div className="flow-step">
              <div className="flow-icon">03</div>

              <span>Old response stopped</span>
            </div>

            <div className="flow-line"></div>

            <div className="flow-step">
              <div className="flow-icon">04</div>

              <span>State updated</span>
            </div>

            <div className="flow-line"></div>

            <div className="flow-step">
              <div className="flow-icon">05</div>

              <span>New Rime response</span>
            </div>
          </div>

          {lastInterruptedText && (
            <div className="interruption-event">
              <div className="event-marker"></div>

              <div>
                <div className="event-label">LATEST INTERRUPTION</div>

                <div className="event-text">
                  â€œ
                  {lastInterruptedText}
                  â€
                </div>
              </div>
            </div>
          )}

          <div className="recovery-action">
            <div className="recovery-explanation">
              <strong>Stress-test the voice pipeline</strong>

              <span>
                Simulate a critical interruption while the assistant is
                responding.
              </span>
            </div>

            <button
              className="demo-button"
              onClick={runInterruptionDemo}
              disabled={isProcessing}
            >
              Run Interruption Test
              <span>â†’</span>
            </button>
          </div>
        </section>

        {/* ARCHITECTURE */}
        <section className="architecture-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">SYSTEM ARCHITECTURE</div>

              <h2>Built around explicit voice state.</h2>
            </div>

            <p>
              Four layers work together to make voice the primary interaction
              rather than an optional chatbot feature.
            </p>
          </div>

          <div className="architecture-grid">
            <div className="architecture-card">
              <div className="architecture-number">01</div>

              <div className="architecture-icon">MIC</div>

              <h3>Voice Input</h3>

              <p>
                Browser speech recognition captures the user's spoken emergency
                information.
              </p>

              <div className="architecture-tag">SPEECH</div>
            </div>

            <div className="architecture-card">
              <div className="architecture-number">02</div>

              <div className="architecture-icon">STATE</div>

              <h3>State Controller</h3>

              <p>
                Explicit emergency states preserve the current context
                throughout the session.
              </p>

              <div className="architecture-tag">CONTEXT</div>
            </div>

            <div className="architecture-card">
              <div className="architecture-number">03</div>

              <div className="architecture-icon">â†»</div>

              <h3>Interruption Manager</h3>

              <p>
                New critical input invalidates stale responses and takes
                priority immediately.
              </p>

              <div className="architecture-tag">RECOVERY</div>
            </div>

            <div className="architecture-card">
              <div className="architecture-number">04</div>

              <div className="architecture-icon">R</div>

              <h3>Rime TTS</h3>

              <p>
                Rime generates the primary spoken output delivered back to the
                user.
              </p>

              <div className="architecture-tag">VOICE</div>
            </div>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="error-banner">
            <span>!</span>

            {error}
          </div>
        )}

        {/* SAFETY */}
        <section className="safety-note">
          <div className="safety-icon">i</div>

          <div>
            <strong>Prototype safety notice</strong>

            <p>
              Voice ER Navigator is a prototype for emergency navigation and
              communication. It does not diagnose medical conditions and does
              not replace emergency services or trained professionals.
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div>
          <strong>Voice ER Navigator</strong>

          <span>Voice-first emergency navigation prototype</span>
        </div>

        <div className="footer-right">Built for the Rime Hackathon</div>
      </footer>
    </div>
  );
}

export default App;
