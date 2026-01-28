/**
 * PÁGINA RAÍZ → Redirige a /activos-fijos
 */

import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/activos-fijos');
}