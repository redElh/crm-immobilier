import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthFormContainer } from '../../components/auth/AuthFormContainer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'agent', // Fixé à agent car seul l'admin peut créer des comptes
    is_active: true // Add this
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Effacer l'erreur lorsqu'on modifie le champ
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Veuillez entrer un email valide';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    } else if (!/^\+?[\d\s-]+$/.test(formData.phone)) {
      newErrors.phone = 'Veuillez entrer un numéro valide';
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          is_active: true // Explicitly include
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          // Convertir les erreurs du serveur en format { field: message }
          const serverErrors = data.errors.reduce((acc: Record<string, string>, error: { param: string; msg: string }) => {
            acc[error.param] = error.msg;
            return acc;
          }, {});
          setErrors(serverErrors);
        } else {
          setErrors({ form: data.error || 'Échec de l\'inscription' });
        }
        return;
      }

      // Afficher le message de succès
      setErrors({});
      alert(`Compte agent créé avec succès ! Un email avec les instructions de connexion a été envoyé à ${formData.email}`);

      // Réinitialiser le formulaire
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'agent',
        is_active: true // Add this
      });

    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      setErrors({ form: 'Une erreur inattendue est survenue. Veuillez réessayer.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormContainer
      title="Créer un compte agent"
      subtitle="Ajouter un nouvel agent à votre équipe"
      backgroundImage="/images/auth-bg.jpg"
    >
      {/* Affichage des erreurs */}
      {(errors.form || Object.keys(errors).length > 0) && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {errors.form ? 'Erreur' : 'Veuillez corriger les erreurs suivantes'}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {errors.form && <li>{errors.form}</li>}
                  {Object.entries(errors).map(([field, message]) => (
                    field !== 'form' && <li key={field}>{message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              icon="user"
            />
            <Input
              label="Nom"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              icon="user"
            />
          </div>

          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="agent@email.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            icon="mail"
          />

          <Input
            label="Téléphone"
            type="tel"
            name="phone"
            placeholder="+212 6 12 34 56 78"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            icon="phone"
          />

          <div>
            <Input
              label="Mot de passe"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              icon="lock"
            />
            <PasswordStrengthMeter password={formData.password} />
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            className="mt-0.5 h-3.5 w-3.5 text-accent rounded border-gray-300 focus:ring-accent"
          />
          <label htmlFor="terms" className="text-xs text-gray-500">
            Je confirme la création de ce compte agent
          </label>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full group relative"
            loading={isLoading}
          >
            <span className="relative z-10">Créer le compte agent</span>
            <span className="absolute inset-0 bg-gradient-to-r from-accent to-accent-dark rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </Button>
        </motion.div>

        <div className="text-center text-xs text-gray-500">
          <Link
            to="/auth/agents"
            className="font-medium text-accent hover:text-accent/80"
          >
            Retour à la liste des agents
          </Link>
        </div>
      </form>
    </AuthFormContainer>
  );
}