interface MountainSceneProps {
  className?: string
}

// Ilustración protagonista del Hero: tres capas de montaña (Monte Corona
// en primer plano) y un sendero punteado hacia la cima. Referencia sutil
// a Sinnoh: quien no conoce Pokémon ve solo un paisaje de senderismo;
// quien lo conoce, reconoce la silueta y el "camino hacia la cima".
// Usa var(--color-...) directamente: hereda el modo oscuro sin lógica
// adicional, porque esas variables cambian de valor dentro de .dark.
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
        d="M40 600 C 90 480, 140 420, 200 250"
        stroke="var(--color-ember)"
        strokeWidth="2"
        fill="none"
        strokeDasharray="1 8"
        strokeLinecap="round"
      />
      <circle cx="200" cy="250" r="4" fill="var(--color-ember)" />
    </svg>
  )
}