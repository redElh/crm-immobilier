import { ReactNode } from 'react'
import { Icon } from '../ui/Icon'
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
    <div className="min-h-screen flex bg-white">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-8 lg:flex-none lg:px-16 xl:px-32">
        <div className="mx-auto w-full max-w-md lg:max-w-xl"> {/* Increased max width */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center lg:text-left"
          >
            <div className="flex items-center justify-center lg:justify-start space-x-6"> {/* Increased space */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="p-4 rounded-lg bg-gradient-to-br from-accent to-accent-dark shadow-lg flex-shrink-0"
              >
                <Icon name="home" className="h-10 w-10 text-white" size='lg'/> {/* Increased icon size */}
              </motion.div>
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900"> {/* Increased text size */}
                  {title}
                </h2>
                <p className="text-xl text-gray-500 mt-2">{subtitle}</p> {/* Increased text size and added margin-top */}
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12" 
          >
            {children}
          </motion.div>
        </div>
      </div>

      {/* Right side - Background image */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent z-10" />
        <motion.img
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 h-full w-full object-cover"
          src={backgroundImage}
          alt="Beautiful property"
        />
      </div>
    </div>
  )
}