import { redirect } from 'next/navigation';

// Antes aquí había una copia más del formulario. El listado vive en el tablero.
export default function RequisicionesIndex() {
  redirect('/dashboard/tablero');
}
