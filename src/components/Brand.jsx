export default function Brand({ light = false }) {
  return (
    <span className={"brand " + (light ? "brand-light" : "")}>
      <img
        className="brand-original"
        src="/logo.png"
        alt="Alberto Alfaro Inmobiliaria"
        width="640"
        height="232"
      />
    </span>
  );
}
