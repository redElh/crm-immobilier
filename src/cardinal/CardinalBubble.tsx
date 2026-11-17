import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, Loader2, TriangleAlert, X } from 'lucide-react';
import { CARDINAL_ENABLED } from './config';
import { CARDINAL_PAGES } from './siteMap';
import { useCardinalRecorder } from './useCardinalRecorder';
import { useCardinalDark } from './useCardinalTheme';
import { decide, doneReply, pageLabel, cleanSentence, scorePages } from './understand';
import { askBrain } from './api';
import { getAuthToken } from '../utils/auth';
import { initCardinalVoice, speak, stopSpeaking } from './speech';
import { cn } from '../lib/utils';
import { StageTooltip } from '../components/modules/registre/RegistreStage';

function currentRole(): string | undefined {
  try {
    const token = getAuthToken();
    if (!token) return undefined;
    return (JSON.parse(atob(token.split('.')[1])) as { role?: string }).role;
  } catch {
    return undefined;
  }
}

// Agent pages live under /:agentId/..., admin pages under /admin/:adminId/...
function shellBase(pathname: string): string {
  const m = pathname.match(/^\/(admin\/[^/]+|[^/]+)/);
  return m ? `/${m[1]}` : '';
}

// Guide Steps 6+8+9: the bubble hears (Whisper STT) and navigates.
// - Live pass: while the agent is speaking we keep transcribing partials and
//   act on a clear order immediately (listening/transcribing/acting overlap).
// - Session model: one click opens the session. It ends only via
//   "au revoir", the Terminer button, or Esc — never from silence.
export function CardinalBubble() {
  const { state, phrase, phraseSeq, busy: busySending, ms, error, start, flush, cut, setPaused, release } =
    useCardinalRecorder();
  const [reply, setReply] = useState('');
  const [heard, setHeard] = useState('');
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [sessionOn, setSessionOn] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [candidates, setCandidates] = useState<Array<{ id: string; path: string }>>([]);
  const loopRef = useRef(false);
  const handledSeqRef = useRef(0);
  // Brain dedup: never re-ask about the same (or barely changed) text,
  // and at most one brain call per 3s — overlapping windows repeat words.
  const lastBrainTextRef = useRef('');
  const lastBrainAtRef = useRef(0);
  // Pending clarification: Cardinal asked "Tu veux dire X ?" and waits for
  // oui / non / the page name. Answered utterances never reach the brain.
  const pendingRef = useRef<Array<{ id: string; path: string }> | null>(null);
  const speakingRef = useRef(false);
  const saySeqRef = useRef(0);
  const farewellTimerRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const dark = useCardinalDark();

  const UNCLEAR_REPLIES = [
    "Je n'ai pas bien compris, tu peux répéter ?",
    'Pardon, je n’ai pas saisi. Tu peux répéter ?',
    'Hmm, redis-moi ça ?',
  ];

  const pickUnclear = () => UNCLEAR_REPLIES[Math.floor(Math.random() * UNCLEAR_REPLIES.length)];

  // Step 10: speak a reply out loud. The stream pauses until the reply
  // finishes (he never hears himself), then resumes on a clean buffer.
  const say = (text: string) => {
    const mySay = (saySeqRef.current += 1);
    speakingRef.current = true;
    setSpeaking(true);
    setPaused(true);
    speak(text, () => {
      if (saySeqRef.current !== mySay) return;
      speakingRef.current = false;
      setSpeaking(false);
      if (!loopRef.current) return;
      cut();
      setPaused(false);
    });
  };

  const stopSaying = () => {
    saySeqRef.current += 1;
    speakingRef.current = false;
    setSpeaking(false);
    stopSpeaking();
    if (loopRef.current) {
      cut();
      setPaused(false);
    }
  };

  // Tiny mangles short answers ("oui" -> "Vi !"): match liberally, since an
  // entire utterance of "vi" can only be a mangled yes.
  const YES_WORDS = ['oui', 'ouais', 'ouai', 'vui', 'vi', 'yes', 'yep', 'exactement', 'tout a fait'];
  const NO_WORDS = ['non', 'nan', 'nope'];

  // Returns true when the utterance answered a pending "Tu veux dire ?".
  const answerPending = (raw: string): boolean => {
    const pending = pendingRef.current;
    if (!pending || pending.length === 0) return false;
    const cleaned = cleanSentence(raw);
    if (!cleaned) return false;
    if (YES_WORDS.includes(cleaned)) {
      const first = pending[0];
      pendingRef.current = null;
      setHeard(raw);
      goPage(first.path, first.id);
      return true;
    }
    if (NO_WORDS.includes(cleaned)) {
      pendingRef.current = null;
      setHeard(raw);
      setCandidates([]);
      setReply('D’accord, où veux-tu aller ?');
      say('D’accord, où veux-tu aller ?');
      return true;
    }
    // Named one of the candidates ("le calendrier")? Match within them.
    const pages = CARDINAL_PAGES.filter((p) => pending.some((c) => c.id === p.id));
    const ranked = scorePages(cleaned, pages);
    if (ranked[0] && ranked[0].score >= 0.4) {
      pendingRef.current = null;
      setHeard(raw);
      goPage(ranked[0].page.path, ranked[0].page.id);
      return true;
    }
    // Something else entirely: new order, drop the pending question.
    pendingRef.current = null;
    return false;
  };

  const goPage = (path: string, id: string, replyText?: string, speakIt = true) => {
    pendingRef.current = null;
    const base = shellBase(location.pathname);
    const reply = replyText ?? doneReply(id);
    setCandidates([]);
    setReply(reply);
    navigate(`${base}/${path}`.replace(/\/+$/, '') || '/');
    // Consumed: these words must never fire twice as windows overlap.
    cut();
    if (speakIt) say(reply);
  };

  const endLoop = (farewell: boolean) => {
    // Closing the loop first makes any in-flight window a no-op, so it
    // can't reopen the panel or fire the brain after teardown.
    loopRef.current = false;
    setSessionOn(false);
    setThinking(false);
    pendingRef.current = null;
    stopSaying();
    release();
    setCandidates([]);
    if (farewellTimerRef.current !== null) {
      window.clearTimeout(farewellTimerRef.current);
      farewellTimerRef.current = null;
    }
    if (farewell) {
      // Show the goodbye briefly, then close the panel entirely.
      setReply('Au revoir ! Clique sur la bulle quand tu as besoin de moi.');
      setPanelOpen(true);
      say('Au revoir !');
      farewellTimerRef.current = window.setTimeout(() => {
        farewellTimerRef.current = null;
        setPanelOpen(false);
        setReply('');
        setHeard('');
      }, 1800);
    } else {
      setPanelOpen(false);
      setReply('');
      setHeard('');
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') endLoop(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // A mic error ends the session — the agent restarts with a click.
  useEffect(() => {
    if (state === 'error') {
      loopRef.current = false;
      setSessionOn(false);
      release();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Heartbeat: Ollama unloads the model after ~5 min idle, and the next
  // unclear order pays a 4-12s cold load ("no response"). While a session
  // is open, ping the brain every 4 min so it stays resident. Silent.
  useEffect(() => {
    if (!sessionOn) return;
    const beat = () => {
      askBrain('bonjour', CARDINAL_PAGES.slice(0, 1)).catch(() => {});
    };
    beat();
    const id = window.setInterval(beat, 4 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [sessionOn]);

  // THE stream pass: every transcribed window runs the same flow — answers
  // first, then fast path, then brain. Acting cuts the consumed audio, so
  // overlapping windows never fire twice. Guarded so StrictMode's dev
  // double-effect can't fire the brain twice.
  useEffect(() => {
    if (phraseSeq === 0 || handledSeqRef.current >= phraseSeq || !phrase) return;
    handledSeqRef.current = phraseSeq;
    if (!loopRef.current) return;
    const text = phrase;
    // An answer to "Tu veux dire ?" ("oui") acts immediately.
    if (answerPending(text)) return;
    // Fragments ("Vi !", "3") are STT crumbs, not orders: never spend the
    // brain on them (it just guesses). Ask to repeat instead.
    if (cleanSentence(text).length < 3) {
      const msg = pickUnclear();
      setCandidates([]);
      setReply(msg);
      say(msg);
      return;
    }
    setHeard(text);
    const role = currentRole();
    const allowed = role
      ? CARDINAL_PAGES.filter((p) => p.roles.includes(role as 'agent' | 'admin' | 'gerant'))
      : CARDINAL_PAGES;
    const decision = decide(text, role);
    // eslint-disable-next-line no-console
    console.debug('[Cardinal] heard:', text, '->', decision);

    if (decision.kind === 'go') {
      goPage(decision.page.path, decision.page.id);
    } else if (decision.kind === 'back' || decision.kind === 'close') {
      const msg = decision.kind === 'back' ? 'On revient en arrière.' : 'Je ferme ça.';
      pendingRef.current = null;
      setCandidates([]);
      setReply(msg);
      cut();
      navigate(-1);
      say(msg);
    } else if (decision.kind === 'goodbye') {
      endLoop(true);
    } else if (decision.kind === 'refuse') {
      pendingRef.current = null;
      setCandidates([]);
      setReply('Je ne peux pas faire ça.');
      say('Je ne peux pas faire ça.');
    } else if (decision.kind === 'clarify') {
      const cands = decision.candidates.map((c) => ({ id: c.page.id, path: c.page.path }));
      const names = cands.map((c) => pageLabel(c.id)).join(' ou ');
      pendingRef.current = cands;
      setReply('Tu veux dire :');
      setCandidates(cands);
      say(`Tu veux dire ${names} ?`);
    } else {
      // Step 9: hand unclear requests to the local model. Dedup: overlapping
      // windows repeat words — never re-ask about the same text, and at most
      // one brain call per 3s.
      const now = Date.now();
      const norm = cleanSentence(text);
      if (norm === lastBrainTextRef.current || now - lastBrainAtRef.current < 3000) return;
      lastBrainTextRef.current = norm;
      lastBrainAtRef.current = now;
      setThinking(true);
      setReply('Je réfléchis…');
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 95000);
      askBrain(text, allowed, controller.signal)
        .then((brain) => {
          if (!loopRef.current) return;
          // eslint-disable-next-line no-console
          console.debug('[Cardinal] brain:', text, '->', brain);
          if (brain.action === 'go' && brain.target) {
            const page = CARDINAL_PAGES.find((p) => p.id === brain.target);
            if (page) goPage(page.path, page.id);
            else {
              setReply('Je ne trouve pas cette page.');
              say('Je ne trouve pas cette page.');
            }
          } else if (brain.action === 'back' || brain.action === 'close') {
            setCandidates([]);
            setReply('C’est parti.');
            cut();
            navigate(-1);
            say('C’est parti.');
          } else {
            const msg = pickUnclear();
            setCandidates([]);
            setReply(msg);
            say(msg);
          }
        })
        .catch(() => {
          if (!loopRef.current) return;
          setCandidates([]);
          setReply('Mon cerveau local ne répond pas. Vérifie Ollama puis réessaie.');
          say('Mon cerveau ne répond pas.');
          loopRef.current = false;
          setSessionOn(false);
        })
        .finally(() => {
          window.clearTimeout(timer);
          if (!loopRef.current) return;
          setThinking(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phraseSeq]);

  // Build marker: proves in the console which UI revision the browser runs.
  useEffect(() => {
    initCardinalVoice();
    // eslint-disable-next-line no-console
    console.debug('[Cardinal] ui rev10 always-on-stream');
  }, []);

  // Auth gate: the bubble is an agent/admin tool — hidden until one is
  // signed in. Re-evaluated on every render, so the navigation from login
  // (and the one back to /auth on logout) flips it without extra state.
  const role = currentRole();
  const authed = role === 'agent' || role === 'admin' || role === 'gerant';
  if (!authed || !CARDINAL_ENABLED) return null;

  // Streaming: the mic is open for the whole session, so "recording" means
  // session live — one steady red, zero flicker, zero gaps.
  const recording = sessionOn && state !== 'error';
  const busy = busySending || thinking;
  // Session-level status: steady while the session lives (no flicker on
  // utterance boundaries). The eq bars / spinner already show the phase.
  const status = speaking ? 'Je parle…' : sessionOn ? 'À l’écoute…' : 'Cardinal en pause';

  const openSession = () => {
    if (farewellTimerRef.current !== null) {
      window.clearTimeout(farewellTimerRef.current);
      farewellTimerRef.current = null;
    }
    setReply('');
    setHeard('');
    setCandidates([]);
    setThinking(false);
    loopRef.current = true;
    pendingRef.current = null;
    setSessionOn(true);
    setPanelOpen(true);
    void start();
  };

  // Cardinal is portalled at the app root, outside the Agent/Admin shell.
  // It carries its own self-contained token shell so the glass/pop accents
  // resolve correctly in BOTH light and dark. We must NOT reuse the shell's
  // stage-dark/stage-light classes here: those set position/overflow/background
  // and would override `fixed`, pushing the bubble into the page flow.
  const shellClass = ['cardinal-shell', isAdmin ? 'cardinal-admin' : '', dark ? 'cardinal-dark' : '']
    .filter(Boolean)
    .join(' ');
  const orbStyle = (
    isAdmin
      ? { '--orb-a': '#FBBF24', '--orb-b': '#B45309', '--orb-glow': 'rgba(245,158,11,0.5)' }
      : dark
        ? { '--orb-a': '#8B7CFF', '--orb-b': '#5646C9', '--orb-glow': 'rgba(124,92,255,0.55)' }
        : { '--orb-a': '#2DD4BF', '--orb-b': '#0E7C6B', '--orb-glow': 'rgba(20,184,166,0.5)' }
  ) as React.CSSProperties;
  const orbRecordingStyle = {
    '--orb-a': '#F87171',
    '--orb-b': '#B91C1C',
    '--orb-glow': 'rgba(248,113,113,0.55)',
  } as React.CSSProperties;

  // Portal to document.body: escapes any transformed/filtered ancestor in
  // the shell (framer-motion views, blurred wrappers) that would otherwise
  // trap `position: fixed` and push the bubble off-screen.
  // z-[10000]: the orb anchors the bottom-right floating rail, and its
  // panel must read above the draft bubbles/pocket that stack in the
  // slots above it (they sit at z-[9999]).
  return createPortal(
    <div className={`fixed bottom-6 right-6 z-[10000] flex flex-col items-end gap-3 animate-fade-in ${shellClass}`}>
      {panelOpen && (
        <div className="pop-glass w-80 rounded-2xl p-4 animate-slide-up">
          <div className="flex items-center gap-2.5">
            <span className="orb-icon h-10 w-10 rounded-full" style={recording ? orbRecordingStyle : orbStyle}>
              <Mic size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold leading-tight tracking-tight text-text">Cardinal</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                  <span className={cn('live-dot inline-block h-1.5 w-1.5 rounded-full', sessionOn ? 'bg-success text-success' : 'bg-text-secondary text-text-secondary')} />
                  {status}
                </span>
              </div>
            </div>
            {recording && (
              <span className="flex h-5 items-end gap-[3px]" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="eq-bar w-[3px] rounded-full bg-accent"
                    style={{ height: '100%', animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </span>
            )}
            {busy && !recording && (
              <Loader2 size={16} className="animate-spin text-text-secondary" />
            )}
          </div>

          {(phrase || heard || reply || error) && (
            <div className="mt-3 border-t border-border/60 pt-3">
              {error ? (
                <span className="text-sm text-error">{error}</span>
              ) : (
                <>
                  {phrase && !reply && (
                    <div className="text-sm italic text-text-secondary">« {phrase}… »</div>
                  )}
                  {heard && (
                    <div className="text-xs italic text-text-secondary">
                      « {heard} »{typeof ms === 'number' && (
                        <span className="ml-1.5 inline-block rounded-full bg-accent/10 px-1.5 py-px not-italic font-medium text-accent">
                          {(ms / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  )}
                  {reply && (
                    <div className="mt-1.5 border-l-2 border-accent pl-2.5 text-[15px] font-medium leading-snug text-text">
                      {reply}
                    </div>
                  )}
                  {candidates.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {candidates.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            goPage(c.path, c.id);
                          }}
                          className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-white hover:brightness-110"
                        >
                          {pageLabel(c.id)}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {sessionOn && (
            <button
              type="button"
              onClick={() => endLoop(false)}
              className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
            >
              <X size={12} /> Terminer la session
            </button>
          )}
        </div>
      )}

      <StageTooltip
        label={sessionOn ? 'Session ouverte — dis « au revoir » pour terminer' : 'Ouvrir Cardinal'}
        position="top"
        isDark={dark}
        accent={sessionOn || recording || state === 'error' ? '#F87171' : isAdmin ? '#FBBF24' : dark ? '#8B7CFF' : '#2DD4BF'}
        delay={220}
        zIndex={10100}
      >
        <button
          type="button"
          aria-label={sessionOn ? (recording ? 'Envoyer maintenant' : 'Cardinal à l’écoute') : 'Parler à Cardinal'}
          onClick={() => {
            if (speaking) {
              // Stop the reply right away, stay in session.
              stopSaying();
            } else if (sessionOn) {
              // "I'm done talking, act now": flush the current window.
              flush();
            } else {
              openSession();
            }
          }}
          style={sessionOn || recording || state === 'error' ? orbRecordingStyle : orbStyle}
          className={cn(
            'orb-icon h-16 w-16 rounded-full transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent',
            dark ? 'ring-offset-[#0B1022]' : 'ring-offset-transparent',
            recording ? 'animate-pulse-soft' : '',
            sessionOn && !recording ? 'ring-2 ring-white/50 ring-offset-2' : '',
            !sessionOn && !recording
              ? dark
                ? 'saturate-[.78] brightness-[.96] hover:saturate-100 hover:brightness-100'
                : 'saturate-[.55] brightness-[.94] hover:saturate-100 hover:brightness-100'
              : ''
          )}
        >
          {busy ? <Loader2 size={26} className="animate-spin" /> : state === 'error' ? <TriangleAlert size={26} /> : <Mic size={26} />}
        </button>
      </StageTooltip>
    </div>,
    document.body
  );
}
