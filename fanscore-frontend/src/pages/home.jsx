import { Trophy, Star, Award, Users } from 'lucide-react'
import { WalletConnect } from '../components/wallet-connect'
import { Button } from '../components/ui/button'
import { showSuccess, showError, showInfo, showWarning } from '../lib/toast'

export default function HomePage() {
  const demonstrarToasts = () => {
    showInfo('Este é um exemplo de mensagem informativa');
    setTimeout(() => showSuccess('Operação concluída com sucesso!'), 1000);
    setTimeout(() => showWarning('Atenção! Isto é um aviso importante.'), 2000);
    setTimeout(() => showError('Ocorreu um erro ao processar a solicitação.'), 3000);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-[#fafafa] to-primary/5 dark:from-[#0d0117] dark:to-primary/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-primary dark:text-white">
                Ganhe pontos apoiando seu <span className="text-secondary">clube favorito</span>
              </h1>
              <p className="text-lg text-primary/80 dark:text-white/80">
                Participe de quests, colete pontos e desbloqueie recompensas exclusivas na rede Chiliz com o FanScore.
              </p>
              <div className="pt-4 space-y-3">
                <WalletConnect className="w-full md:w-auto" />
                <Button 
                  variant="outline" 
                  onClick={demonstrarToasts} 
                  className="w-full md:w-auto"
                >
                  Testar Notificações
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-md aspect-square">
                <div className="absolute inset-0 bg-secondary/20 dark:bg-secondary/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  <Trophy size={180} className="text-secondary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 bg-[#fafafa] dark:bg-[#0d0117]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary dark:text-white">Como funciona</h2>
            <p className="mt-4 text-primary/70 dark:text-white/70 max-w-2xl mx-auto">
              FanScore conecta torcedores aos seus clubes através de um sistema de recompensas na rede Chiliz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Users className="text-secondary h-8 w-8" />}
              title="Conecte-se"
              description="Conecte sua carteira na rede Chiliz e comece a participar do ecossistema do seu clube."
            />
            <FeatureCard 
              icon={<Star className="text-secondary h-8 w-8" />}
              title="Complete Quests"
              description="Participe de desafios exclusivos e ganhe pontos ao apoiar seu time."
            />
            <FeatureCard 
              icon={<Award className="text-secondary h-8 w-8" />}
              title="Ganhe Recompensas"
              description="Desbloqueie benefícios especiais e mostre seu apoio ao clube do coração."
            />
          </div>
        </div>
      </section>

      {/* Clubs section */}
      <section className="py-16 bg-primary/5 dark:bg-primary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary dark:text-white">Clubes Participantes</h2>
            <p className="mt-4 text-primary/70 dark:text-white/70 max-w-2xl mx-auto">
              Conheça os clubes que fazem parte da plataforma FanScore na rede Chiliz.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div 
                key={index} 
                className="bg-[#fafafa] dark:bg-[#0d0117] rounded-lg p-6 shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <Trophy className="h-8 w-8 text-primary dark:text-white" />
                </div>
                <h3 className="font-medium text-primary dark:text-white">Clube {index + 1}</h3>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button variant="secondary">Ver todos os clubes</Button>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto para começar?</h2>
          <p className="max-w-2xl mx-auto mb-8">
            Conecte sua carteira agora e comece a acumular pontos para seu clube favorito na rede Chiliz.
          </p>
          <WalletConnect className="mx-auto" />
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-[#fafafa] dark:bg-[#0d0117] p-6 rounded-lg border border-primary/10 dark:border-white/10 flex flex-col items-center text-center">
      <div className="mb-4 p-3 rounded-full bg-primary/5 dark:bg-primary/20">
        {icon}
      </div>
      <h3 className="text-xl font-medium text-primary dark:text-white mb-2">{title}</h3>
      <p className="text-primary/70 dark:text-white/70">{description}</p>
    </div>
  )
} 