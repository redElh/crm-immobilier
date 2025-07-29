import { Button } from '../ui/Button'
import { motion } from 'framer-motion'

export function SocialAuthButtons() {
  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      <div className="mt-6 grid grid-cols-2 gap-3">
        {/* Google Button */}
        <Button 
          variant="outline" 
          className="w-full hover:bg-gray-50 transition-colors"
          onClick={() => {
            // Handle Google login
            window.location.href = '/auth/google' // or your Google auth endpoint
          }}
        >
          <img 
            src="/images/google-logo.png" 
            alt="Google logo" 
            className="h-5 w-5"
          />
          <span className="ml-2">Google</span>
        </Button>

        {/* Facebook Button */}
        <Button 
          variant="outline" 
          className="w-full hover:bg-blue-50 transition-colors"
          onClick={() => {
            // Handle Facebook login
            window.location.href = '/auth/facebook' // or your Facebook auth endpoint
          }}
        >
          <img 
            src="/images/facebook-logo.png" 
            alt="Facebook logo" 
            className="h-5 w-5"
          />
          <span className="ml-2">Facebook</span>
        </Button>
      </div>
    </motion.div>
  )
}