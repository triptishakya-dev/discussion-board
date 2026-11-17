import { useRef, useState } from "react";
import ProjectChat from "./ProjectChat";

export default function HelperMascot() {
  const [open, setOpen] = useState(false);
  const toggle = useRef(null);
  function closeChat() {
    setOpen(false);
    toggle.current?.focus();
  }

  return (
    <>
      <button type="button" className="bot" id="bot" ref={toggle} aria-label="Talk to Pip"
        aria-expanded={open} aria-controls={open ? "project-chat" : undefined} onClick={() => setOpen(value => !value)}>
      <svg viewBox="0 0 200 240">
        <defs>
          <radialGradient id="bBody" cx="50%" cy="45%" r="62%"><stop offset="0" stopColor="#2d63ff"/><stop offset=".5" stopColor="#3b74ff" stopOpacity=".92"/><stop offset=".82" stopColor="#9dc0ff" stopOpacity=".55"/><stop offset="1" stopColor="#e8f0ff" stopOpacity=".4"/></radialGradient>
          <linearGradient id="bFade" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stopColor="#fff" stopOpacity="0"/><stop offset="1" stopColor="#eaf2ff" stopOpacity=".55"/></linearGradient>
          <linearGradient id="bArm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4a80ff"/><stop offset="1" stopColor="#cfe0ff" stopOpacity=".75"/></linearGradient>
          <radialGradient id="bHand" cx="40%" cy="35%"><stop offset="0" stopColor="#f2f7ff" stopOpacity=".95"/><stop offset="1" stopColor="#a9c6ff" stopOpacity=".6"/></radialGradient>
          <linearGradient id="bVis" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a1440"/><stop offset="1" stopColor="#16308a"/></linearGradient>
          <filter id="bSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
          <filter id="bGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="bShadow" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="4"/></filter>
          <clipPath id="bClip"><rect x="48" y="38" width="104" height="150" rx="50"/></clipPath>
        </defs>
        <ellipse className="b-shadow" cx="100" cy="228" rx="40" ry="7" fill="#000820" opacity=".45" filter="url(#bShadow)"/>
        <g className="b-act"><g className="b-lean" id="b-lean"><g className="b-float">
          <g className="arm-l"><path d="M56 140C40 150 31 163 29 178" stroke="url(#bArm)" strokeWidth="12" strokeLinecap="round" fill="none"/><ellipse cx="28" cy="185" rx="10" ry="9" fill="url(#bHand)"/></g>
          <g className="arm-r"><path d="M144 140C160 150 169 163 171 178" stroke="url(#bArm)" strokeWidth="12" strokeLinecap="round" fill="none"/><ellipse cx="172" cy="185" rx="10" ry="9" fill="url(#bHand)"/></g>
          <path d="M100 40V22" stroke="#cfe0ff" strokeWidth="3" strokeLinecap="round" opacity=".8"/>
          <circle className="b-ant" cx="100" cy="17" r="6.5" fill="#9fe8ff" filter="url(#bGlow)"/>
          <rect x="48" y="38" width="104" height="150" rx="50" fill="url(#bBody)" stroke="rgba(255,255,255,.55)" strokeWidth="1.5"/>
          <g clipPath="url(#bClip)"><ellipse cx="100" cy="128" rx="32" ry="50" fill="#1840ff" opacity=".55" filter="url(#bSoft)"/><rect x="48" y="38" width="104" height="150" fill="url(#bFade)"/></g>
          <rect x="60" y="72" width="80" height="42" rx="21" fill="url(#bVis)" stroke="rgba(255,255,255,.25)"/>
          <rect x="70" y="76" width="36" height="5" rx="2.5" fill="#fff" opacity=".22"/>
          <g id="b-eyes">
            <circle className="eye" cx="84" cy="93" r="6.2" fill="#a8ecff" filter="url(#bGlow)"/>
            <circle className="eye" cx="116" cy="93" r="6.2" fill="#a8ecff" filter="url(#bGlow)"/>
            <path className="heye" d="M77 96q7-9 14 0M109 96q7-9 14 0" stroke="#a8ecff" strokeWidth="3.6" strokeLinecap="round" fill="none" filter="url(#bGlow)"/>
          </g>
          <path d="M92 128q8 6 16 0" stroke="rgba(255,255,255,.8)" strokeWidth="3" strokeLinecap="round" fill="none"/>
          <circle cx="100" cy="158" r="10" fill="rgba(255,255,255,.1)" stroke="rgba(255,255,255,.5)" strokeWidth="1.5"/>
          <ellipse cx="74" cy="60" rx="15" ry="8" fill="#fff" opacity=".5" transform="rotate(-28 74 60)"/>
          <circle cx="66" cy="74" r="3" fill="#fff" opacity=".45"/>
        </g></g></g>
      </svg>
      </button>
      <div className="bubble glass" id="bubble"></div>
      {open && <ProjectChat onClose={closeChat} />}
    </>
  );
}

