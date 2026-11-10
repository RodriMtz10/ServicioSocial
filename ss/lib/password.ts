/** Genera una contraseña aleatoria legible (sin 0/O/1/l/I) que cumple la política: 12 caracteres con letras y números. */
export function generarPassword(largo = 12): string {
  const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ', numeros = '23456789';
  const todos = letras + numeros;
  const azar = (n: number) => { const b = new Uint32Array(1); const tope = 4294967296 - (4294967296 % n); let x: number; do { crypto.getRandomValues(b); x = b[0]; } while (x >= tope); return x % n; };
  const c = Array.from({ length: largo }, () => todos[azar(todos.length)]);
  const i = azar(largo); let j = azar(largo); while (j === i) j = azar(largo);
  c[i] = letras[azar(letras.length)]; // al menos una letra
  c[j] = numeros[azar(numeros.length)]; // y al menos un número
  return c.join('');
}
