export function BrandMark() {
  return (
    <svg viewBox="0 0 64 38" aria-hidden="true" fill="none">
      <path
        d="M3 32 23 12l11 11M22 32 43 5l18 22"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="square"
      />
    </svg>
  );
}
export default function Brand({ light = false }) {
  return (
    <span className={"brand " + (light ? "brand-light" : "")}>
      <BrandMark />
      <span>
        <b>ALBERTO ALFARO</b>
        <small>INMOBILIARIA</small>
      </span>
    </span>
  );
}
