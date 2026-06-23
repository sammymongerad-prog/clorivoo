import { signIn } from '@/lib/auth/actions';

const ERROR_MESSAGES: Record<string, string> = {
  identifiants_invalides: 'Email ou mot de passe incorrect.',
  compte_suspendu: 'Votre compte a été suspendu. Contactez JJ\'s IMEX au +1 (305) 600-9364.',
  acces_refuse: 'Accès refusé. Ce portail est réservé aux administrateurs.',
  acces_non_autorise: 'Accès refusé. Ce portail est réservé aux administrateurs.',
  compte_bloque: 'Votre compte a été bloqué. Contactez JJ\'s IMEX au +1 (305) 600-9364.',
  profil_introuvable: 'Profil introuvable. Contactez le support.',
  erreur_connexion: 'Une erreur est survenue. Réessayez.',
};

interface Props {
  searchParams: { error?: string };
}

export default function LoginPage({ searchParams }: Props) {
  const error = searchParams.error;
  const errorMsg = error ? ERROR_MESSAGES[error] : null;

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-white">
            JJ&apos;s <span className="text-[#F97316]">IMEX</span>
          </h1>
          <p className="text-[#9CA3AF] text-sm mt-1">Portail administrateur</p>
        </div>

        {/* Card */}
        <div className="bg-[#1A1A1A] rounded-card border border-[#2A2A2A] p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Connexion</h2>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-input p-3 mb-5">
              <p className="text-red-400 text-sm">{errorMsg}</p>
            </div>
          )}

          <form action={signIn} className="space-y-4">
            <div>
              <label className="block text-sm text-[#9CA3AF] mb-1.5" htmlFor="email">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@jjsimex.com"
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-input px-3 py-2.5
                  text-sm text-white placeholder-[#4B5563]
                  focus:outline-none focus:border-[#F97316] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-[#9CA3AF] mb-1.5" htmlFor="password">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-input px-3 py-2.5
                  text-sm text-white placeholder-[#4B5563]
                  focus:outline-none focus:border-[#F97316] transition-colors"
              />
            </div>

            <div className="flex justify-end">
              <a href="/forgot-password" className="text-xs text-[#F97316] hover:underline">
                Mot de passe oublié ?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-[#F97316] hover:bg-[#ea6c0d] text-white font-semibold
                text-sm py-2.5 rounded-btn transition-colors duration-150"
            >
              Se connecter
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#4B5563] mt-6">
          © {new Date().getFullYear()} JJ&apos;s IMEX · Miami, FL
        </p>
      </div>
    </div>
  );
}
