import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import Dashboard from './pages/Dashboard'
import ClientsPageWithType from './pages/clients/withType'
import ClientPage from './pages/clients/[id]'
import ClientTypesPage from './pages/clients/types'
import PropertyTypesPage from './pages/properties/types'
import PropertiesPageWithType from './pages/properties/withType'
import PropertyPage from './pages/properties/[id]'
import AddPropertyForm from '../src/components/modules/properties/AddPropertyForm'
import DocumentsPage from './pages/documents/index'
import DocumentDetailPage from './pages/documents/[id]'
import ComposeMessagePage from './pages/messages/compose'
import MessageDetailPage from './pages/messages/[id]'
import MessagesPage from './pages/messages/index'
import SettingsPage from './pages/settings'
import NotificationSettingsPage from './pages/settings/notifications'
import ProfileSettingsPage from './pages/settings/profile'
import EditTemplatePage from './pages/messages/templates/[id]/edit'
import NewTemplatePage from './pages/messages/templates/new'
import LoginPage from './pages/auth/login'
import RegisterPage from './pages/auth/register'
import VerifyEmailPage from './pages/auth/verify-email'
import ForgotPasswordPage from './pages/auth/forgot-password'
import { AuthFormContainer } from '../src/components/auth/AuthFormContainer'

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto p-6 bg-background"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()
  const isAuthRoute = location.pathname.startsWith('/auth')

  return (
    <AnimatePresence mode="wait">
      {isAuthRoute ? (
        <Routes location={location} key={location.pathname}>
          {/* Authentication Routes */}
          <Route path="/auth/login" element={
            
              <LoginPage />
          
          } />
          <Route path="/auth/register" element={
         
              <RegisterPage />
           
          } />
          <Route path="/auth/verify-email" element={
           
              <VerifyEmailPage />
            
          } />
          <Route path="/auth/forgot-password" element={
       
              <ForgotPasswordPage />
           
          } />
        </Routes>
      ) : (
        <MainLayout>
          <Routes location={location} key={location.pathname}>
            {/* Main Application Routes */}
            <Route path="/" element={<Dashboard />} />
            
            {/* Clients Routes */}
            <Route path="/clients" element={<ClientTypesPage />} />
            <Route path="/clients/type/:type" element={<ClientsPageWithType />} />
            <Route path="/clients/:id" element={<ClientPage />} />
            
            {/* Properties Routes */}
            <Route path="/properties" element={<PropertyTypesPage />} />
            <Route path="/properties/type/:type" element={<PropertiesPageWithType />} />
            <Route path="/properties/:id" element={<PropertyPage />} />
            <Route path="/properties/add" element={<AddPropertyForm />} />
            
            {/* Documents Routes */}
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/documents/:id" element={<DocumentDetailPage />} />
            
            {/* Messages Routes */}
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/compose" element={<ComposeMessagePage />} />
            <Route path="/messages/:id" element={<MessageDetailPage />} />
            <Route path="/messages/templates/:id/edit" element={<EditTemplatePage />} />
            <Route path="/messages/templates/new" element={<NewTemplatePage />} />
            
            {/* Settings Routes */}
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
            <Route path="/settings/profile" element={<ProfileSettingsPage />} />
            
            {/* Catch-all route for 404 pages */}
            <Route path="*" element={<div>404 Not Found</div>} />
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