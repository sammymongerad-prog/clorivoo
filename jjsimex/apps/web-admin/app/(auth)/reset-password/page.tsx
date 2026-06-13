import { updatePassword } from '@/lib/auth/actions';

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { error } = await searchParams;

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
          <h2 className="text-lg font-semibold text-white mb-2">Nouveau mot de passe</h2>
          <p className="text-[#9CA3AF] text-sm mb-6">
            Choisissez un nouveau mot de passe sécurisé.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-input p-3 mb-5">
              <p className="text-red-400 text-sm">Erreur lors de la mise à jour. Réessayez.</p>
            </div>
          )}

          <form action={updatePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-[#9CA3AF] mb-1.5" htmlFor="password">
                Nouveau mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Minimum 8 caractères"
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
              Mettre à jour
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
