// Ilustración del hero con un sendero que se dibuja solo hasta la cumbre.
// La imagen va DENTRO del SVG (no como <img> aparte): imagen y sendero
// comparten coordenadas, así que al recortarse con "slice" en cualquier
// tamaño de pantalla el sendero sigue pegado a la ladera.
// El sendero sube por el terreno despejado (orilla, claro entre bosques y
// zigzag por la ladera), trazado sobre la ilustración de 1000x979 px.
const WIDTH = 1000
const HEIGHT = 979
const TRAIL =
  'M219 650 C236 649 291 647 325 644 C359 640 401 639 422 629 C444 619 443 600 456 585 ' +
  'C469 570 501 556 500 540 C499 524 450 507 452 490 C455 473 510 457 512 440 C515 423 466 407 465 390 ' +
  'C464 373 505 357 506 340 C508 323 475 307 475 290 C475 273 502 257 505 240 C508 223 491 208 490 190 ' +
  'C489 172 499 142 501 132'
// Siempre el naranja oscuro de la marca: la ilustración es crema también en
// modo oscuro, y el naranja claro de ese tema apenas contrastaría sobre ella.
const EMBER = '#A8522E'

export function HeroScene({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <image href="/hero-montanas.webp" width={WIDTH} height={HEIGHT} />
      <path
        className="trail-path"
        d={TRAIL}
        pathLength={1}
        stroke={EMBER}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle className="trail-point" cx="501" cy="132" r="8" fill={EMBER} />
    </svg>
  )
}
