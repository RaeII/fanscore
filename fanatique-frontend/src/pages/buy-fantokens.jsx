import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Volleyball as Football, ArrowLeft, Search, BanknoteArrowUp, X, ChevronRight, History, HandCoins, Loader2, Receipt, ExternalLink, Coins } from 'lucide-react';
import { Button } from '../components/ui/button';
import clubApi from '../api/club';
import contractApi from '../api/contract';
import transactionApi from '../api/transaction';
import toast from 'react-hot-toast';
import { WalletContext } from '../contexts/WalletContextDef';
import { useTranslation } from 'react-i18next';

// Estilos personalizados
const cardInnerShadow = {
  boxShadow: "rgb(255 255 255 / 4%) 1px 1px 30px 2px inset",
  WebkitBoxShadow: "rgb(255 255 255 / 4%) 1px 1px 30px 2px inset",
  MozBoxShadow: "rgb(255 255 255 / 4%) 1px 1px 30px 2px inset"
};

export default function BuyFantokensPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, isConnected, connectWallet, BLOCK_EXPLORER_URL } = useContext(WalletContext);
  const { t } = useTranslation(['tokens', 'common']);
  const [loading, setLoading] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClub, setSelectedClub] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showQRCode, setShowQRCode] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [walletTokens, setWalletTokens] = useState([]);
  const [stablecoins, setStablecoins] = useState([]);
  const [loadingStablecoins, setLoadingStablecoins] = useState(false);
  const [activeTab, setActiveTab] = useState('comprar'); // 'comprar', 'historico', ou 'stake'
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
  // Obter o tab do parâmetro da URL
  const queryParams = new URLSearchParams(location.search);
  const tokenTypeParam = queryParams.get('type');
  
  // Estados para a navegação por tipo de token
  const [activeTokenType, setActiveTokenType] = useState(tokenTypeParam || 'fantoken');

  // Função auxiliar para buscar stablecoins
  const fetchStablecoins = async () => {
    if (!account) return;
    
    try {
      setLoadingStablecoins(true);
      const stablecoinsData = await contractApi.getStablecoinBalances(account);
      setStablecoins(stablecoinsData);
    } catch (error) {
      console.error('Erro ao buscar stablecoins:', error);
      toast.error('Não foi possível carregar as stablecoins');
    } finally {
      setLoadingStablecoins(false);
    }
  };

  // Verificar se o usuário está autenticado
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (!isConnected) {
        try {
          const connected = await connectWallet();
          if (!connected) {
            navigate('/dashboard');
          }
        } catch (error) {
          console.error('Erro ao conectar carteira:', error);
          navigate('/dashboard');
        }
      }
    };
    
    checkWalletConnection();
  }, [isConnected, connectWallet, navigate]);
  
  // Buscar tokens da carteira
  useEffect(() => {
    const fetchWalletTokens = async () => {
      if (account) {
        try {
          const tokens = await contractApi.getWalletTokens(account);
          setWalletTokens(tokens);
        } catch (error) {
          console.error('Erro ao buscar tokens da carteira:', error);
          // Não mostramos toast de erro aqui para não atrapalhar a experiência do usuário
        }
      }
    };

    fetchWalletTokens();
  }, [account]);
  
  // Buscar stablecoins quando mudar o tipo de token ativo
  useEffect(() => {
    const fetchStablecoins = async () => {
      if (account && activeTokenType === 'stablecoin') {
        try {
          setLoadingStablecoins(true);
          const stablecoinsData = await contractApi.getStablecoinBalances(account);
          setStablecoins(stablecoinsData);
        } catch (error) {
          console.error('Erro ao buscar stablecoins:', error);
          toast.error('Não foi possível carregar as stablecoins');
        } finally {
          setLoadingStablecoins(false);
        }
      }
    };

    fetchStablecoins();
  }, [account, activeTokenType]);

  // Get clubs
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        const clubs = await clubApi.getClubs();
        setClubs(clubs);
      } catch (error) {
        console.error('Erro ao buscar clubes:', error);
        toast.error('Não foi possível carregar os clubes');
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  // Buscar transações quando a tab estiver ativa
  useEffect(() => {
    const loadTransactions = async () => {
      if (activeTab === 'historico' && account) {
        try {
          setLoadingTransactions(true);
          const data = await transactionApi.getUserTransactions();
          setTransactions(data);
        } catch (error) {
          console.error('Erro ao buscar transações:', error);
          toast.error('Não foi possível carregar as transações');
        } finally {
          setLoadingTransactions(false);
        }
      }
    };
    
    loadTransactions();
  }, [activeTab, account, activeTokenType]);

  // Função para obter o saldo de tokens de um clube específico
  const getClubTokenBalance = (clubId) => {
    const token = walletTokens.find(token => token.club_id === clubId.toString());
    return token ? parseFloat(token.balance) : 0;
  };

  const handleSelectClub = (club) => {
    setSelectedClub(club);
    setShowModal(true);
  };

  // Função para selecionar stablecoin
  const handleSelectStablecoin = (coin) => {
    setSelectedClub({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      image: coin.image,
      isStablecoin: true
    });
    setShowModal(true);
  };

  const handleBuyTokens = async () => {
    if (!isConnected || !account) {
      toast.error('Conecte sua carteira para continuar com a compra');
      try {
        await connectWallet();
      } catch (error) {
        console.error('Erro ao conectar carteira:', error);
      }
      return;
    }
    setShowQRCode(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowQRCode(false);
    setQuantity(1);
  };

  const closeQRCode = async () => {
    try {
      setProcessingPayment(true);
      
      // Obtém o endereço da carteira do usuário do contexto
      if (!account) {
        toast.error('Você precisa estar conectado a uma carteira para comprar tokens');
        return;
      }
      
      if (selectedClub.isStablecoin) {
        // Compra de stablecoin
        const transferData = {
          stablecoin_id: selectedClub.id,
          to: account,
          amount: quantity.toString()
        };
        
        // Chamar a API para transferir stablecoins
        await contractApi.transferStablecoins(transferData);
        
        // Atualizar stablecoins da carteira após a compra
        const stablecoinsData = await contractApi.getStablecoinBalances(account);
        setStablecoins(stablecoinsData);
        
        toast.success(`Compra de ${quantity} ${selectedClub.symbol} realizada com sucesso!`);
      } else {
        // Compra de fantoken
        const transferData = {
          club_id: selectedClub.id,
          to: account,
          amount: quantity
        };
        
        // Chamar a API para transferir tokens
        await contractApi.transferTokens(transferData);
        
        // Atualizar tokens da carteira após a compra
        const tokens = await contractApi.getWalletTokens(account);
        setWalletTokens(tokens);
        
        toast.success(`Compra de ${quantity} FanTokens do ${selectedClub.name} realizada com sucesso!`);
      }
      
      // Atualizar transações
      if (activeTab === 'historico') {
        const data = await transactionApi.getUserTransactions();
        setTransactions(data);
      }
      
      setShowQRCode(false);
      setShowModal(false);
      setQuantity(1);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Falha ao processar o pagamento. Tente novamente.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Gerar QR Code aleatório
  const getRandomQRCode = () => {
    return `qr.png`;
  };

  // Filter clubs based on search term
  const filteredClubs = clubs.filter(club => 
    club.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para formatar hash da transação
  const formatHash = (hash) => {
    if (!hash) return '';
    return hash.length > 16 ? `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}` : hash;
  };

  // Função para alterar o tipo de token e atualizar a URL
  const handleTokenTypeChange = (type) => {
    setActiveTokenType(type);
    navigate(`/tokens?type=${type}`);
    
    // Atualizar dados com base no tipo de token selecionado
    if (type === 'stablecoin' && account) {
      fetchStablecoins();
    } else if (type === 'fantoken' && account) {
      const fetchWalletTokens = async () => {
        try {
          const tokens = await contractApi.getWalletTokens(account);
          setWalletTokens(tokens);
        } catch (error) {
          console.error('Erro ao buscar tokens da carteira:', error);
        }
      };
      fetchWalletTokens();
    }
    
    // Se estiver na tab de histórico, atualizar as transações
    if (activeTab === 'historico') {
      const loadTransactions = async () => {
        try {
          setLoadingTransactions(true);
          const data = await transactionApi.getUserTransactions();
          setTransactions(data);
        } catch (error) {
          console.error('Erro ao buscar transações:', error);
          toast.error('Não foi possível carregar as transações');
        } finally {
          setLoadingTransactions(false);
        }
      };
      loadTransactions();
    }
  };

  // Garantir que ao mudar para a aba de stake, o tipo de token seja sempre fantoken
  useEffect(() => {
    if (activeTab === 'stake' && activeTokenType !== 'fantoken') {
      setActiveTokenType('fantoken');
    }
  }, [activeTab, activeTokenType]);

  if (loading && activeTab === 'comprar') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fafafa] bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="mr-2"
          >
            <ArrowLeft className="text-primary" size={18} />
          </Button>
          <h1 className="text-2xl font-bold text-primary dark:text-white">{t('tokens:buyTokens.title')}</h1>
        </div>

        {/* Nova Navegação com Ícones Conforme Imagem */}
        <div className="flex justify-center items-center gap-8 mb-8">
          <div 
            className={`flex flex-col items-center justify-center cursor-pointer ${activeTab === 'comprar' ? 'text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('comprar')}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeTab === 'comprar' ? 'bg-primary' : 'bg-primary/50'}`}>
              <HandCoins size={24} className="text-black" />
            </div>
            <span className="mt-1 text-sm font-medium">{t('tokens:tabs.buy')}</span>
          </div>
          
          <div 
            className={`flex flex-col items-center justify-center cursor-pointer ${activeTab === 'historico' ? 'text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('historico')}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeTab === 'historico' ? 'bg-primary' : 'bg-primary/50'}`}>
              <History size={24} className="text-black" />
            </div>
            <span className="mt-1 text-sm font-medium">{t('tokens:tabs.history')}</span>
          </div>
          
          <div 
            className={`flex flex-col items-center justify-center cursor-pointer ${activeTab === 'stake' ? 'text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('stake')}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeTab === 'stake' ? 'bg-primary' : 'bg-primary/50'}`}>
              <BanknoteArrowUp size={24} className="text-black" />
            </div>
            <span className="mt-1 text-sm font-medium">{t('tokens:tabs.stake')}</span>
          </div>
        </div>

        {/* Tab de navegação FanTokens / Stablecoin - Reposicionada para abaixo dos ícones */}
        {activeTab !== 'stake' && (
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              className={`flex-1 rounded-none border-b-2 py-2 ${
                activeTokenType === 'fantoken'
                  ? 'border-primary text-foreground font-semibold'
                  : 'border-transparent text-foreground/70 dark:text-white/70'
              }`}
              onClick={() => handleTokenTypeChange('fantoken')}
            >
              {t('tokens:tokenTypes.fantoken')}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className={`flex-1 rounded-none border-b-2 py-2 ${
                activeTokenType === 'stablecoin'
                  ? 'border-primary text-foreground font-semibold'
                  : 'border-transparent text-foreground/70 dark:text-white/70'
              }`}
              onClick={() => handleTokenTypeChange('stablecoin')}
            >
              {t('tokens:tokenTypes.stablecoin')}
            </Button>
          </div>
        )}

        {activeTab === 'comprar' ? (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-primary dark:text-white mb-4">
              {activeTokenType === 'fantoken' ? 'PRINCIPAIS TOKENS' : 'STABLECOINS'}
            </h2>
            
            {/* Search input */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-primary/50 dark:text-white/50" />
              </div>
              <input
                type="text"
                placeholder={activeTokenType === 'fantoken' ? "Buscar clube..." : "Buscar stablecoin..."}
                className="w-full pl-10 pr-4 py-2 dark:border-white/20 rounded-lg bg-background-overlay  dark:text-white focus:outline-none focus:ring-"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Conteúdo condicional baseado no tipo de token ativo */}
            {activeTokenType === 'fantoken' ? (
              // Tokens List (formato existente para FanTokens)
              <div className="flex flex-col space-y-2">
                {filteredClubs.map(club => (
                  <div 
                    key={club.id}
                    onClick={() => handleSelectClub(club)}
                    className="bg-background-dark/40 dark:bg-background-dark/40 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-background-dark/60 dark:hover:bg-background-dark/60 transition-colors backdrop-blur-md border border-white/10"
                    style={cardInnerShadow}
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-white overflow-hidden mr-4 flex-shrink-0">
                        {club.image ? (
                          <img 
                            src={club.image} 
                            alt={club.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/50">
                            <Football size={24} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {club.symbol}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-right mr-4">
                        <p className="font-bold text-white">
                          {getClubTokenBalance(club.id)} {club.symbol}
                        </p>
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Lista de Stablecoins
              loadingStablecoins ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 size={28} className="animate-spin text-primary dark:text-white" />
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  {stablecoins.length === 0 ? (
                    <div className="text-center py-10">
                      <Coins size={36} className="mx-auto text-primary/30 dark:text-white/30 mb-2" />
                      <p className="text-primary/70 dark:text-white/70">
                        Você não possui stablecoins na sua carteira.
                      </p>
                    </div>
                  ) : (
                    stablecoins.map(coin => (
                      <div 
                        key={coin.symbol}
                        onClick={() => handleSelectStablecoin(coin)}
                        className="bg-background-dark/40 dark:bg-background-dark/40 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-background-dark/60 dark:hover:bg-background-dark/60 transition-colors backdrop-blur-md border border-white/10"
                        style={cardInnerShadow}
                      >
                        {console.log(coin)}
                        <div className="flex items-center">
                          <img src={coin.image} alt={coin.symbol} className="w-12 h-12 rounded-full overflow-hidden mr-4 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-white">{coin.symbol}</p>
                            <p className="text-xs text-gray-400">{coin.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="text-right mr-4">
                            <p className="font-bold text-white">{coin.balance} {coin.symbol}</p>
                          </div>
                          <ChevronRight size={20} className="text-gray-400" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )
            )}

            {activeTokenType === 'fantoken' && filteredClubs.length === 0 && (
              <div className="text-center py-10">
                <Football size={36} className="mx-auto text-primary/30 dark:text-white/30 mb-2" />
                <p className="text-primary/70 dark:text-white/70">
                  Nenhum clube encontrado com esse nome.
                </p>
              </div>
            )}
          </div>
        ) : activeTab === 'historico' ? (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-primary dark:text-white mb-4">
              HISTÓRICO DE TRANSAÇÕES
            </h2>
            
            {loadingTransactions ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 size={36} className="animate-spin text-primary dark:text-white" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10 bg-white/5 dark:bg-white/5 rounded-lg">
                <Receipt size={36} className="mx-auto text-primary/30 dark:text-white/30 mb-2" />
                <p className="text-primary/70 dark:text-white/70">
                  Nenhuma transação encontrada.
                </p>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                {(() => {
                  const filteredTransactions = transactions.filter(transaction => {
                    // Filtrar transações com base no tipo ativo
                    if (activeTokenType === 'fantoken') {
                      return transaction.club !== undefined;
                    } else if (activeTokenType === 'stablecoin') {
                      return transaction.stablecoin !== undefined;
                    }
                    return true;
                  });
                  
                  if (filteredTransactions.length === 0) {
                    return (
                      <div className="text-center py-10 bg-white/5 dark:bg-white/5 rounded-lg">
                        <Receipt size={36} className="mx-auto text-primary/30 dark:text-white/30 mb-2" />
                        <p className="text-primary/70 dark:text-white/70">
                          {activeTokenType === 'fantoken' 
                            ? 'Nenhuma transação de FanToken encontrada.'
                            : 'Nenhuma transação de Stablecoin encontrada.'}
                        </p>
                      </div>
                    );
                  }
                  
                  return filteredTransactions.map(transaction => (
                    <div 
                      key={transaction.id}
                      className="bg-background-dark/40 dark:bg-background-dark/40 p-4 rounded-xl flex items-center justify-between transition-colors backdrop-blur-md border border-white/10"
                      style={cardInnerShadow}
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-white overflow-hidden mr-4 flex-shrink-0">
                          {transaction.club?.image ? (
                            <img 
                              src={transaction.club.image} 
                              alt={transaction.club.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : transaction.stablecoin?.image ? (
                            <img 
                              src={transaction.stablecoin.image} 
                              alt={transaction.stablecoin.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/50">
                              <Football size={24} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {transaction.club?.symbol || transaction.stablecoin?.symbol || 'Token'}
                          </p>
                          <div className="flex items-center text-xs text-gray-400">
                            <span className="inline-flex items-center">
                              <Receipt size={12} className="mr-1" />
                              {formatHash(transaction.hash)}
                            </span>
                            {transaction.hash && (
                              <a 
                                href={`${BLOCK_EXPLORER_URL}tx/${transaction.hash}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-2 inline-flex items-center text-blue-400 hover:text-blue-300"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink size={10} className="mr-1" />
                                Explorar
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">
                          +{transaction.value}
                        </p>
                        <p className="text-xs text-gray-400">
                          {transaction.date_register ? new Date(transaction.date_register).toLocaleDateString() : '-'}
                        </p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-6">
                Fixed Staking
              </h2>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
                <div className="flex space-x-2 bg-background-dark/60 rounded-full p-1 w-fit">
                  <button 
                    className="px-6 py-2 rounded-full text-black bg-primary text-sm font-medium"
                  >
                    Active
                  </button>
                  <button className="px-6 py-2 rounded-full text-gray-400 hover:text-white text-sm font-medium">
                    Ended
                  </button>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer bg-black" />
                      <div className="relative w-11 h-6 bg-black peer-focus:outline-none rounded-full peer dark:bg-background-dark/60 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary/80"></div>
                      <span className="ms-3 text-sm font-medium text-white">Staked Only</span>
                    </label>
                  </div>
                  
                  <div className="relative BG" >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-white/50" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search"
                      className="pl-10 pr-4 py-2 text-sm border-none rounded-full bg-background-dark/60 text-white focus:outline-none focus:ring-1 bg-black w-48"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Grid de cards de staking usando os dados dos clubes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {loading ? (
                  <div className="col-span-3 flex justify-center items-center py-12">
                    <Loader2 size={36} className="animate-spin text-primary dark:text-white" />
                  </div>
                ) : filteredClubs.length === 0 ? (
                  <div className="col-span-3 text-center py-10 bg-white/5 dark:bg-white/5 rounded-lg">
                    <Football size={36} className="mx-auto text-primary/30 dark:text-white/30 mb-2" />
                    <p className="text-primary/70 dark:text-white/70">
                      Nenhum clube encontrado para stake.
                    </p>
                  </div>
                ) : (
                  filteredClubs.map(club => {
                    // Valores fixos para o stake de cada clube
                    const apr = (club.id % 10) + 5; // APR entre 5% e 14% baseado no ID do clube
                    const tvl = ((club.id % 5) + 1) * 20; // TVL entre 20k e 100k
                    const totalTokens = 100 + club.id * 10; // Total de tokens entre 100k e variável dependendo do ID
                    // Usar o saldo real do usuário
                    const userBalance = getClubTokenBalance(club.id);
                    // Valor fixo de ganhos baseado no saldo
                    const earned = userBalance > 0 ? (userBalance * 0.1).toFixed(2) : "0.00";
                    
                    return (
                      <div key={club.id} className="bg-background-dark/40 dark:bg-background-dark/40 rounded-xl p-5 backdrop-blur-md border border-white/10 shadow-lg"
                        style={cardInnerShadow}
                      >
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 rounded-full bg-white overflow-hidden mr-3 flex-shrink-0">
                            {club.image ? (
                              <img 
                                src={club.image} 
                                alt={club.name} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/50">
                                <Football size={16} />
                              </div>
                            )}
                          </div>
                          <span className="text-white font-medium">Earn {club.symbol}</span>
                        </div>
                        
                        <div className="mb-4">
                          <span className="text-white text-2xl font-bold">{apr}%</span>
                          <span className="text-gray-400 text-xs ml-1">APR</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-1 mb-3 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs">TVL</p>
                            <p className="text-white font-bold">${tvl}k</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-400 text-xs">Total {club.symbol}</p>
                            <p className="text-white font-bold">{totalTokens}k</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-1 mb-4 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs">Your Deposits</p>
                            <p className="text-white font-bold">{userBalance} {club.symbol}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-400 text-xs">Earned {club.symbol}</p>
                            <p className="text-white font-bold">{earned} {club.symbol}</p>
                          </div>
                        </div>
                        
                        <button className="w-full py-2 bg-backg bg-opacity-80 text-white rounded-xl font-medium text-sm hover:bg-opacity-100 transition-colors">
                          View More
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para compra de tokens */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black rounded-lg w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-primary dark:text-white">
                  {showQRCode ? "Realize o Pagamento" : selectedClub.isStablecoin ? `${selectedClub.name}` : `${selectedClub.name}`}
                </h3>
                <Button variant="ghost" size="icon" onClick={handleCloseModal}>
                  <X size={18} />
                </Button>
              </div>

              {!showQRCode ? (
                <>
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-white dark:bg-[#2d1248] overflow-hidden">
                      {selectedClub.image ? (
                        <img 
                          src={selectedClub.image} 
                          alt={selectedClub.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5 dark:bg-primary/20 text-primary/50 dark:text-white/50">
                          <Football size={32} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 text-center">
                    <p className="text-sm text-primary/70 dark:text-white/70 mb-1">Seu saldo atual</p>
                    <p className="text-xl font-bold text-primary dark:text-white">
                      {getClubTokenBalance(selectedClub.id)} {selectedClub.symbol}
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-primary/80 dark:text-white/80 mb-2 text-center">
                      Quantidade de {selectedClub?.isStablecoin ? selectedClub.symbol : 'FanTokens'}
                    </label>
                    <div className="flex items-center justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                        className="px-3 mr-2 py-1 hover:bg-secondary text-white hover:text-white transition-colors font-bold"
                      >
                        -
                      </Button>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 mx-2 py-2 text-center border border-primary/20 dark:border-white/20 rounded-md bg-white dark:bg-[#000000] text-primary dark:text-white focus:outline-none"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3 py-1 hover:bg-secondary text-white hover:text-white transition-colors ml-2 font-bold"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="bg-primary/5 dark:bg-white/5 p-4 rounded-lg mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-primary/70 dark:text-white/70">Preço por token:</span>
                      <span className="text-primary dark:text-white font-medium">R$ 1,00</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-primary/70 dark:text-white/70">Quantidade:</span>
                      <span className="text-primary dark:text-white font-medium">{quantity}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-primary/10 dark:border-white/10">
                      <span className="text-primary/90 dark:text-white/90 font-medium">Total:</span>
                      <span className="text-primary dark:text-white font-bold">
                        R$ {quantity.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={handleBuyTokens}
                  >
                    Comprar {selectedClub?.isStablecoin ? selectedClub.symbol : 'FanTokens'}
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <p className="text-primary/70 dark:text-white/70 mb-4 text-center">
                    Escaneie o QR Code abaixo para realizar o pagamento via PIX
                  </p>
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <img 
                      src={getRandomQRCode()} 
                      alt="QR Code de pagamento" 
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  <p className="text-xs text-primary/60 dark:text-white/60 mb-4 text-center">
                    Valor: R$ {quantity.toFixed(2).replace('.', ',')}
                  </p>
                  <Button 
                    className="w-full"
                    onClick={closeQRCode}
                    disabled={processingPayment}
                  >
                    {processingPayment ? (
                      <div className="flex items-center">
                        <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                        Processando...
                      </div>
                    ) : (
                      "Confirmar Pagamento"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 