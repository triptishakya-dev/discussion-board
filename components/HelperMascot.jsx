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
  <ellipse className="b-shadow" cx="100" cy="226" rx="38" ry="6" fill="#000" opacity=".55"/>
  <g className="b-act"><g className="b-lean" id="b-lean"><g className="b-float">
    <g className="arm-l"><path d="M52 128L30 150V172" stroke="#34344A" strokeWidth="8" fill="none"/><rect x="24" y="172" width="12" height="12" rx="2" fill="#FBFBFB"/></g>
    <g className="arm-r"><path d="M148 128L170 150V172" stroke="#34344A" strokeWidth="8" fill="none"/><rect x="164" y="172" width="12" height="12" rx="2" fill="#FBFBFB"/></g>
    <path d="M100 40V22" stroke="#34344A" strokeWidth="3"/>
    <rect className="sig b-ant" x="94" y="10" width="12" height="12" rx="2"/>
    <path d="M66 40H134L150 56V174Q150 190 134 190H66L50 174V56Q50 40 66 40Z" fill="#1C1C26" stroke="#3A3A50" strokeWidth="2"/>
    <path d="M66 42H133L148 57V70H52V57Q52 42 66 42Z" fill="#fff" opacity=".04"/>
    <rect x="62" y="76" width="76" height="36" rx="4" fill="#0B0B12" stroke="#262634"/>
    <g id="b-eyes">
      <rect className="eye" x="80" y="86" width="10" height="16" rx="1.5" fill="#FBFBFB"/>
      <rect className="eye" x="110" y="86" width="10" height="16" rx="1.5" fill="#FBFBFB"/>
      <path className="heye" d="M78 99L85 90L92 99M108 99L115 90L122 99" stroke="#FBFBFB" strokeWidth="4" fill="none"/>
    </g>
    <rect className="sig line" x="62" y="120" width="76" height="3" rx="1.5"/>
    <g className="bars"><rect className="sig" x="74" y="115" width="8" height="13" rx="1"/><rect className="sig" x="86" y="112" width="8" height="19" rx="1"/><rect className="sig" x="98" y="114" width="8" height="15" rx="1"/><rect className="sig" x="110" y="112" width="8" height="19" rx="1"/><rect className="sig" x="122" y="115" width="6" height="13" rx="1"/></g>
    <rect className="chest" x="91" y="146" width="18" height="18" rx="2" fill="none" stroke="#3A3A50" strokeWidth="2"/>
  </g></g></g>
</svg>
      </button>
      <div className="bubble glass" id="bubble"></div>
      {open && <ProjectChat onClose={closeChat} />}
    </>
  );
}

