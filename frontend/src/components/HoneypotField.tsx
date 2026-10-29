import type { UseFormRegisterReturn } from 'react-hook-form'

// Campo trampa anti-bots: fuera de la pantalla, oculto a los lectores de
// pantalla y fuera del orden de tabulación. Una persona nunca lo rellena;
// muchos bots rellenan todos los campos, y el backend rechaza el envío.
// Sin captcha: no molesta a nadie.
export function HoneypotField({ registration }: { registration: UseFormRegisterReturn }) {
  return (
    <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
      <label htmlFor="website">No rellenes este campo</label>
      <input id="website" type="text" tabIndex={-1} autoComplete="off" {...registration} />
    </div>
  )
}
