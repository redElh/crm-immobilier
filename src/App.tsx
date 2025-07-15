import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import Dashboard from './pages/Dashboard'
import ClientsPage from './pages/clients/index'
import ClientPage from './pages/clients/[id]' // Import your client page component

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
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/:id" element={<ClientPage />} />
              
              {/* Add other routes here */}
            </Routes>
          </motion.main>
        </div>
      </div>
    </Router>
  )
}

export default App