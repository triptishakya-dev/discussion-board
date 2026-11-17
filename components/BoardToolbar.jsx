const controls = [
  [
    "zOut",
    "Zoom out",
    "M5 12h14",
    2.2,
    true,
    false
  ],
  [
    "zl",
    "Reset to 100%",
    null,
    2,
    false,
    false
  ],
  [
    "zIn",
    "Zoom in",
    "M5 12h14M12 5v14",
    2.2,
    true,
    false
  ],
  [
    "fit",
    "Show everything",
    "M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4",
    2.0,
    true,
    false
  ],
  [
    "clear",
    "Clear board",
    "M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3",
    2.0,
    true,
    true
  ],
  [
    "theme",
    "Light or dark",
    "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z",
    2.0,
    true,
    false
  ],
  [
    "fs",
    "Full screen",
    "M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5",
    2.0,
    true,
    false
  ]
];

function ToolButton({ control: [id, title, path, width, roundCap, roundJoin] }) {
  return (
    <button type="button" className="tb grid cursor-pointer place-items-center" id={id} title={title} aria-label={title}>
      {path ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width}
          strokeLinecap={roundCap ? 'round' : undefined} strokeLinejoin={roundJoin ? 'round' : undefined}>
          <path d={path} />
        </svg>
      ) : '100%'}
    </button>
  );
}

export default function BoardToolbar() {
  return (
    <div className="tools glass">
      {controls.slice(0, 3).map(control => <ToolButton key={control[0]} control={control} />)}
      <i className="sep" />
      {controls.slice(3).map(control => <ToolButton key={control[0]} control={control} />)}
    </div>
  );
}
