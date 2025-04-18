import { Trophy, Star, Award, Users, Ticket, Coffee, Timer, CreditCard, ShoppingBag } from 'lucide-react'
import { WalletConnect } from '../components/wallet-connect'
import { Button } from '../components/ui/button'

export default function HomePage() {


  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-[#fafafa] to-primary/5 dark:from-[#0d0117] dark:to-primary/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-6xl md:text-7xl font-bold text-primary dark:text-white">
                <span className="text-secondary">Fanatique</span>
              </h1>
              <p className="text-lg md:text-2xl text-primary/80 dark:text-white/80">
                Sem filas, mais recompensas em torcer e eleve sua experiência no estádio
              </p>
              <div className="pt-4 space-y-3">

              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-md aspect-square">
                <div className="absolute inset-0 bg-secondary/20 dark:bg-secondary/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  <Ticket size={180} className="text-secondary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main benefits section */}
      <section className="py-16 bg-[#fafafa] dark:bg-[#0d0117]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary dark:text-white">Por que escolher o Fanatique?</h2>
            <p className="mt-4 text-primary/70 dark:text-white/70 max-w-2xl mx-auto">
              Aproveite seu tempo no estádio ao máximo com nosso aplicativo na rede Chiliz
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Timer className="text-secondary h-8 w-8" />}
              title="Sem Filas"
              description="Faça pedidos diretamente do seu assento e economize tempo precioso de jogo."
            />
            <FeatureCard 
              icon={<Trophy className="text-secondary h-8 w-8" />}
              title="Ganhe Recompensas"
              description="Acumule pontos a cada compra e interação com seu clube. Destrave benefícios exclusivos."
            />
            <FeatureCard 
              icon={<Coffee className="text-secondary h-8 w-8" />}
              title="Experiência Elevada"
              description="Pedidos personalizados, bebidas e alimentos entregues em seu assento ou retire sem fila."
            />
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="py-16 bg-primary/5 dark:bg-primary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary dark:text-white">Como Funciona</h2>
            <p className="mt-4 text-primary/70 dark:text-white/70 max-w-2xl mx-auto">
              Três passos simples para transformar sua experiência no estádio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard 
              number="1"
              icon={<Users className="text-secondary h-8 w-8" />}
              title="Conecte sua Carteira"
              description="Conecte-se com sua carteira na rede Chiliz e acesse o ecossistema do seu clube."
            />
            <StepCard 
              number="2"
              icon={<ShoppingBag className="text-secondary h-8 w-8" />}
              title="Peça ou Compre"
              description="Faça pedidos de alimentos e bebidas pelo app ou retire sem enfrentar filas."
            />
            <StepCard 
              number="3"
              icon={<Award className="text-secondary h-8 w-8" />}
              title="Acumule Pontos"
              description="Cada interação gera pontos. Complete missões especiais para ganhar ainda mais."
            />
          </div>
        </div>
      </section>

      {/* Stadium Experience section */}
      <section className="py-16 bg-[#fafafa] dark:bg-[#0d0117]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary dark:text-white">Experiência no Estádio</h2>
            <p className="mt-4 text-primary/70 dark:text-white/70 max-w-2xl mx-auto">
              Desfrute de todos os momentos do jogo sem perder nenhum lance importante
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#fafafa] dark:bg-[#0d0117] p-6 rounded-lg border border-primary/10 dark:border-white/10">
              <div className="mb-4 flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/5 dark:bg-primary/20">
                  <Coffee className="text-secondary h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium text-primary dark:text-white">Alimentos e Bebidas</h3>
              </div>
              <p className="text-primary/70 dark:text-white/70 mb-4">
                Escolha entre uma variedade de opções de alimentos e bebidas. Faça seu pedido pelo app e receba diretamente no seu assento ou retire sem enfrentar filas.
              </p>
              <Button variant="secondary" className="mt-2">Ver Cardápio</Button>
            </div>
            
            <div className="bg-[#fafafa] dark:bg-[#0d0117] p-6 rounded-lg border border-primary/10 dark:border-white/10">
              <div className="mb-4 flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/5 dark:bg-primary/20">
                  <CreditCard className="text-secondary h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium text-primary dark:text-white">Pagamentos Fáceis</h3>
              </div>
              <p className="text-primary/70 dark:text-white/70 mb-4">
                Pague com sua carteira cripto ou métodos tradicionais. Todas as transações são seguras e instantâneas, permitindo que você aproveite o jogo sem preocupações.
              </p>
              <Button variant="secondary" className="mt-2">Métodos de Pagamento</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Clubs section */}
      <section className="py-16 bg-primary/5 dark:bg-primary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary dark:text-white">Clubes Participantes</h2>
            <p className="mt-4 text-primary/70 dark:text-white/70 max-w-2xl mx-auto">
              Conheça os clubes que já fazem parte da revolução Fanatique na rede Chiliz
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
          <h2 className="text-3xl font-bold mb-6">Pronto para transformar sua experiência no estádio?</h2>
          <p className="max-w-2xl mx-auto mb-8">
            Conecte sua carteira agora e comece a aproveitar todos os benefícios da plataforma Fanatique na rede Chiliz.
          </p>
      
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

function StepCard({ number, icon, title, description }) {
  return (
    <div className="bg-[#fafafa] dark:bg-[#0d0117] p-6 rounded-lg border border-primary/10 dark:border-white/10 flex flex-col items-center text-center relative">
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
        {number}
      </div>
      <div className="mb-4 p-3 rounded-full bg-primary/5 dark:bg-primary/20">
        {icon}
      </div>
      <h3 className="text-xl font-medium text-primary dark:text-white mb-2">{title}</h3>
      <p className="text-primary/70 dark:text-white/70">{description}</p>
    </div>
  )
} 