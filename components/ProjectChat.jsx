import { useEffect, useRef, useState } from 'react';

const microphoneErrors = {
  'not-allowed': 'Allow microphone access in your browser, then try again.',
  'audio-capture': 'No microphone was found. Connect one and try again.',
  'no-speech': 'Pip did not hear anything. Tap the microphone to try again.',
  network: 'Speech recognition could not connect. Please try again.',
};

// SpeechSynthesisVoice has no gender field, so prefer known female voices by name.
const femaleVoiceName = /\b(female|zira|jenny|aria|libby|sonia|susan|heera|neerja|priya|samantha|karen|moira|tessa|victoria|flo|serena|fiona|kate|veena|ananya|swara|madhurima)\b|^google (us english|uk english female|hindi)$/i;

function preferredVoice(voices, language) {
  const locale = language.toLowerCase();
  const baseLanguage = locale.split('-')[0];
  const femaleVoices = voices.filter(voice => femaleVoiceName.test(voice.name));
  return femaleVoices.find(voice => voice.lang.toLowerCase() === locale)
    ?? femaleVoices.find(voice => voice.lang.toLowerCase().split('-')[0] === baseLanguage);
}

export default function ProjectChat({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const log = useRef(null);
  const microphone = useRef(null);
  const recognition = useRef(null);
  const request = useRef(null);

  useEffect(() => {
    microphone.current?.focus();
    window.speechSynthesis?.getVoices();
    return () => {
      request.current?.abort();
      const listener = recognition.current;
      recognition.current = null;
      listener?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    log.current.scrollTop = log.current.scrollHeight;
  }, [messages, status, error]);

  async function ask(text, language) {
    const next = [...messages, { role: 'user', text }];
    const controller = new AbortController();
    request.current = controller;
    setMessages(next);
    setStatus('waiting');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-9) }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok || !result.answer) throw new Error(result.error || 'Pip could not answer.');
      setMessages([...next, { role: 'model', text: result.answer }]);
      if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
        const reply = new SpeechSynthesisUtterance(result.answer);
        reply.lang = language;
        const voice = preferredVoice(window.speechSynthesis.getVoices(), language);
        if (voice) reply.voice = voice;
        window.speechSynthesis.speak(reply);
      }
    } catch (caught) {
      if (!controller.signal.aborted) {
        setMessages(messages);
        setError(caught instanceof TypeError ? 'Could not connect. Please try again.' : caught.message);
      }
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setStatus('idle');
    }
  }

  function startOrStopListening() {
    if (recognition.current) {
      recognition.current.stop();
      return;
    }
    if (request.current) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice input is unavailable in this browser. Try opening the board in Chrome.');
      return;
    }

    window.speechSynthesis?.cancel();
    setError('');
    const listener = new SpeechRecognition();
    listener.lang = navigator.language || 'en-IN';
    listener.continuous = false;
    listener.interimResults = false;
    recognition.current = listener;
    listener.onresult = event => {
      if (recognition.current !== listener || request.current) return;
      const text = event.results[event.resultIndex][0].transcript.trim().slice(0, 1000);
      if (text) void ask(text, listener.lang);
    };
    listener.onerror = event => {
      if (recognition.current !== listener || event.error === 'aborted') return;
      setError(microphoneErrors[event.error] || 'Pip could not hear you. Please try again.');
    };
    listener.onend = () => {
      if (recognition.current !== listener) return;
      recognition.current = null;
      if (!request.current) setStatus('idle');
    };

    try {
      listener.start();
      setStatus('listening');
    } catch {
      recognition.current = null;
      setError('Could not start the microphone. Please try again.');
    }
  }

  const listening = status === 'listening';
  const waiting = status === 'waiting';

  return (
    <section id="project-chat" className="project-chat glass" aria-label="Talk to Pip"
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}>
      <header className="flex items-center justify-between gap-2">
        <strong>Talk to Pip</strong>
        <button type="button" className="pill" onClick={onClose} aria-label="Close chat">Close</button>
      </header>
      <div ref={log} className="chat-log grid gap-2 overflow-y-auto" role="log">
        <p className="chat-message">Tap the microphone and ask me about the project.</p>
        {messages.map(({ role, text }, index) => <p className={`chat-message ${role}`} key={index}>{text}</p>)}
        {waiting && <p className="chat-message">Pip is thinking…</p>}
      </div>
      {error && <p role="alert">{error}</p>}
      <button ref={microphone} type="button" className="pill blue flex items-center justify-center gap-2"
        onClick={startOrStopListening} aria-pressed={listening} disabled={waiting}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {listening ? <rect x="6" y="6" width="12" height="12" rx="2" />
            : <><rect x="9" y="2" width="6" height="13" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3" /></>}
        </svg>
        {listening ? 'Stop listening' : 'Tap to speak'}
      </button>
      {listening && <p role="status">Listening…</p>}
    </section>
  );
}
