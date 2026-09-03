import { API_ORIGIN } from '../../../utils/config'
import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../../../components/ui/Toast'
import { getAuthToken } from '../../../utils/auth'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { User, Camera, Shield, Sun, Loader, Edit, ArrowLeft, Save, X } from 'react-feather'
import { motion } from 'framer-motion'
import {
  Stage,
  StageBadge,
  StageButton,
  OrbIcon,
  TiltCard,
  STAGE_HUES,
  useStageTheme,
} from '../../../components/dashboard/Stage'

const agencies = [{ value: 'm2', label: 'M2 Square Meter' }]

function CompteTabs({ basePath }: { basePath: string }) {
  const location = useLocation()
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const tabs = [
    { label: 'Profil', icon: User, to: `${basePath}/profil` },
    { label: 'Sécurité', icon: Shield, to: `${basePath}/securite` },
    { label: 'Préférences', icon: Sun, to: `${basePath}/preferences` },
  ]
  return (
    <div className="stage-glass flex gap-1 p-1 w-fit rounded-2xl">
      {tabs.map(tab => {
        const TabIcon = tab.icon
        const isActive = location.pathname === tab.to
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={`relative flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
              isActive ? 'text-white' : isDark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-teal-900'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="compte-tab-pill"
                className="absolute inset-0 rounded-xl border border-white/20"
                style={{
                  backgroundImage: isDark
                    ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)'
                    : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)',
                  boxShadow: isDark
                    ? 'inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 20px -6px rgba(124,92,255,0.6)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 20px -8px rgba(13,148,136,0.55)',
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <TabIcon size={14} className="relative z-10" />
            <span className="relative z-10">{tab.label}</span>
          </NavLink>
        )
      })}
    </div>
  )
}

export default function ProfilSettingsPage() {
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.substring(0, location.pathname.lastIndexOf('/'))
  const [loading, setLoading] = useState(true)
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [poste, setPoste] = useState('Agent immobilier')
  const [agence, setAgence] = useState('m2')
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [profileImage, setProfileImage] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [editing, setEditing] = useState(false)
  const { toast } = useToast()
  const [originalData, setOriginalData] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const token = getAuthToken()
      if (!token) { setLoading(false); return }
      try {
        const res = await fetch(`${API_ORIGIN}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          setPrenom(data.first_name || '')
          setNom(data.last_name || '')
          setEmail(data.email || '')
          setTelephone(data.phone || '')
          setProfileImage(data.profile_image || '')
          const roleDefault = data.role === 'admin' ? 'Admin' : 'Agent immobilier'
          const staleDefaults = ['Admin', 'Agent immobilier', 'Agent commercial']
          const position = data.position
          setPoste(position && !staleDefaults.includes(position) ? position : roleDefault)
          setUserId(data.id)
          setOriginalData({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || '',
            phone: data.phone || '',
            position: position && !staleDefaults.includes(position) ? position : roleDefault,
          })
        }
      } catch (_) {}
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setUploadError('')
    const formData = new FormData()
    formData.append('image', file)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_ORIGIN}/api/admin/profile/upload-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        setProfileImage(data.profile_image)
        window.dispatchEvent(new CustomEvent('profileImageUpdated'))
      } else {
        const data = await res.json().catch(() => ({}))
        setUploadError(data.error || 'Erreur lors du téléchargement')
      }
    } catch (_) {
      setUploadError('Erreur réseau lors du téléchargement')
    }
    setUploadingImage(false)
  }

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_ORIGIN}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ firstName: prenom, lastName: nom, email, phone: telephone, position: poste }),
      })
      if (res.ok) {
        setOriginalData({ first_name: prenom, last_name: nom, email, phone: telephone, position: poste })
        setEditing(false)
        toast('success', 'Profil mis à jour avec succès')
      } else {
        const data = await res.json().catch(() => ({}))
        toast('error', data.error || 'Erreur lors de la mise à jour du profil')
      }
    } catch (_) {
      toast('error', 'Erreur réseau lors de la mise à jour du profil')
    }
    setSaving(false)
  }

  const handleCancel = () => {
    setPrenom(originalData.first_name || '')
    setNom(originalData.last_name || '')
    setEmail(originalData.email || '')
    setTelephone(originalData.phone || '')
    setPoste(originalData.position || 'Agent immobilier')
    setAgence('m2')
    setEditing(false)
  }

  if (loading) {
    return (
      <Stage theme={theme}>
        <div className="flex items-center justify-center min-h-[400px]">
          <motion.div className="h-10 w-10 rounded-full border-[3px] border-violet-400/30 border-t-violet-400 animate-spin" style={{ filter: 'drop-shadow(0 0 14px rgba(139,124,255,0.6))' }} />
        </div>
      </Stage>
    )
  }

  return (
    <Stage theme={theme}>
      <div className="space-y-6">
        {/* Top bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
              isDark ? 'border-white/10 text-slate-300 hover:bg-white/5 hover:text-white' : 'border-teal-900/10 text-slate-600 hover:bg-white hover:text-teal-900'
            }`}
          >
            <ArrowLeft size={13} /> Retour
          </button>
          <CompteTabs basePath={basePath} />
        </div>

        {/* Hero */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              </span>
              <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Mon compte · Profil</p>
            </div>
            <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>
              Profil
            </h1>
            <p className={`mt-0.5 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>Gérez vos informations personnelles et professionnelles</p>
          </div>
          {editing ? (
            <div className="flex gap-2">
              <StageButton variant="glass" icon={<X size={14} />} onClick={handleCancel}>Annuler</StageButton>
              <StageButton variant="primary" icon={<Save size={14} />} onClick={handleSave}>{saving ? 'Enregistrement...' : 'Enregistrer'}</StageButton>
            </div>
          ) : (
            <StageButton variant="primary" icon={<Edit size={14} />} onClick={() => setEditing(true)}>Modifier</StageButton>
          )}
        </div>

        {/* Profile card */}
        <div className="stage-glass p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {/* holo ring */}
                <div className="absolute -inset-1 rounded-full holo-spin opacity-60" style={{ padding: 2 }} />
                <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-2 relative z-10 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-teal-900/10'}`} style={{ boxShadow: isDark ? '0 12px 30px -12px rgba(139,124,255,0.6)' : '0 12px 30px -14px rgba(13,148,136,0.4)' }}>
                  {profileImage ? (
                    <img src={`${API_ORIGIN}${profileImage}`} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className={isDark ? 'text-violet-300' : 'text-teal-700'} />
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleImageUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border flex items-center justify-center shadow-sm transition-colors z-20 disabled:opacity-50 ${isDark ? 'bg-[#1A1F3A] border-white/10 text-slate-300 hover:bg-white/10' : 'bg-white border-teal-900/10 text-slate-600 hover:bg-teal-50'}`}
                >
                  {uploadingImage ? <Loader size={12} className="animate-spin" /> : <Camera size={12} />}
                </button>
              </div>
              {uploadError && <p className="text-xs text-rose-400 text-center max-w-[200px]">{uploadError}</p>}
              <StageButton variant="glass" size="sm" onClick={() => fileInputRef.current?.click()}>{uploadingImage ? 'Chargement...' : 'Changer la photo'}</StageButton>
              <StageBadge variant="ok" className="text-[10px]">{poste}</StageBadge>
            </div>

            <div className="flex-1 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} disabled={!editing} />
                <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} disabled={!editing} />
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!editing} />
                <Input label="Téléphone" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} disabled={!editing} />
              </div>
            </div>
          </div>
        </div>

        <div className="stage-glass p-6">
          <div className="flex items-center gap-3 mb-5">
            <OrbIcon icon={User} hue={STAGE_HUES.sky} size={36} radius={11} />
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Informations professionnelles</h3>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Votre poste et votre agence de rattachement</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Poste" value={poste} onChange={(e) => setPoste(e.target.value)} disabled={!editing} />
            <Select label="Agence" options={agencies} value={agence} onValueChange={setAgence} disabled />
          </div>
        </div>
      </div>
    </Stage>
  )
}
