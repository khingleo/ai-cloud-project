/**
 * MTN GHANA EDB ENTERPRISE REPOSITORY - MAIN ROUTER CONFIGURATION
 * 
 * Title: "Development of an AI-Powered Cloud Central Repository for Enterprise Service and Customer Management"
 * Enterprise Business Unit (EDB) Repository.
 * 
 * RBAC (Role-Based Access Control):
 *   Super Admin → Full access to all modules, audits, imports, tariffs, network config and system settings
 *   Admin       → Add, Edit, Delete, Export, Import, Pricing Approvals across repository
 *   Staff       → Operational view, add and customer 360 maintenance
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppStateProvider } from './context/AppStateContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { useAuth } from './context/AuthContext';

// Module Pages
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { AddCustomerPage } from './pages/AddCustomerPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { NetworkConfigPage } from './pages/NetworkConfigPage';
import { PricingPage } from './pages/PricingPage';
import { BillingRevenuePage } from './pages/BillingRevenuePage';
import { DataQualityPage } from './pages/DataQualityPage';
import { DataImportPage } from './pages/DataImportPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { GlobalSearchPage } from './pages/GlobalSearchPage';
import { LeadsPage } from './pages/LeadsPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { OpportunityDetailPage } from './pages/OpportunityDetailPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { PresalesPage } from './pages/PresalesPage';
import { PresalesDetailPage } from './pages/PresalesDetailPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { ServiceDeliveryPage } from './pages/ServiceDeliveryPage';
import { ActiveServicesPage } from './pages/ActiveServicesPage';
import { TasksPage } from './pages/TasksPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminConsolePage } from './pages/AdminConsolePage';

/**
 * Inner routing component for all enterprise application routes.
 */
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  // Show login page when not authenticated
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Main Application Shell */}
      <Route element={<AppLayout />}>
        {/* Default Redirect to Dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* 1. Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* 2. Customer Management */}
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/new" element={<AddCustomerPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />

        {/* 3. Service Management & Subscriptions */}
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/presales" element={<PresalesPage />} />
        <Route path="/presales/:id" element={<PresalesDetailPage />} />
        <Route path="/service-delivery" element={<ServiceDeliveryPage />} />
        <Route path="/active-services" element={<ActiveServicesPage />} />

        {/* 4. Technical Network Repository */}
        <Route path="/network" element={<NetworkConfigPage />} />

        {/* 5. Commercial Module: Pricing, Billing & Revenue */}
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/billing" element={<BillingRevenuePage />} />
        <Route path="/revenue" element={<BillingRevenuePage />} />

        {/* 6. Documents & Workflow */}
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route path="/tasks" element={<TasksPage />} />

        {/* 7. Operations & Universal Discovery */}
        <Route path="/search" element={<GlobalSearchPage />} />
        <Route path="/compare" element={<GlobalSearchPage />} />

        {/* 8. Data Management & Quality */}
        <Route path="/import" element={<DataImportPage />} />
        <Route path="/data-quality" element={<DataQualityPage />} />

        {/* 9. Insights, Intelligence & Analytics */}
        <Route path="/ai-assistant" element={<AIAssistantPage />} />
        <Route path="/reports" element={<ReportsPage />} />

        {/* 10. System, Security & Audit */}
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/audit" element={<AuditLogPage />} />

        {/* Admin Command Center & Security (Admin + Super Admin) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredTier="admin">
              <AdminConsolePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredTier="admin">
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute requiredTier="admin">
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppStateProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AppStateProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
