import { API_ORIGIN } from '../../../utils/config'
import { useState, useEffect, useRef } from 'react'
import { useToast } from '../../../components/ui/Toast'
import { getAuthToken } from '../../../utils/auth'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { User, Camera, Loader, Edit, Save, X } from 'react-feather'
import {
  StageBadge,
  StageButton,
  OrbIcon,
  STAGE_HUES,
  useStageTheme,
} from '../../../components/dashboard/Stage'
import {
  CompteSettingsTabs,
  SettingsBackButton,
  SettingsHero,
  useSettingsChrome,
} from '../../../components/settings/SettingsChrome'

const agencies = [{ value: 'm2', label: 'M2 Square Meter' }]

export default function ProfilSettingsPage() {
  const theme = useStageTheme()
  const { isDark, isAdmin, accent } = useSettingsChrome()
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
      
        <div className="flex items-center justify-center min-h-[400px]">
          <div
            className="h-10 w-10 animate-spin rounded-full border-[3px]"
            style={{
              borderColor: `${accent.a}45`,
              borderTopColor: accent.a,
              filter: `drop-shadow(0 0 14px ${accent.glow})`,
            }}
          />
        </div>
      
    )
  }

  return (
    
      <div className="space-y-6">
        {/* Top bar */}
        <div className="flex items-center gap-2">
          <SettingsBackButton />
          <CompteSettingsTabs />
        </div>

        <SettingsHero
          eyebrow="Mon compte · Profil"
          title="Profil"
          subtitle="Gérez vos informations personnelles et professionnelles"
          right={
            editing ? (
              <div className="flex gap-2">
                <StageButton variant="glass" icon={<X size={14} />} onClick={handleCancel}>Annuler</StageButton>
                <StageButton variant="primary" icon={<Save size={14} />} onClick={handleSave}>{saving ? 'Enregistrement...' : 'Enregistrer'}</StageButton>
              </div>
            ) : (
              <StageButton variant="primary" icon={<Edit size={14} />} onClick={() => setEditing(true)}>Modifier</StageButton>
            )
          }
        />

        {/* Profile card */}
        <div className="stage-glass p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {/* holo ring */}
                <div className="absolute -inset-1 rounded-full holo-spin opacity-60" style={{ padding: 2 }} />
                <div
                  className={`relative z-10 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 ${
                    isDark
                      ? 'border-white/10 bg-white/5'
                      : isAdmin
                        ? 'border-orange-900/10 bg-white'
                        : 'border-teal-900/10 bg-white'
                  }`}
                  style={{
                    boxShadow: isDark
                      ? isAdmin
                        ? '0 12px 30px -12px rgba(244,63,94,0.55)'
                        : '0 12px 30px -12px rgba(139,124,255,0.6)'
                      : isAdmin
                        ? '0 12px 30px -14px rgba(249,115,22,0.4)'
                        : '0 12px 30px -14px rgba(13,148,136,0.4)',
                  }}
                >
                  {profileImage ? (
                    <img src={`${API_ORIGIN}${profileImage}`} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User
                      size={32}
                      className={
                        isDark
                          ? isAdmin
                            ? 'text-rose-300'
                            : 'text-violet-300'
                          : isAdmin
                            ? 'text-orange-700'
                            : 'text-teal-700'
                      }
                    />
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleImageUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className={`absolute -bottom-1 -right-1 z-20 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition-colors disabled:opacity-50 ${
                    isDark
                      ? 'border-white/10 bg-[#1A1F3A] text-slate-300 hover:bg-white/10'
                      : isAdmin
                        ? 'border-orange-900/10 bg-white text-slate-600 hover:bg-orange-50'
                        : 'border-teal-900/10 bg-white text-slate-600 hover:bg-teal-50'
                  }`}
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
            <OrbIcon icon={User} hue={isAdmin ? accent : STAGE_HUES.sky} size={36} radius={11} />
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
    
  )
}
