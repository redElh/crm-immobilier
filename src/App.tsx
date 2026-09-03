import { API_ORIGIN } from './utils/config'
import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { ToastProvider, useToast } from './components/ui/Toast'
import { NotificationProvider } from './contexts/NotificationContext'
import { AutomatorProvider } from './contexts/AutomatorContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AnimatePresence } from 'framer-motion'
import { Loader } from 'react-feather'
import { AgentLayout } from './pages/agent/AgentLayout'
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
import LibrairiePage from './pages/library/index'
import CalendarPage from './pages/calendar/index'
import TransactionRegisterPage from './pages/register/index'
import ExtranetPage from './pages/extranet/index'
import AgentExtranetPage from './pages/extranet/agent'
import AutomatorPage from './pages/automator/index'
import PretPage from './pages/pret/index'
import ComposeMessagePage from './pages/messages/compose'
import MessageDetailPage from './pages/messages/[id]'
import MessagesPage from './pages/messages/index'
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
import ConfidentialitePage from './pages/settings/aide/confidentialite'
import ConditionsPage from './pages/settings/aide/conditions'
import LoginPage from './pages/auth/login'
import RegisterPage from './pages/auth/register'
import VerifyEmailPage from './pages/auth/verify-email'
import ForgotPasswordPage from './pages/auth/forgot-password'
import ResetPasswordPage from './pages/auth/reset-password'
import AdminLoginPage from './pages/auth/admin/login'
import AdminAuthRegisterPage from './pages/auth/admin/register'
import AdminForgotPasswordPage from './pages/auth/admin/forgot-password'
import AdminResetPasswordPage from './pages/auth/admin/reset-password'
import ContractsPage from './pages/contracts/index'
import ContractDetailPage from './pages/contracts/[id]'
import ConciergeriePage from './pages/conciergerie/index'
import ToolboxPage from './pages/toolbox/index'
import VacancesManagementPage from './pages/toolbox/vacances'

// Admin imports
import { AdminLayout } from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/dashboard/index'
import AdminUsersPage from './pages/admin/users/index'
import AdminUserDetailPage from './pages/admin/users/[id]'
import AdminUserDroitsPage from './pages/admin/users/droits'
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
import { getAuthToken } from './utils/auth'

function AdminRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    const check = async () => {
      let user = null
      try {
        const res = await fetch(`${API_ORIGIN}/api/auth/me`, { credentials: 'include' })
        if (res.ok) user = await res.json()
      } catch (_) {}

      if (!user) {
        const token = getAuthToken()
        if (token) {
          try {
            const res = await fetch(`${API_ORIGIN}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) user = await res.json()
          } catch (_) {}
        }
      }

      if (user && (user.role === 'admin' || user.role === 'gerant')) {
        navigate(`/admin/${user.id}`, { replace: true })
      } else {
        navigate('/auth/admin/login', { replace: true })
      }
    }
    check()
  }, [navigate])

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader size={32} className="animate-spin text-accent" />
    </div>
  )
}

function AgentRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    const check = async () => {
      let user = null
      try {
        const res = await fetch(`${API_ORIGIN}/api/auth/me`, { credentials: 'include' })
        if (res.ok) user = await res.json()
      } catch (_) {}

      if (!user) {
        const token = getAuthToken()
        if (token) {
          try {
            const res = await fetch(`${API_ORIGIN}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) user = await res.json()
          } catch (_) {}
        }
      }

      if (user && user.role === 'agent') {
        navigate(`/${user.id}`, { replace: true })
      } else if (user && (user.role === 'admin' || user.role === 'gerant')) {
        navigate(`/admin/${user.id}`, { replace: true })
      } else {
        navigate('/auth/login', { replace: true })
      }
    }
    check()
  }, [navigate])

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader size={32} className="animate-spin text-accent" />
    </div>
  )
}

function RedirectToAgent() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = getAuthToken()
    if (!token) { navigate('/auth/login', { replace: true }); return }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.id && payload.role === 'agent') {
        navigate(`/${payload.id}${location.pathname}${location.search}`, { replace: true })
      } else if (payload.id && (payload.role === 'admin' || payload.role === 'gerant')) {
        navigate(`/admin/${payload.id}${location.pathname}${location.search}`, { replace: true })
      } else {
        navigate('/auth/login', { replace: true })
      }
    } catch {
      navigate('/auth/login', { replace: true })
    }
  }, [navigate, location.pathname])

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader size={32} className="animate-spin text-accent" />
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()
  const { toast } = useToast()

  // Read OAuth token from URL hash synchronously before any children mount
  const hash = window.location.hash
  if (hash) {
    const hashParams = new URLSearchParams(hash.replace('#', ''))
    const token = hashParams.get('token')
    if (token) {
      sessionStorage.setItem('agentToken', token)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const provider = params.get('provider')

    if (params.get('oauth') === 'success') {
      const providerName = provider === 'google' ? 'Google' : provider === 'facebook' ? 'Facebook' : 'social'
      toast('success', `Connecté avec ${providerName} !`)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  const isAuthRoute = location.pathname.startsWith('/auth')
  const isPublicRoute = location.pathname === '/privacy' || location.pathname === '/terms'
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <AnimatePresence mode="wait">
      {isAuthRoute ? (
        <Routes location={location} key="auth">
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/admin/login" element={<AdminLoginPage />} />
          <Route path="/auth/admin/register" element={<AdminAuthRegisterPage />} />
          <Route path="/auth/admin/forgot-password" element={<AdminForgotPasswordPage />} />
          <Route path="/auth/admin/reset-password" element={<AdminResetPasswordPage />} />
        </Routes>
      ) : isPublicRoute ? (
        <div className="max-w-4xl mx-auto px-6 py-10" key="public">
          <Routes location={location} key={location.pathname}>
            <Route path="/privacy" element={<ConfidentialitePage />} />
            <Route path="/terms" element={<ConditionsPage />} />
          </Routes>
        </div>
      ) : isAdminRoute ? (
        <Routes location={location}>
          <Route path="/admin" element={<AdminRedirect />} />
          <Route path="/admin/:adminId" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/:adminId/dashboard" element={<AdminLayout><AdminDashboardProxy /></AdminLayout>} />
          <Route path="/admin/:adminId/users" element={<AdminLayout><AdminUsersPage /></AdminLayout>} />
          <Route path="/admin/:adminId/users/:id" element={<AdminLayout><AdminUserDetailPage /></AdminLayout>} />
          <Route path="/admin/:adminId/users/:id/droits" element={<AdminLayout><AdminUserDroitsPage /></AdminLayout>} />
          <Route path="/admin/:adminId/clients" element={<AdminLayout><AdminClientTypesPage /></AdminLayout>} />
          <Route path="/admin/:adminId/clients/type/:type" element={<AdminLayout><AdminClientsPageWithType /></AdminLayout>} />
          <Route path="/admin/:adminId/clients/type/:type/:id" element={<AdminLayout><AdminClientPage /></AdminLayout>} />
          <Route path="/admin/:adminId/clients/:id" element={<AdminLayout><AdminClientPage /></AdminLayout>} />
          <Route path="/admin/:adminId/contacts" element={<AdminLayout><AdminContactsPage /></AdminLayout>} />
          <Route path="/admin/:adminId/contacts/:id" element={<AdminLayout><AdminContactDetailPage /></AdminLayout>} />
          <Route path="/admin/:adminId/prospects" element={<AdminLayout><AdminProspectsPage /></AdminLayout>} />
          <Route path="/admin/:adminId/prospects/:id" element={<AdminLayout><AdminProspectDetailPage /></AdminLayout>} />
          <Route path="/admin/:adminId/properties" element={<AdminLayout><AdminPropertyTypesPage /></AdminLayout>} />
          <Route path="/admin/:adminId/properties/type/:type" element={<AdminLayout><AdminPropertiesPageWithType /></AdminLayout>} />
          <Route path="/admin/:adminId/properties/type/:type/add" element={<AdminLayout><AddPropertyForm /></AdminLayout>} />
          <Route path="/admin/:adminId/properties/type/:type/edit/:id" element={<AdminLayout><AddPropertyForm /></AdminLayout>} />
          <Route path="/admin/:adminId/properties/type/:type/:id" element={<AdminLayout><AdminPropertyPage /></AdminLayout>} />
          <Route path="/admin/:adminId/properties/:id" element={<AdminLayout><AdminPropertyPage /></AdminLayout>} />
          <Route path="/admin/:adminId/properties/add" element={<AdminLayout><AddPropertyForm /></AdminLayout>} />
          <Route path="/admin/:adminId/register" element={<AdminLayout><AdminRegisterPage /></AdminLayout>} />
          <Route path="/admin/:adminId/contracts" element={<AdminLayout><AdminContractsPage /></AdminLayout>} />
          <Route path="/admin/:adminId/contracts/:id" element={<AdminLayout><AdminContractDetailPage /></AdminLayout>} />
          <Route path="/admin/:adminId/extranet" element={<AdminLayout><ExtranetPage /></AdminLayout>} />
          <Route path="/admin/:adminId/automator" element={<AdminLayout><AdminAutomatorPage /></AdminLayout>} />
          <Route path="/admin/:adminId/pret" element={<AdminLayout><PretPage /></AdminLayout>} />
          <Route path="/admin/:adminId/calendar" element={<AdminLayout><CalendarPage /></AdminLayout>} />
          <Route path="/admin/:adminId/documents" element={<AdminLayout><DocumentsPage /></AdminLayout>} />
          <Route path="/admin/:adminId/documents/:id" element={<AdminLayout><DocumentDetailPage /></AdminLayout>} />
          <Route path="/admin/:adminId/library" element={<AdminLayout><LibrairiePage /></AdminLayout>} />
          <Route path="/admin/:adminId/messages" element={<AdminLayout><MessagesPage /></AdminLayout>} />
          <Route path="/admin/:adminId/messages/compose" element={<AdminLayout><ComposeMessagePage /></AdminLayout>} />
          <Route path="/admin/:adminId/messages/settings" element={<AdminLayout><MessagesSettingsPage /></AdminLayout>} />
          <Route path="/admin/:adminId/messages/:id" element={<AdminLayout><MessageDetailPage /></AdminLayout>} />
          <Route path="/admin/:adminId/conciergerie" element={<AdminLayout><ConciergeriePage /></AdminLayout>} />
          <Route path="/admin/:adminId/toolbox" element={<AdminLayout><ToolboxPage /></AdminLayout>} />
          <Route path="/admin/:adminId/toolbox/vacances" element={<AdminLayout><VacancesManagementPage /></AdminLayout>} />
          <Route path="/admin/:adminId/settings" element={<AdminLayout><AdminSettingsPage /></AdminLayout>} />
          <Route path="/admin/:adminId/settings/compte/profil" element={<AdminLayout><ProfileSettingsPage /></AdminLayout>} />
          <Route path="/admin/:adminId/settings/compte/securite" element={<AdminLayout><SecuritySettingsPage /></AdminLayout>} />
          <Route path="/admin/:adminId/settings/compte/preferences" element={<AdminLayout><PreferencesSettingsPage /></AdminLayout>} />
          <Route path="/admin/:adminId/settings/communication/signature" element={<AdminLayout><SignatureSettingsPage /></AdminLayout>} />
          <Route path="/admin/:adminId/settings/communication/reponses-automatiques" element={<AdminLayout><AutoReplySettingsPage /></AdminLayout>} />
          <Route path="/admin/:adminId/settings/notifications" element={<AdminLayout><NotificationSettingsPage /></AdminLayout>} />
          <Route path="/admin/:adminId/settings/integrations" element={<AdminLayout><IntegrationsSettingsPage /></AdminLayout>} />
          <Route path="/admin/:adminId/settings/equipe" element={<AdminLayout><TeamSettingsPage /></AdminLayout>} />
          <Route path="/admin/:adminId/settings/donnees" element={<AdminLayout><DataSettingsPage /></AdminLayout>} />
          <Route path="/admin/:adminId/settings/aide" element={<AdminLayout><HelpSettingsPage /></AdminLayout>} />
          <Route path="/admin/:adminId/settings/privacy" element={<AdminLayout><ConfidentialitePage /></AdminLayout>} />
          <Route path="/admin/:adminId/settings/terms" element={<AdminLayout><ConditionsPage /></AdminLayout>} />
          <Route path="*" element={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-4xl font-semibold text-text-secondary/30">404</p>
                <p className="text-text-secondary mt-2">Page non trouvée</p>
              </div>
            </div>
          } />
        </Routes>
      ) : (
        <Routes location={location} key="app">
          <Route path="/" element={<AgentRedirect />} />
          {/* Legacy flat-route redirects — old navigate() calls still work */}
          <Route path="/clients" element={<RedirectToAgent />} />
          <Route path="/clients/type/:type" element={<RedirectToAgent />} />
          <Route path="/clients/:id" element={<RedirectToAgent />} />
          <Route path="/contacts" element={<RedirectToAgent />} />
          <Route path="/contacts/:id" element={<RedirectToAgent />} />
          <Route path="/prospects" element={<RedirectToAgent />} />
          <Route path="/prospects/:id" element={<RedirectToAgent />} />
          <Route path="/properties" element={<RedirectToAgent />} />
          <Route path="/properties/type/:type" element={<RedirectToAgent />} />
          <Route path="/properties/:id" element={<RedirectToAgent />} />
          <Route path="/properties/type/:type/add" element={<RedirectToAgent />} />
          <Route path="/properties/type/:type/edit/:id" element={<RedirectToAgent />} />
          <Route path="/properties/add" element={<RedirectToAgent />} />
          <Route path="/register" element={<RedirectToAgent />} />
          <Route path="/contracts" element={<RedirectToAgent />} />
          <Route path="/contracts/:id" element={<RedirectToAgent />} />
          <Route path="/extranet" element={<RedirectToAgent />} />
          <Route path="/automator" element={<RedirectToAgent />} />
          <Route path="/pret" element={<RedirectToAgent />} />
          <Route path="/calendar" element={<RedirectToAgent />} />
          <Route path="/documents" element={<RedirectToAgent />} />
          <Route path="/documents/:id" element={<RedirectToAgent />} />
          <Route path="/library" element={<RedirectToAgent />} />
          <Route path="/messages" element={<RedirectToAgent />} />
          <Route path="/messages/compose" element={<RedirectToAgent />} />
          <Route path="/messages/settings" element={<RedirectToAgent />} />
          <Route path="/messages/:id" element={<RedirectToAgent />} />
          <Route path="/conciergerie" element={<RedirectToAgent />} />
          <Route path="/toolbox" element={<RedirectToAgent />} />
          <Route path="/toolbox/vacances" element={<RedirectToAgent />} />
          <Route path="/settings" element={<RedirectToAgent />} />
          <Route path="/settings/compte/profil" element={<RedirectToAgent />} />
          <Route path="/settings/compte/securite" element={<RedirectToAgent />} />
          <Route path="/settings/compte/preferences" element={<RedirectToAgent />} />
          <Route path="/settings/communication/signature" element={<RedirectToAgent />} />
          <Route path="/settings/communication/reponses-automatiques" element={<RedirectToAgent />} />
          <Route path="/settings/notifications" element={<RedirectToAgent />} />
          <Route path="/settings/integrations" element={<RedirectToAgent />} />
          <Route path="/settings/equipe" element={<RedirectToAgent />} />
          <Route path="/settings/donnees" element={<RedirectToAgent />} />
          <Route path="/settings/aide" element={<RedirectToAgent />} />
          <Route path="/settings/privacy" element={<RedirectToAgent />} />
          <Route path="/settings/terms" element={<RedirectToAgent />} />
          {/* New ID-prefixed routes — one persistent agent shell */}
          <Route path="/:agentId" element={<AgentLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<ClientTypesPage />} />
            <Route path="clients/type/:type" element={<ClientsPageWithType />} />
            <Route path="clients/type/:type/:id" element={<ClientPage />} />
            <Route path="clients/:id" element={<ClientPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="contacts/:id" element={<ContactPage />} />
            <Route path="prospects" element={<ProspectsPage />} />
            <Route path="prospects/:id" element={<ProspectPage />} />
            <Route path="properties" element={<PropertyTypesPage />} />
            <Route path="properties/type/:type" element={<PropertiesPageWithType />} />
            <Route path="properties/type/:type/add" element={<AddPropertyForm />} />
            <Route path="properties/type/:type/edit/:id" element={<AddPropertyForm />} />
            <Route path="properties/type/:type/:id" element={<PropertyPage />} />
            <Route path="properties/:id" element={<PropertyPage />} />
            <Route path="properties/add" element={<AddPropertyForm />} />
            <Route path="register" element={<TransactionRegisterPage />} />
            <Route path="contracts" element={<ContractsPage />} />
            <Route path="contracts/:id" element={<ContractDetailPage />} />
            <Route path="extranet" element={<AgentExtranetPage />} />
            <Route path="automator" element={<AutomatorPage />} />
            <Route path="pret" element={<PretPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="documents/:id" element={<DocumentDetailPage />} />
            <Route path="library" element={<LibrairiePage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="messages/compose" element={<ComposeMessagePage />} />
            <Route path="messages/settings" element={<MessagesSettingsPage />} />
            <Route path="messages/:id" element={<MessageDetailPage />} />
            <Route path="conciergerie" element={<ConciergeriePage />} />
            <Route path="toolbox" element={<ToolboxPage />} />
            <Route path="toolbox/vacances" element={<VacancesManagementPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/compte/profil" element={<ProfileSettingsPage />} />
            <Route path="settings/compte/securite" element={<SecuritySettingsPage />} />
            <Route path="settings/compte/preferences" element={<PreferencesSettingsPage />} />
            <Route path="settings/communication/signature" element={<SignatureSettingsPage />} />
            <Route path="settings/communication/reponses-automatiques" element={<AutoReplySettingsPage />} />
            <Route path="settings/notifications" element={<NotificationSettingsPage />} />
            <Route path="settings/integrations" element={<IntegrationsSettingsPage />} />
            <Route path="settings/equipe" element={<TeamSettingsPage />} />
            <Route path="settings/donnees" element={<DataSettingsPage />} />
            <Route path="settings/aide" element={<HelpSettingsPage />} />
            <Route path="settings/privacy" element={<ConfidentialitePage />} />
            <Route path="settings/terms" element={<ConditionsPage />} />
            <Route path="*" element={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-4xl font-semibold text-text-secondary/30">404</p>
                  <p className="text-text-secondary mt-2">Page non trouvée</p>
                </div>
              </div>
            } />
          </Route>
          <Route path="*" element={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-4xl font-semibold text-text-secondary/30">404</p>
                <p className="text-text-secondary mt-2">Page non trouvée</p>
              </div>
            </div>
          } />
        </Routes>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <NotificationProvider>
            <AutomatorProvider>
              <AppRoutes />
            </AutomatorProvider>
          </NotificationProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  )
}
