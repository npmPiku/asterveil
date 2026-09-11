import OrbitMark from './OrbitMark';

export default function HeroModel() {
  return (
    <div className="hero-model" role="img" aria-label="Animated three-dimensional globe representing a private proof">
      <div className="model-starfield" aria-hidden="true" />
      <div className="model-halo model-halo-one" />
      <div className="model-halo model-halo-two" />
      <div className="model-stage">
        <div className="model-orbit model-orbit-x" />
        <div className="model-orbit model-orbit-y" />
        <div className="model-orbit model-orbit-z" />
        <div className="model-sphere">
          <div className="model-sphere-shine" />
          <div className="model-sphere-core" />
          <div className="model-sphere-grid" />
          <div className="model-sphere-meridian model-sphere-meridian-one" />
          <div className="model-sphere-meridian model-sphere-meridian-two" />
        </div>
        <span className="model-particle model-particle-one" />
        <span className="model-particle model-particle-two" />
        <span className="model-particle model-particle-three" />
      </div>
      <div className="model-readout model-readout-top"><span className="readout-dot" /> private input</div>
      <div className="model-readout model-readout-bottom">proof boundary <strong>sealed</strong></div>
      <div className="model-coordinate">37° 46' N&nbsp;&nbsp; / &nbsp;&nbsp;122° 25' W</div>
      <div className="orbit-caption">
        <div><strong>Selective reveal</strong><span>only the claim crosses the veil</span></div>
        <OrbitMark size={34} />
      </div>
    </div>
  );
}
