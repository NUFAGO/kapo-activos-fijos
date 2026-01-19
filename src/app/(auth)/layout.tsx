/**
 * 🔐 AUTH LAYOUT - CONTENEDOR DE AUTENTICACIÓN
 *
 * Responsabilidad: Layout específico para páginas de auth (login, register, etc.)
 * Flujo: Envuelve páginas de auth → Proporciona estructura común
 *
 * Actualmente simple, pero puede contener:
 * - [Futuro] Logo, branding
 * - [Futuro] Layout responsive para auth
 * - [Futuro] Animaciones de entrada
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
