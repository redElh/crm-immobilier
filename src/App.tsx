import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import Dashboard from './pages/Dashboard'
import ProspectsPage from './pages/prospects/index'
import ProspectPage from './pages/prospects/[id]'
import ContactsPage from './pages/contacts/index'
import ContactPage from './pages/contacts/[id]'
import ClientsPageWithType from './pages/clients/withType'
import ClientPage from './pages/clients/[id]'
import ClientTypesPage from './pages/clients/types'
import PropertyTypesPage from './pages/properties/types'
import PropertiesPageWithType from './pages/properties/withType'
import PropertyPage from './pages/properties/[id]'
import AddPropertyForm from '../src/components/modules/properties/AddPropertyForm'
import DocumentsPage from './pages/documents/index'
import DocumentDetailPage from './pages/documents/[id]'
import CalendarPage from './pages/calendar/index'
import TransactionRegisterPage from './pages/register/index'
import ExtranetPage from './pages/extranet/index'
import AgentExtranetPage from './pages/extranet/agent'
import AutomatorPage from './pages/automator/index'
import PretPage from './pages/pret/index'
import ComposeMessagePage from './pages/messages/compose'
import MessageDetailPage from './pages/messages/[id]'
import MessagesPage from './pages/messages/index'
import MessagesTemplatesPage from './pages/messages/templates/index'
import MessagesSettingsPage from './pages/messages/settings'
import SettingsPage from './pages/settings'
import NotificationSettingsPage from './pages/settings/notifications'
import ProfileSettingsPage from './pages/settings/compte/profil'
import SecuritySettingsPage from './pages/settings/compte/securite'
import PreferencesSettingsPage from './pages/settings/compte/preferences'
import SignatureSettingsPage from './pages/settings/communication/signature'
import AutoReplySettingsPage from './pages/settings/communication/reponses-automatiques'
import IntegrationsSettingsPage from './pages/settings/integrations/index'
import TeamSettingsPage from './pages/settings/equipe/index'
import DataSettingsPage from './pages/settings/donnees/index'
import HelpSettingsPage from './pages/settings/aide/index'
import LoginPage from './pages/auth/login'
import RegisterPage from './pages/auth/register'
import VerifyEmailPage from './pages/auth/verify-email'
import ForgotPasswordPage from './pages/auth/forgot-password'
import ContractsPage from './pages/contracts/index'
import ContractDetailPage from './pages/contracts/[id]'

// Admin imports
import { AdminLayout } from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/dashboard/index'
import AdminUsersPage from './pages/admin/users/index'
import AdminUserDetailPage from './pages/admin/users/[id]'
import AdminSettingsPage from './pages/admin/settings/index'
import AdminDashboardProxy from './pages/admin/AdminDashboardProxy'
import AdminPropertyTypesPage from './pages/admin/properties/types'
import AdminPropertiesPageWithType from './pages/admin/properties/withType'
import AdminPropertyPage from './pages/admin/properties/[id]'
import AdminClientTypesPage from './pages/admin/clients/types'
import AdminClientsPageWithType from './pages/admin/clients/withType'
import AdminClientPage from './pages/admin/clients/[id]'
import AdminProspectsPage from './pages/admin/prospects/types'
import AdminProspectDetailPage from './pages/admin/prospects/[id]'
import AdminContactsPage from './pages/admin/contacts/types'
import AdminContactDetailPage from './pages/admin/contacts/[id]'
import AdminRegisterPage from './pages/admin/register/index'
import AdminContractsPage from './pages/admin/contracts/types'
import AdminContractDetailPage from './pages/admin/contracts/[id]'
import AdminAutomatorPage from './pages/admin/automator/index'

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()
  const isAuthRoute = location.pathname.startsWith('/auth')
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <AnimatePresence mode="wait">
      {isAuthRoute ? (
        <Routes location={location} key={location.pathname}>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      ) : isAdminRoute ? (
        <AdminLayout>
          <Routes location={location} key={location.pathname}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboardProxy />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
            <Route path="/admin/clients" element={<AdminClientTypesPage />} />
            <Route path="/admin/clients/type/:type" element={<AdminClientsPageWithType />} />
            <Route path="/admin/clients/:id" element={<AdminClientPage />} />
            <Route path="/admin/contacts" element={<AdminContactsPage />} />
            <Route path="/admin/contacts/:id" element={<AdminContactDetailPage />} />
            <Route path="/admin/prospects" element={<AdminProspectsPage />} />
            <Route path="/admin/prospects/:id" element={<AdminProspectDetailPage />} />
            <Route path="/admin/properties" element={<AdminPropertyTypesPage />} />
            <Route path="/admin/properties/type/:type" element={<AdminPropertiesPageWithType />} />
            <Route path="/admin/properties/:id" element={<AdminPropertyPage />} />
            <Route path="/admin/properties/add" element={<AddPropertyForm />} />
            <Route path="/admin/register" element={<AdminRegisterPage />} />
            <Route path="/admin/contracts" element={<AdminContractsPage />} />
            <Route path="/admin/contracts/:id" element={<AdminContractDetailPage />} />
            <Route path="/admin/extranet" element={<ExtranetPage />} />
            <Route path="/admin/automator" element={<AdminAutomatorPage />} />
            <Route path="/admin/pret" element={<PretPage />} />
            <Route path="/admin/calendar" element={<CalendarPage />} />
            <Route path="/admin/documents" element={<DocumentsPage />} />
            <Route path="/admin/documents/:id" element={<DocumentDetailPage />} />
            <Route path="/admin/messages" element={<MessagesPage />} />
            <Route path="/admin/messages/compose" element={<ComposeMessagePage />} />
            <Route path="/admin/messages/templates" element={<MessagesTemplatesPage />} />
            <Route path="/admin/messages/settings" element={<MessagesSettingsPage />} />
            <Route path="/admin/messages/:id" element={<MessageDetailPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/admin/settings/compte/profil" element={<ProfileSettingsPage />} />
            <Route path="/admin/settings/compte/securite" element={<SecuritySettingsPage />} />
            <Route path="/admin/settings/compte/preferences" element={<PreferencesSettingsPage />} />
            <Route path="/admin/settings/communication/signature" element={<SignatureSettingsPage />} />
            <Route path="/admin/settings/communication/reponses-automatiques" element={<AutoReplySettingsPage />} />
            <Route path="/admin/settings/notifications" element={<NotificationSettingsPage />} />
            <Route path="/admin/settings/integrations" element={<IntegrationsSettingsPage />} />
            <Route path="/admin/settings/equipe" element={<TeamSettingsPage />} />
            <Route path="/admin/settings/donnees" element={<DataSettingsPage />} />
            <Route path="/admin/settings/aide" element={<HelpSettingsPage />} />
            <Route path="*" element={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-4xl font-semibold text-text-secondary/30">404</p>
                  <p className="text-text-secondary mt-2">Page non trouvée</p>
                </div>
              </div>
            } />
          </Routes>
        </AdminLayout>
      ) : (
        <MainLayout>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<ClientTypesPage />} />
            <Route path="/clients/type/:type" element={<ClientsPageWithType />} />
            <Route path="/clients/:id" element={<ClientPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/contacts/:id" element={<ContactPage />} />
            <Route path="/prospects" element={<ProspectsPage />} />
            <Route path="/prospects/:id" element={<ProspectPage />} />
            <Route path="/properties" element={<PropertyTypesPage />} />
            <Route path="/properties/type/:type" element={<PropertiesPageWithType />} />
            <Route path="/properties/:id" element={<PropertyPage />} />
            <Route path="/properties/add" element={<AddPropertyForm />} />
            <Route path="/register" element={<TransactionRegisterPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/contracts/:id" element={<ContractDetailPage />} />
            <Route path="/extranet" element={<AgentExtranetPage />} />
            <Route path="/automator" element={<AutomatorPage />} />
            <Route path="/pret" element={<PretPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/documents/:id" element={<DocumentDetailPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/compose" element={<ComposeMessagePage />} />
            <Route path="/messages/templates" element={<MessagesTemplatesPage />} />
            <Route path="/messages/settings" element={<MessagesSettingsPage />} />
            <Route path="/messages/:id" element={<MessageDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/compte/profil" element={<ProfileSettingsPage />} />
            <Route path="/settings/compte/securite" element={<SecuritySettingsPage />} />
            <Route path="/settings/compte/preferences" element={<PreferencesSettingsPage />} />
            <Route path="/settings/communication/signature" element={<SignatureSettingsPage />} />
            <Route path="/settings/communication/reponses-automatiques" element={<AutoReplySettingsPage />} />
            <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
            <Route path="/settings/integrations" element={<IntegrationsSettingsPage />} />
            <Route path="/settings/equipe" element={<TeamSettingsPage />} />
            <Route path="/settings/donnees" element={<DataSettingsPage />} />
            <Route path="/settings/aide" element={<HelpSettingsPage />} />
            <Route path="*" element={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-4xl font-semibold text-text-secondary/30">404</p>
                  <p className="text-text-secondary mt-2">Page non trouvée</p>
                </div>
              </div>
            } />
          </Routes>
        </MainLayout>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}
