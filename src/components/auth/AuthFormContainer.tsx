import { ReactNode } from 'react'
import { Home } from 'react-feather'
import { motion } from 'framer-motion'

interface AuthFormContainerProps {
  title: string
  subtitle: string
  children: ReactNode
  backgroundImage?: string
}

export function AuthFormContainer({
  title,
  subtitle,
  children,
  backgroundImage = '/images/auth-bg.jpg'
}: AuthFormContainerProps) {
  return (
    <div className="min-h-screen flex bg-background">
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-8 lg:flex-none lg:px-16 xl:px-32">
        <div className="mx-auto w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-sm">
                <Home size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">CRM Immobilier</h1>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
              <p className="text-text-secondary mt-1.5">{subtitle}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </div>

      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-l from-background via-background/60 to-transparent z-10" />
        <motion.img
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 h-full w-full object-cover"
          src={backgroundImage}
          alt=""
        />
      </div>
    </div>
  )
}
