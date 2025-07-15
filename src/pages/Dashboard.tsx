import { motion } from 'framer-motion'
import Card from '../components/ui/Card'
import { BarChart2, Home, User, DollarSign } from 'react-feather'

export default function Dashboard() {
  const stats = [
    { icon: <Home size={24} />, title: 'Biens en stock', value: '24', change: '+12%' },
    { icon: <User size={24} />, title: 'Nouveaux clients', value: '18', change: '+5%' },
    { icon: <DollarSign size={24} />, title: 'Ventes ce mois', value: '€124,500', change: '+23%' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text">Tableau de bord</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <Card className="p-6 flex items-start space-x-4">
              <div className="p-3 rounded-lg bg-accent/10 text-accent">
                {stat.icon}
              </div>
              <div>
                <h3 className="text-text/70 text-sm">{stat.title}</h3>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-sm text-premium">{stat.change}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
      
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Activité récente</h2>
          <button className="text-sm text-accent hover:text-accent/70 transition-colors">
            Voir tout
          </button>
        </div>
        <div className="h-64 bg-white/5 rounded-lg flex items-center justify-center">
          <BarChart2 size={40} className="text-text/20" />
        </div>
      </Card>
    </div>
  )
}