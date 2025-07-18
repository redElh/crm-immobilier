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
              {/*<Route path="/properties/add" element={<AddPropertyPage />} />
              /*<Route path="/properties/:id" element={<PropertyPage />} />
              /*<Route path="/properties/edit/:id" element={<EditPropertyPage />} />*/ }
            </Routes>
          </motion.main>
        </div>
      </div>
    </Router>
  )
}

export default App