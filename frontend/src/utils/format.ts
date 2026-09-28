// Un único punto de conversión de céntimos a texto. Si mañana cambiamos
// el formato (por ejemplo, mostrar "0,00 €" en vez de "0,00 €" con otro
// símbolo), solo se toca este archivo.
const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
})

export function formatPriceCents(cents: number): string {
  return currencyFormatter.format(cents / 100)
}