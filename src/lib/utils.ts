/**
 * 🛠️ UTILIDADES GLOBALES - FUNCIONES HELPER
 *
 * Responsabilidad: Funciones reutilizables en toda la aplicación
 * Flujo: Importado por componentes, hooks → Utilidades comunes
 *
 * Contiene:
 * - cn(): Combinar clases CSS de Tailwind (clsx + tailwind-merge)
 * - [Futuro] Otras funciones helper (formatos, validaciones, etc.)
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
