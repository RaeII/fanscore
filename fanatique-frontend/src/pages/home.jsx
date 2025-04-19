import { Trophy, Star, Award, Users, Ticket, Coffee, Timer, CreditCard, ShoppingBag, ChevronRight, Check, Smartphone } from 'lucide-react'
import { WalletConnect } from '../components/wallet-connect'
import { Button } from '../components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/app');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fafafa] dark:bg-[#0d0117]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                Revolucione sua experiência de torcedor com <span className="text-secondary">Fanatique</span>
              </h1>
              <p className="text-lg md:text-xl mb-8 text-white/80">
                Transforme sua paixão pelo futebol em uma experiência completa com blockchain, Fan Tokens e benefícios exclusivos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-secondary text-white hover:bg-secondary/90"
                  onClick={handleGetStarted}
                >
                  Comece Agora
                  <ChevronRight size={16} className="ml-2" />
                </Button>
                <WalletConnect className="w-full sm:w-auto" />
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="bg-primary/30 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-secondary p-2 rounded-full">
                      <Trophy size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">Quests Disponíveis</h3>
                      <p className="text-white/70 text-sm">Ganhe recompensas e Fan Tokens</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-6">
                    {['Faça check-in no estádio', 'Compartilhe sua experiência', 'Complete sua primeira compra'].map((quest, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/10 p-3 rounded-lg">
                        <div className="bg-primary/40 p-1.5 rounded-full">
                          <Check size={16} className="text-secondary" />
                        </div>
                        <span className="text-sm">{quest}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="absolute -right-4 -bottom-4 bg-white dark:bg-[#150924] p-4 rounded-xl shadow-lg max-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket size={20} className="text-secondary" />
                    <span className="font-bold">Fan Tokens</span>
                  </div>
                  <div className="text-sm text-primary/70 dark:text-white/70">
                    Use seus tokens para compras e experiências exclusivas!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transition between hero and features */}
      <div className="relative h-32 md:h-40 bg-gradient-to-b from-primary/80 via-primary/50 to-[#fafafa] dark:from-primary/80 dark:via-primary/40 dark:to-[#0d0117]">
        {/* Wave overlay */}
        <svg className="absolute bottom-0 left-0 w-full" 
          viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L48 108C96 96 192 72 288 60C384 48 480 48 576 54C672 60 768 72 864 78C960 84 1056 84 1152 72C1248 60 1344 36 1392 24L1440 12V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" 
          fill="#fafafa" className="dark:fill-[#0d0117]" />
        </svg>
        
        {/* Floating bubbles/dots animation */}
        <div className="absolute top-8 left-1/4 w-6 h-6 rounded-full bg-secondary/30 animate-float-slow"></div>
        <div className="absolute top-16 left-1/3 w-4 h-4 rounded-full bg-white/20 animate-float-medium"></div>
        <div className="absolute top-4 left-2/3 w-8 h-8 rounded-full bg-secondary/20 animate-float-fast"></div>
        <div className="absolute top-20 left-3/4 w-5 h-5 rounded-full bg-white/30 animate-float-medium"></div>
        
        {/* Center icon: trophy with glow */}
        <div className="absolute left-1/2 bottom-8 transform -translate-x-1/2 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl transform scale-150 animate-pulse-slow"></div>
            <div className="relative bg-secondary rounded-full p-4 shadow-lg">
              <Trophy size={32} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 relative">
        {/* Background elements */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-semibold mb-3">RECURSOS EXCLUSIVOS</span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-white mb-3">
              Transformando sua Experiência como Torcedor
            </h2>
            <p className="text-lg text-primary/70 dark:text-white/70 max-w-2xl mx-auto">
              Descubra como a Fanatique está revolucionando a experiência dos torcedores dentro e fora dos estádios.
            </p>
          </div>
          
          <div className="relative max-w-5xl mx-auto">
            {/* Center line with pulsing dots */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-secondary to-primary/20 transform -translate-x-1/2"></div>
            
            {/* Pulsing dots on timeline */}
            <div className="absolute left-1/2 top-0 w-4 h-4 bg-secondary rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
            <div className="absolute left-1/2 top-1/6 w-4 h-4 bg-secondary rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{top: '16.6%'}}></div>
            <div className="absolute left-1/2 top-1/3 w-4 h-4 bg-secondary rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{top: '33.3%'}}></div>
            <div className="absolute left-1/2 top-1/2 w-4 h-4 bg-secondary rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
            <div className="absolute left-1/2 top-2/3 w-4 h-4 bg-secondary rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{top: '66.6%'}}></div>
            <div className="absolute left-1/2 top-5/6 w-4 h-4 bg-secondary rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{top: '83.3%'}}></div>
            
            {/* Features in staggered layout */}
            <div className="space-y-28">
              <FeatureRow 
                icon={<ShoppingBag size={28} className="text-secondary" />}
                title="Consumação Inteligente"
                description="Compre alimentos e bebidas sem sair do seu assento, utilizando Fan Tokens como pagamento."
                details={["Pagamento com Fan Tokens", "Entrega no assento", "Pedidos antecipados"]}
                position="left"
                delay={0}
                number="01"
              />
              <FeatureRow 
                icon={<Check size={28} className="text-secondary" />}
                title="Check-in & Histórico"
                description="Registre sua presença e construa seu histórico como torcedor fiel do seu time."
                details={["Registro automático", "Histórico de presença", "Recordes pessoais"]}
                position="right"
                delay={0.3}
                number="02"
              />
              <FeatureRow 
                icon={<Trophy size={28} className="text-secondary" />}
                title="Quests Gamificadas"
                description="Complete missões exclusivas e ganhe recompensas valiosas e reconhecimento."
                details={["Missões exclusivas", "Recompensas especiais", "Ranking de torcedores"]}
                position="left"
                delay={0.6}
                number="03"
              />
              <FeatureRow 
                icon={<Smartphone size={28} className="text-secondary" />}
                title="Gestão de Fan Tokens"
                description="Controle completo dos seus Fan Tokens diretamente no aplicativo, com segurança blockchain."
                details={["Carteira integrada", "Transações seguras", "Compra fácil de tokens"]}
                position="right"
                delay={0.9}
                number="04"
              />
              <FeatureRow 
                icon={<Award size={28} className="text-secondary" />}
                title="Experiências VIP"
                description="Acesse experiências exclusivas disponíveis apenas para usuários da plataforma."
                details={["Eventos exclusivos", "Acesso a bastidores", "Encontros com jogadores"]}
                position="left"
                delay={1.2}
                number="05"
              />
              <FeatureRow 
                icon={<Users size={28} className="text-secondary" />}
                title="Comunidade Engajada"
                description="Conecte-se com outros torcedores e amplie sua experiência social nos jogos."
                details={["Grupos exclusivos", "Compartilhamento de momentos", "Atividades em grupo"]}
                position="right"
                delay={1.5}
                number="06"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Transition between Features and CTA */}
      <div className="relative h-24 md:h-32 -mt-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#fafafa] to-primary/5 dark:from-[#0d0117] dark:to-primary/20"></div>
        
        {/* Wave overlay */}
        <svg className="absolute bottom-0 left-0 w-full" 
          viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L48 102C96 84 192 48 288 36C384 24 480 36 576 42C672 48 768 48 864 60C960 72 1056 96 1152 96C1248 96 1344 72 1392 60L1440 48V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" 
          fill="rgba(var(--primary), 0.05)" className="dark:fill-[rgba(var(--primary),0.2)]" />
        </svg>
        
        {/* Floating elements */}
        <div className="absolute top-6 left-1/3 w-3 h-3 rounded-full bg-secondary/20 animate-float-fast"></div>
        <div className="absolute top-12 left-2/3 w-4 h-4 rounded-full bg-primary/20 animate-float-medium"></div>
      </div>

      {/* CTA Section */}
      <section className="bg-primary/5 dark:bg-primary/20 py-16">
        <div className="container mx-auto px-4">
          <div className="bg-white dark:bg-[#150924] rounded-2xl p-8 md:p-12 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 md:w-2/3">
                <h2 className="text-2xl md:text-3xl font-bold text-primary dark:text-white mb-4">
                  Pronto para transformar sua experiência nos estádios?
                </h2>
                <p className="text-primary/70 dark:text-white/70">
                  Junte-se a milhares de torcedores que já estão aproveitando todos os benefícios da Fanatique.
                </p>
              </div>
              <Button 
                size="lg" 
                className="bg-secondary text-white hover:bg-secondary/90 md:w-auto w-full"
                onClick={handleGetStarted}
              >
                Começar Agora
                <ChevronRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Transition to Footer */}
      <div className="relative h-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-primary/20 dark:from-primary/20 dark:via-primary/30 dark:to-primary/40"></div>
        
        {/* Wave overlay */}
        <svg className="absolute bottom-0 left-0 w-full transform" 
          viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L48 108C96 96 192 72 288 60C384 48 480 48 576 54C672 60 768 72 864 78C960 84 1056 84 1152 72C1248 60 1344 36 1392 24L1440 12V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" 
          fill="rgba(var(--primary), 0.2)" className="dark:fill-[rgba(var(--primary),0.4)]" />
        </svg>
        
        {/* Floating elements */}
        <div className="absolute bottom-8 left-1/5 w-4 h-4 rounded-full bg-secondary/30 animate-float-slow"></div>
        <div className="absolute bottom-12 left-3/4 w-3 h-3 rounded-full bg-white/20 animate-float-medium"></div>
      </div>

      {/* Footer with styled background */}
      <footer className="py-8 bg-primary/20 dark:bg-primary/40 text-primary dark:text-white text-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Ticket size={20} className="text-secondary" />
              <span className="font-bold text-lg">Fanatique</span>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-primary/70 dark:text-white/70">&copy; {new Date().getFullYear()} Fanatique - Todos os direitos reservados</p>
              <p className="mt-1 text-primary/60 dark:text-white/60">Desenvolvido para a rede Chiliz</p>
              
              <div className="mt-4 flex items-center justify-center md:justify-end gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-white/10 flex items-center justify-center hover:bg-secondary/20 transition-colors cursor-pointer">
                  <Trophy size={16} className="text-secondary" />
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-white/10 flex items-center justify-center hover:bg-secondary/20 transition-colors cursor-pointer">
                  <Star size={16} className="text-secondary" />
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-white/10 flex items-center justify-center hover:bg-secondary/20 transition-colors cursor-pointer">
                  <Award size={16} className="text-secondary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureRow({ icon, title, description, details, position, delay, number }) {
  return (
    <div className="relative grid grid-cols-5">
      {/* Connector to center line */}
      <div className="absolute left-1/2 top-1/2 w-10 h-1 bg-secondary transform -translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Card content based on position */}
      {position === 'left' ? (
        <>
          <div className="col-span-2 animate-fadeInLeft" style={{ animationDelay: `${delay}s` }}>
            <div className="bg-white dark:bg-[#150924] p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-500 border border-primary/5 dark:border-white/5 transform hover:-translate-y-2 group relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-secondary/5 group-hover:bg-secondary/10 transition-all duration-500"></div>
              
              {/* Number indicator */}
              <div className="absolute top-4 right-4 font-bold text-4xl text-secondary/10 group-hover:text-secondary/20 transition-all duration-500">
                {number}
              </div>
              
              <div className="p-3 rounded-full bg-primary/5 dark:bg-primary/20 w-fit mb-4 relative z-10">
                {icon}
              </div>
              <h3 className="text-xl font-bold text-primary dark:text-white mb-3 relative z-10">{title}</h3>
              <p className="text-primary/70 dark:text-white/70 mb-5 relative z-10">{description}</p>
              
              {/* Feature details bullets */}
              <ul className="space-y-2 relative z-10">
                {details.map((detail, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                    <span className="text-sm text-primary/80 dark:text-white/80">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="col-span-1"></div>
          <div className="col-span-2"></div>
        </>
      ) : (
        <>
          <div className="col-span-2"></div>
          <div className="col-span-1"></div>
          <div className="col-span-2 animate-fadeInRight" style={{ animationDelay: `${delay}s` }}>
            <div className="bg-white dark:bg-[#150924] p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-500 border border-primary/5 dark:border-white/5 transform hover:-translate-y-2 group relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-secondary/5 group-hover:bg-secondary/10 transition-all duration-500"></div>
              
              {/* Number indicator */}
              <div className="absolute top-4 left-4 font-bold text-4xl text-secondary/10 group-hover:text-secondary/20 transition-all duration-500">
                {number}
              </div>
              
              <div className="p-3 rounded-full bg-primary/5 dark:bg-primary/20 w-fit mb-4 relative z-10">
                {icon}
              </div>
              <h3 className="text-xl font-bold text-primary dark:text-white mb-3 relative z-10">{title}</h3>
              <p className="text-primary/70 dark:text-white/70 mb-5 relative z-10">{description}</p>
              
              {/* Feature details bullets */}
              <ul className="space-y-2 relative z-10">
                {details.map((detail, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                    <span className="text-sm text-primary/80 dark:text-white/80">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white dark:bg-[#150924] p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-primary/5 dark:border-white/5">
      <div className="p-3 rounded-full bg-primary/5 dark:bg-primary/20 w-fit mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-primary dark:text-white mb-3">{title}</h3>
      <p className="text-primary/70 dark:text-white/70">{description}</p>
    </div>
  );
}
