/**
 * 🏠 PÁGINA RAÍZ - DASHBOARD PRINCIPAL
 *
 * Responsabilidad: Dashboard principal de la aplicación
 * Flujo: Página principal con layout de dashboard
 */

import DashboardLayout from './(dashboard)/layout';
import DashboardPage from './(dashboard)/page';

export default function HomePage() {
  return (
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  );
}