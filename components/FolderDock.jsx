export default function FolderDock() {
  return (
    <>
      <nav className="dock glass">
        <button className="folder" data-f="gallery">
          <svg viewBox="0 0 66 54"><defs><linearGradient id="fg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7cc4ff"/><stop offset="1" stopColor="#2f8cff"/></linearGradient></defs>
            <path d="M4 9a5 5 0 0 1 5-5h15l5 5h28a5 5 0 0 1 5 5v4H4z" fill="#2f7fe8"/><rect x="2" y="14" width="62" height="38" rx="7" fill="url(#fg1)"/><rect x="2" y="14" width="62" height="12" rx="7" fill="#fff" opacity=".18"/>
            <rect x="21" y="23" width="24" height="20" rx="3" fill="none" stroke="#fff" strokeWidth="2.4"/><path d="M23 40l7-8 5 5 3-3 5 6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round"/><circle cx="38" cy="28.5" r="2.3" fill="#fff"/></svg>
          <span>Gallery</span><small id="c-gallery"></small>
        </button>
        <button className="folder" data-f="pdf">
          <svg viewBox="0 0 66 54"><defs><linearGradient id="fg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffb37c"/><stop offset="1" stopColor="#ff7a45"/></linearGradient></defs>
            <path d="M4 9a5 5 0 0 1 5-5h15l5 5h28a5 5 0 0 1 5 5v4H4z" fill="#ee6a36"/><rect x="2" y="14" width="62" height="38" rx="7" fill="url(#fg2)"/><rect x="2" y="14" width="62" height="12" rx="7" fill="#fff" opacity=".18"/>
            <path d="M25 22h11l6 6v15a2 2 0 0 1-2 2H25a2 2 0 0 1-2-2V24a2 2 0 0 1 2-2z" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round"/><path d="M27 33h11M27 38h8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/></svg>
          <span>Brochures</span><small id="c-pdf"></small>
        </button>
        <button className="folder" data-f="layout">
          <svg viewBox="0 0 66 54"><defs><linearGradient id="fg3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b9a6ff"/><stop offset="1" stopColor="#7b61ff"/></linearGradient></defs>
            <path d="M4 9a5 5 0 0 1 5-5h15l5 5h28a5 5 0 0 1 5 5v4H4z" fill="#6c52ee"/><rect x="2" y="14" width="62" height="38" rx="7" fill="url(#fg3)"/><rect x="2" y="14" width="62" height="12" rx="7" fill="#fff" opacity=".18"/>
            <rect x="20" y="22" width="26" height="22" rx="2" fill="none" stroke="#fff" strokeWidth="2.4"/><path d="M33 22v9h13M20 35h8M33 44v-6" stroke="#fff" strokeWidth="2.2"/></svg>
          <span>Floor plans</span><small id="c-layout"></small>
        </button>
      </nav>
      
      <aside className="fly glass" id="fly"></aside>
    </>
  );
}
