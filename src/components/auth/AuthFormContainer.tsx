import { CSSProperties, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield } from 'react-feather'
import { GoldenSkyline } from './GoldenSkyline'

interface AuthFormContainerProps {
  title: string
  subtitle: string
  children: ReactNode
  backgroundImage?: string
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const authThemeStyle = {
  '--background': '157 56% 6%',
  '--card': '157 34% 11%',
  '--accent': '45 95% 64%',
  '--accent-hover': '45 95% 58%',
  '--accent-light': '157 36% 18%',
  '--text': '50 33% 96%',
  '--text-secondary': '52 14% 74%',
  '--border': '159 22% 23%',
  '--interactive': '45 92% 60%',
  '--premium': '45 88% 58%',
  '--error': '0 84% 65%',
  '--success': '162 75% 46%',
  '--button-bg': '160 64% 18%',
  '--button-bg-hover': '160 70% 22%',
  '--button-text': '45 95% 70%',
  '--button-border': '45 92% 58%',
  '--button-border-hover': '45 95% 66%'
} as CSSProperties & Record<string, string>

export function AuthFormContainer({
  title,
  subtitle,
  children,
  backgroundImage = '/CRM_Official_Image.jfif'
}: AuthFormContainerProps) {
  const location = useLocation()
  const themeClass = location.pathname.includes('/admin') ? 'admin-theme' : 'agent-theme'

  return (
    <div className={`auth-shell min-h-screen relative overflow-hidden ${themeClass}`} style={authThemeStyle as CSSProperties}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(248,217,116,0.18),_transparent_30%),radial-gradient(circle_at_78%_18%,_rgba(24,122,85,0.34),_transparent_26%),linear-gradient(135deg,_rgba(4,17,11,0.98)_0%,_rgba(6,35,24,0.96)_52%,_rgba(3,13,9,0.98)_100%)]" />
      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_82%)]" />
      <div className="absolute -top-24 left-[-8rem] h-[22rem] w-[22rem] rounded-full bg-premium/10 blur-3xl" />
      <div className="absolute bottom-[-10rem] right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-3xl" />

      <motion.img
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: EASE }}
        src={backgroundImage}
        alt=""
        className="pointer-events-none absolute right-0 top-0 hidden h-full w-[52%] object-cover object-center lg:block"
      />
      <div className="absolute inset-y-0 right-0 hidden w-[52%] bg-[linear-gradient(90deg,rgba(4,17,11,0)_0%,rgba(4,17,11,0.2)_16%,rgba(4,17,11,0.68)_68%,rgba(4,17,11,0.88)_100%)] lg:block" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1520px] flex-col px-5 py-5 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
        <div className="mb-6 flex items-center justify-end">
          <div className="hidden items-center gap-3 lg:flex">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-text-secondary backdrop-blur-xl">
              Accès sécurisé
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-premium/30 bg-premium/10 text-premium shadow-[0_0_0_1px_rgba(248,217,116,0.08)]">
              <Shield size={16} />
            </div>
          </div>
        </div>

        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)] xl:gap-12">
          <div className="flex items-center">
            <div className="w-full max-w-[620px]">
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.18 }}
                className="relative"
              >
                <div className="absolute -left-2 -top-2 h-24 w-24 rounded-[36px] border border-premium/40 bg-gradient-to-br from-premium/35 via-premium/10 to-transparent blur-[1px] animate-pulse-soft" />
                <div className="absolute -right-3 -bottom-5 h-24 w-24 rounded-[36px] border border-premium/35 bg-gradient-to-tl from-premium/35 via-premium/10 to-transparent blur-[1px] animate-pulse-soft" />
                <div className="absolute inset-x-10 -bottom-8 h-16 rounded-[32px] bg-premium/25 blur-3xl" />

                <div className="golden-border-animated relative overflow-hidden rounded-[38px] border border-premium/55 bg-[linear-gradient(135deg,rgba(255,238,176,0.16),rgba(7,31,22,0.9))] p-[1px] shadow-[0_36px_100px_rgba(0,0,0,0.44)]">
                  <div className="relative rounded-[37px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,34,25,0.68),rgba(7,18,14,0.92))] p-5 sm:p-6 lg:p-7 backdrop-blur-md">
                    <GoldenSkyline className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[62%] w-full opacity-60" />
                    <div className="relative z-10">
                      <div className="mb-6 rounded-[28px] border border-premium/45 bg-[linear-gradient(180deg,rgba(247,223,137,0.22),rgba(6,29,20,0.82))] px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.28)]">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-premium/35 bg-[linear-gradient(180deg,rgba(7,59,39,0.96),rgba(6,34,23,0.98))] shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
                            <div className="absolute inset-0 bg-gradient-to-br from-premium/30 via-transparent to-accent/10" />
                            <img src={backgroundImage} alt="CRM Immobilier" className="relative h-full w-full object-cover" />
                          </div>
                          <div>
                            <div className="text-base font-semibold tracking-tight text-text">CRM Immobilier</div>
                            <div className="text-[11px] uppercase tracking-[0.35em] text-text-secondary">Plateforme immobilière</div>
                          </div>
                        </div>
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: EASE, delay: 0.08 }}
                        className="mb-5"
                      >
                        <p className="mb-3 text-xs uppercase tracking-[0.45em] text-premium/80">Espace authentification</p>
                        <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl xl:text-4xl">
                          {title}
                        </h1>
                        <p className="mt-4 max-w-xl text-base leading-7 text-text-secondary sm:text-lg">
                          {subtitle}
                        </p>
                      </motion.div>

                      {children}
                    </div>
                  </div>

                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[38px]">
                    <div className="absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,241,184,0.9),transparent)]" />
                    <div className="absolute inset-x-14 top-0.5 h-[2px] rounded-full bg-[linear-gradient(90deg,transparent,rgba(255,241,184,0.4),transparent)] blur-[1px]" />
                    <div className="absolute inset-y-0 left-0 w-[38%] animate-golden-shine bg-[linear-gradient(105deg,transparent_0%,rgba(255,241,184,0.1)_40%,rgba(255,241,184,0.3)_50%,rgba(255,241,184,0.1)_60%,transparent_100%)]" />
                    <div className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-premium/20 blur-[70px] animate-golden-glow" />
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-x-10 -bottom-10 h-20 rounded-full bg-black/35 blur-3xl" />
                <div className="pointer-events-none absolute inset-x-16 -bottom-16 h-14 rounded-full bg-premium/10 blur-2xl" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
