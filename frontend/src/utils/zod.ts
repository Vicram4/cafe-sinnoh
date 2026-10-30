import { z } from 'zod'

// Sin esto, zod prueba si puede usar new Function para validar más rápido, y
// la CSP (vercel.json) lo registra como violación aunque zod capture el error.
// Va aquí y no en main.tsx para que zod no entre en el JavaScript inicial:
// solo lo descargan las páginas con formularios, que importan z desde aquí.
z.config({ jitless: true })

export { z }
