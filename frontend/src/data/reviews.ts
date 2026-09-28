// Reseñas de ejemplo para la Home. Cuando exista el backend (FASE 11),
// se sustituirán por las reseñas reales moderadas y aprobadas.
export interface ExampleReview {
  id: number
  author: string
  rating: number
  comment: string
}

export const exampleReviews: ExampleReview[] = [
  {
    id: 1,
    author: 'Marina',
    rating: 5,
    comment: 'El latte Piplup es una pasada, y el sitio tiene un rollo muy acogedor.',
  },
  {
    id: 2,
    author: 'Hugo',
    rating: 4,
    comment: 'Buen café y un punto de curiosidad con los nombres de los productos, sin pasarse.',
  },
  {
    id: 3,
    author: 'Elena',
    rating: 5,
    comment: 'Perfecto para trabajar por las mañanas: tranquilo, buena luz y buen café.',
  },
]