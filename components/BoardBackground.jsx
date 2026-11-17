export default function BoardBackground() {
  return (
    <>
      <div className="bg pointer-events-none fixed inset-0 overflow-hidden" id="bg" aria-hidden="true">
        <div className="aura"><i className="a1"></i><i className="a2"></i><i className="a3"></i></div>
        <div className="frame"><i className="v1"></i><i className="v2"></i><i className="h1"></i><i className="h2"></i></div>
        <canvas id="dots"></canvas>
        <div className="rig" id="rig"><div className="dial"><div className="rings"></div><div className="ticks"></div><div className="disc"></div><div className="sweep"></div><div className="needle"></div><div className="hub"></div></div></div>
        <div className="grain"></div>
        <div className="vignette"></div>
      </div>
    </>
  );
}
