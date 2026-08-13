import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { BackLink } from '../../../components/ui/BackLink'
import { useToast } from '../../../components/ui/Toast'
import { getAuthToken } from '../../../utils/auth'
import { User, Camera, Shield, Sun, Loader, Edit } from 'react-feather'

const agencies = [
  { value: 'm2', label: 'M2 Square Meter' }
]

export default function ProfilSettingsPage() {
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
        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
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
            position: position && !staleDefaults.includes(position) ? position : roleDefault
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
      const res = await fetch('http://localhost:5000/api/admin/profile/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
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
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: prenom,
          lastName: nom,
          email,
          phone: telephone,
          position: poste,
        })
      })
      if (res.ok) {
        setOriginalData({
          first_name: prenom,
          last_name: nom,
          email,
          phone: telephone,
          position: poste
        })
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

  const location = useLocation()
  const basePath = location.pathname.substring(0, location.pathname.lastIndexOf('/'))
  const compteTabs = [
    { label: 'Profil', icon: User, to: `${basePath}/profil` },
    { label: 'Sécurité', icon: Shield, to: `${basePath}/securite` },
    { label: 'Préférences', icon: Sun, to: `${basePath}/preferences` },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size={32} className="animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackLink />
      <div className="flex gap-1 p-1 rounded-lg bg-background border border-border/50 w-fit">
        {compteTabs.map((tab) => {
          const TabIcon = tab.icon
          const isActive = location.pathname === tab.to
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isActive
                  ? 'bg-card text-text shadow-sm'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <TabIcon size={15} />
              {tab.label}
            </NavLink>
          )
        })}
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-accent-light flex items-center justify-center overflow-hidden">
                {profileImage ? (
                  <img src={`http://localhost:5000${profileImage}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-accent" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-background transition-colors disabled:opacity-50"
              >
                {uploadingImage ? <Loader size={10} className="animate-spin" /> : <Camera size={12} className="text-text-secondary" />}
              </button>
            </div>
            {uploadError && (
              <p className="text-xs text-error text-center max-w-[200px]">{uploadError}</p>
            )}
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
              {uploadingImage ? 'Chargement...' : 'Changer la photo'}
            </Button>
          </div>

          <div className="flex-1 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Prénom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                disabled={!editing}
              />
              <Input
                label="Nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                disabled={!editing}
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!editing}
              />
              <Input
                label="Téléphone"
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                disabled={!editing}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-5">Informations professionnelles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Poste"
            value={poste}
            onChange={(e) => setPoste(e.target.value)}
            disabled={!editing}
          />
          <Select
            label="Agence"
            options={agencies}
            value={agence}
            onValueChange={setAgence}
            disabled
          />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        {editing ? (
          <>
            <Button variant="outline" onClick={handleCancel}>Annuler</Button>
            <Button variant="default" onClick={handleSave} loading={saving}>Enregistrer</Button>
          </>
        ) : (
          <Button variant="default" onClick={() => setEditing(true)}>
            <Edit size={14} className="mr-1.5" />
            Modifier
          </Button>
        )}
      </div>
    </div>
  )
}
