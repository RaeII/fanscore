import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { Trophy, Star, Ticket, ShoppingBag, User, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import api from '../lib/api';
import { showError } from '../lib/toast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { account, disconnectWallet, hasValidToken } = useWallet();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se o usuário está autenticado
    if (!account || !hasValidToken()) {
      navigate('/app');
      return;
    }

    // Carregar dados do usuário
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/user');

        console.log({response})
        
        if (response?.data && response?.data?.content?.id) {
          setUserData(response.data.content);
        } else {
          showError('Erro ao carregar dados do usuário');
          navigate('/app');
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        showError('Não foi possível carregar seus dados. Por favor, tente novamente.');
        navigate('/app');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [account, hasValidToken, navigate]);

  const handleLogout = async () => {
    await disconnectWallet();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fafafa] dark:bg-[#0d0117]">
      {/* Header do Dashboard */}
      <div className="bg-primary text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Olá, {userData?.name || 'Torcedor'}</h1>
              <p className="text-white/80 text-sm mt-1">
                Carteira: {account?.slice(0, 6)}...{account?.slice(-4)}
              </p>
            </div>
            <Button 
              variant="outline"
              className="text-white border-white hover:bg-white/10"
              onClick={handleLogout}
            >
              <LogOut size={16} className="mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={<Trophy size={24} className="text-secondary" />}
            title="Pontos"
            value="0"
            label="pontos acumulados"
          />
          <StatCard 
            icon={<Star size={24} className="text-secondary" />}
            title="Quests"
            value="0"
            label="completadas"
          />
          <StatCard 
            icon={<ShoppingBag size={24} className="text-secondary" />}
            title="Pedidos"
            value="0"
            label="realizados"
          />
          <StatCard 
            icon={<Ticket size={24} className="text-secondary" />}
            title="Ingressos"
            value="0"
            label="comprados"
          />
        </div>

        <h2 className="text-2xl font-bold text-primary dark:text-white mb-6">Ações Rápidas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard 
            icon={<ShoppingBag size={36} className="text-secondary" />}
            title="Fazer Pedido"
            description="Peça comidas e bebidas sem pegar fila"
            buttonText="Pedir Agora"
            onClick={() => navigate('/pedidos')}
          />
          <ActionCard 
            icon={<Trophy size={36} className="text-secondary" />}
            title="Completar Quests"
            description="Ganhe pontos completando missões"
            buttonText="Ver Quests"
            onClick={() => navigate('/quests')}
          />
          <ActionCard 
            icon={<User size={36} className="text-secondary" />}
            title="Meu Perfil"
            description="Veja e edite suas informações"
            buttonText="Ver Perfil"
            onClick={() => navigate('/perfil')}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, label }) {
  return (
    <div className="bg-white dark:bg-[#150924] p-6 rounded-lg shadow-sm">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-primary/5 dark:bg-primary/20">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-primary/60 dark:text-white/60">{title}</h3>
          <p className="text-2xl font-bold text-primary dark:text-white">{value}</p>
          <p className="text-xs text-primary/60 dark:text-white/60">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, description, buttonText, onClick }) {
  return (
    <div className="bg-white dark:bg-[#150924] p-6 rounded-lg shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="p-4 rounded-full bg-primary/5 dark:bg-primary/20 mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-medium text-primary dark:text-white mb-2">{title}</h3>
        <p className="text-primary/70 dark:text-white/70 mb-6">{description}</p>
        <Button 
          variant="secondary"
          className="w-full"
          onClick={onClick}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
} 