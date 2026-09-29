interface MountainSceneProps {
  className?: string
}

// Ilustración protagonista del Hero: tres capas de montaña (Monte Corona
// en primer plano, sin animar) y un sendero que se dibuja al cargar la
// página (clase "trail-path", definida en index.css). Es el único
// momento animado no disparado por el usuario en todo el sitio.
export function MountainScene({ className = '' }: MountainSceneProps) {
  return (
    <svg
      viewBox="0 0 400 600"
      className={className}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <path
        d="M0 260 L60 180 L120 230 L180 140 L260 220 L330 160 L400 240 V600 H0 Z"
        fill="var(--color-muted)"
      />
      <path
        d="M0 340 L50 260 L100 300 L170 210 L230 290 L300 220 L400 310 V600 H0 Z"
        fill="var(--color-border)"
      />
      <path
        d="M0 420 L70 300 L130 370 L200 250 L260 360 L340 290 L400 400 V600 H0 Z"
        fill="var(--color-primary)"
      />
      <path
        className="trail-path"
        d="M40 600 C 90 480, 140 420, 200 250"
        pathLength={1}
        stroke="var(--color-ember)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <circle className="trail-point" cx="200" cy="250" r="4" fill="var(--color-ember)" />
    </svg>
  )
}