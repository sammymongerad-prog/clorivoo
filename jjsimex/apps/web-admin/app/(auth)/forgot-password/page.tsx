import { resetPassword } from '@/lib/auth/actions';

interface Props {
  searchParams: { error?: string; success?: string };
}

export default function ForgotPasswordPage({ searchParams }: Props) {
  const error = searchParams.error;
  const success = searchParams.success;

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-white">
            JJ&apos;s <span className="text-[#F97316]">IMEX</span>
          </h1>
          <p className="text-[#9CA3AF] text-sm mt-1">Portail administrateur</p>
        </div>

        <div className="bg-[#1A1A1A] rounded-card border border-[#2A2A2A] p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Mot de passe oublié</h2>
          <p className="text-[#9CA3AF] text-sm mb-6">
            Entrez votre adresse email pour recevoir un lien de réinitialisation.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-input p-3 mb-5">
              <p className="text-red-400 text-sm">Erreur lors de l&apos;envoi. Réessayez.</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-input p-3 mb-5">
              <p className="text-green-400 text-sm">
                Email envoyé ! Vérifiez votre boîte de réception.
              </p>
            </div>
          )}

          <form action={resetPassword} className="space-y-4">
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

            <button
              type="submit"
              className="w-full bg-[#F97316] hover:bg-[#ea6c0d] text-white font-semibold
                text-sm py-2.5 rounded-btn transition-colors duration-150"
            >
              Envoyer le lien
            </button>
          </form>

          <a
            href="/login"
            className="block text-center text-sm text-[#9CA3AF] hover:text-white mt-4 transition-colors"
          >
            ← Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  );
}
