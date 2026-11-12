export default function Logo({ size = 28, showWordmark = true, className = '' }) {
  return (
    <span
      className={`enawga-logo ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}
    >
      <img 
        src="/enawga-mark.svg" 
        alt="Enawga Logo"
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
        
      {showWordmark && (
        <span
          style={{
            fontWeight: 800,
            fontSize: size * 0.66,
            letterSpacing: '-0.03em',
            color: 'var(--color-navy)',
          }}
        >
          Enawga
        </span>
      )}
    </span>
  );
}
