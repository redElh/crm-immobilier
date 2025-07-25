import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import Dashboard from './pages/Dashboard'
import ClientsPageWithType from './pages/clients/withType'
import ClientPage from './pages/clients/[id]' // Import your client page component
import ClientTypesPage from './pages/clients/types'
import PropertyTypesPage from './pages/properties/types'
import PropertiesPageWithType from './pages/properties/withType'
import PropertyPage from './pages/properties/[id]' // Import your property page component
import AddPropertyForm from '../src/components/modules/properties/AddPropertyForm' // Import your add property page component
import DocumentsPage from './pages/documents/index'
import DocumentDetailPage from './pages/documents/[id]' // Import your document detail page component
import ComposeMessagePage from './pages/messages/compose'
import MessageDetailPage from './pages/messages/[id]' // Import your message detail page component
import MessagesPage from './pages/messages/index'
import SettingsPage from './pages/settings'
import NotificationSettingsPage from './pages/settings/notifications'
import ProfileSettingsPage from './pages/settings/profile'
import EditTemplatePage from './pages/messages/templates/[id]/edit'
import NewTemplatePage from './pages/messages/templates/new'

function App() {
  return (
    <Router>
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
            <Routes>
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
              {/*
              /*<Route path="/properties/edit/:id" element={<EditPropertyPage />} />*/ }

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
              <Route path="/settings" element={<SettingsPage/>}/>
              <Route path="/settings/notifications" element={<NotificationSettingsPage/>} />
              <Route path="/settings/profile" element={<ProfileSettingsPage />} />
              {/* Add more routes as needed */}

            </Routes>
          </motion.main>
        </div>
      </div>
    </Router>
  )
}

export default App