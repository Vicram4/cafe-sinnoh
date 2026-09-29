interface MountainLineProps {
  className?: string
}

// Motivo decorativo propio: una línea de contorno que evoca las
// siluetas de Monte Corona, dibujada a mano en SVG. Es la única pieza
// gráfica "protagonista" del sitio: se usa con moderación (divisores,
// fondo del hero), nunca repetida sin motivo en cada sección.
export function MountainLine({ className = '' }: MountainLineProps) {
  return (
    <svg
      viewBox="0 0 400 48"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M0 40 L40 16 L70 32 L110 6 L150 30 L190 12 L230 36 L270 18 L310 34 L350 10 L400 30" />
    </svg>
  )
}