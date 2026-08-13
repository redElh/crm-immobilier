import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthFormContainer } from '../../components/auth/AuthFormContainer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter';
import { User, Mail, Phone, Lock } from 'react-feather';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', role: 'agent', is_active: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!formData.email.trim()) newErrors.email = "L'email est requis";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis';
    else if (!/^\+?[\d\s-]+$/.test(formData.phone)) newErrors.phone = 'Numéro invalide';
    if (!formData.password) newErrors.password = 'Le mot de passe est requis';
    else if (formData.password.length < 8) newErrors.password = 'Minimum 8 caractères';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.errors) {
          const serverErrors = data.errors.reduce((acc: Record<string, string>, error: { param: string; msg: string }) => {
            acc[error.param] = error.msg;
            return acc;
          }, {});
          setErrors(serverErrors);
        } else setErrors({ form: data.error || "Échec de l'inscription" });
        return;
      }
      setErrors({});
      alert(`Compte agent créé avec succès ! Un email a été envoyé à ${formData.email}`);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'agent', is_active: true });
    } catch (error) {
      setErrors({ form: 'Une erreur inattendue est survenue.' });
    } finally { setIsLoading(false); }
  };

  return (
    <AuthFormContainer title="Créer un compte agent" subtitle="Ajouter un nouvel agent à votre équipe" backgroundImage="/CRM_Official_Image.jfif">
      {(errors.form || Object.keys(errors).length > 0) && (
        <div className="mb-4 p-3 bg-error/5 border border-error/20 rounded-lg">
          <p className="text-sm text-error font-medium">{errors.form || 'Veuillez corriger les erreurs'}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom" name="firstName" value={formData.firstName} onChange={handleChange} error={errors.firstName} icon={<User size={14} />} />
            <Input label="Nom" name="lastName" value={formData.lastName} onChange={handleChange} error={errors.lastName} icon={<User size={14} />} />
          </div>
          <Input label="Email" type="email" name="email" placeholder="agent@email.com" value={formData.email} onChange={handleChange} error={errors.email} icon={<Mail size={14} />} />
          <Input label="Téléphone" type="tel" name="phone" placeholder="+212 6 12 34 56 78" value={formData.phone} onChange={handleChange} error={errors.phone} icon={<Phone size={14} />} />
          <div>
            <Input label="Mot de passe" type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} error={errors.password} icon={<Lock size={14} />} />
            <PasswordStrengthMeter password={formData.password} />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded border-2 border-border text-accent focus:ring-accent/20" />
          <span className="text-xs text-text-secondary">Je confirme la création de ce compte agent</span>
        </label>

        <Button type="submit" variant="primary" className="w-full golden-border-animated" loading={isLoading}>
          Créer le compte agent
        </Button>

        <div className="text-center text-xs text-text-secondary">
          <Link to="/auth/agents" className="font-medium text-accent hover:text-accent-hover">Retour à la liste des agents</Link>
        </div>
      </form>
    </AuthFormContainer>
  );
}
