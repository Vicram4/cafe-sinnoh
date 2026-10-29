// Información del local ficticio. Un único archivo para no repetir estos
// datos en Footer, Home, /about y /contact; si cambia algo, se edita aquí.
export const shopInfo = {
  name: 'Café Sinnoh',
  address: 'Calle Ciudad Jubileo, 14, 28020 Madrid',
  phone: '+34 910 000 000',
  // .example está reservado para ejemplos (RFC 2606): nunca será de nadie,
  // así que ningún visitante enviará correos a un desconocido.
  email: 'hola@cafesinnoh.example',
  hours: [
    { days: 'Lunes a viernes', time: '08:00 - 20:00' },
    { days: 'Sábados', time: '09:00 - 21:00' },
    { days: 'Domingos', time: '09:00 - 15:00' },
  ],
}