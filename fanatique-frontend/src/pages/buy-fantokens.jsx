import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volleyball as Football, ArrowLeft, Search, Wallet, X, ChevronRight, Receipt, ShoppingCart, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import clubApi from '../api/club';
import contractApi from '../api/contract';
import transactionApi from '../api/transaction';
import toast from 'react-hot-toast';
import { WalletContext } from '../contexts/WalletContextDef';

export default function BuyFantokensPage() {
  const navigate = useNavigate();
  const { account, isConnected, connectWallet } = useContext(WalletContext);
  const [loading, setLoading] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClub, setSelectedClub] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showQRCode, setShowQRCode] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [walletTokens, setWalletTokens] = useState([]);
  const [activeTab, setActiveTab] = useState('comprar'); // 'comprar' ou 'transacoes'
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
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
    const fetchTransactions = async () => {
      if (activeTab === 'transacoes' && account) {
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

    fetchTransactions();
  }, [activeTab, account]);

  // Função para obter o saldo de tokens de um clube específico
  const getClubTokenBalance = (clubId) => {
    const token = walletTokens.find(token => token.club_id === clubId.toString());
    return token ? parseFloat(token.balance) : 0;
  };

  // Função para obter o símbolo do token de um clube
  const getClubTokenSymbol = (club) => {
    const token = walletTokens.find(token => token.club_id === club.id.toString());
    return token ? token.tokenSymbol : club.tokenSymbol || club.name.substring(0, 3).toUpperCase();
  };

  const handleSelectClub = (club) => {
    setSelectedClub(club);
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
      
      // Preparar dados para a transferência
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
      
      // Atualizar transações
      if (activeTab === 'transacoes') {
        const data = await transactionApi.getUserTransactions();
        setTransactions(data);
      }
      
      setShowQRCode(false);
      setShowModal(false);
      setQuantity(1);
      toast.success(`Compra de ${quantity} FanTokens do ${selectedClub.name} realizada com sucesso!`);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Falha ao processar o pagamento. Tente novamente.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Gerar QR Code aleatório
  const getRandomQRCode = () => {
    const randomNum = Math.floor(Math.random() * 1000);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=fanatique-payment-${selectedClub?.id}-${quantity}-${randomNum}`;
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

  if (loading && activeTab === 'comprar') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fafafa] dark:bg-[#0d0117]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="mr-2"
          >
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-2xl font-bold text-primary dark:text-white">FanTokens</h1>
        </div>

        {/* Tabs de navegação */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button 
            variant={activeTab === 'comprar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('comprar')}
            className={`
              rounded-full font-medium 
              ${activeTab === 'comprar' 
                ? 'bg-primary text-white shadow-md' 
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/30'}
            `}
          >
            <ShoppingCart size={16} className="mr-2" />
            Comprar Tokens
          </Button>
          <Button 
            variant={activeTab === 'transacoes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('transacoes')}
            className={`
              rounded-full font-medium
              ${activeTab === 'transacoes' 
                ? 'bg-primary text-white shadow-md' 
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/30'}
            `}
          >
            <Receipt size={16} className="mr-2" />
            Histórico de Transações
          </Button>
        </div>

        {activeTab === 'comprar' ? (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-primary dark:text-white mb-4">
              PRINCIPAIS TOKENS EM MOVIMENTO
            </h2>
            
            {/* Search input */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-primary/50 dark:text-white/50" />
              </div>
              <input
                type="text"
                placeholder="Buscar clube..."
                className="w-full pl-10 pr-4 py-2 border border-primary/20 dark:border-white/20 rounded-lg bg-white dark:bg-[#150924] text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Tokens List (novo formato) */}
            <div className="flex flex-col space-y-2">
              {filteredClubs.map(club => (
                <div 
                  key={club.id}
                  onClick={() => handleSelectClub(club)}
                  className="bg-[#071e36] dark:bg-[#071e36] p-4 rounded-lg flex items-center justify-between cursor-pointer hover:bg-[#0a2846] dark:hover:bg-[#0a2846] transition-colors"
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
                        {club.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right mr-4">
                      <p className="font-bold text-white">
                        {getClubTokenBalance(club.id)} {getClubTokenSymbol(club)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {getClubTokenBalance(club.id) ? `${getClubTokenBalance(club.id)} CHZ • ~${(getClubTokenBalance(club.id) * 0.8).toFixed(2)} EUR` : '0 CHZ • ~0 EUR'}
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>

            {filteredClubs.length === 0 && (
              <div className="text-center py-10">
                <Football size={36} className="mx-auto text-primary/30 dark:text-white/30 mb-2" />
                <p className="text-primary/70 dark:text-white/70">
                  Nenhum clube encontrado com esse nome.
                </p>
              </div>
            )}
          </div>
        ) : (
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
                {transactions.map(transaction => (
                  <div 
                    key={transaction.id}
                    className="bg-[#071e36] dark:bg-[#071e36] p-4 rounded-lg flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-white overflow-hidden mr-4 flex-shrink-0">
                        {transaction.club?.image ? (
                          <img 
                            src={transaction.club.image} 
                            alt={transaction.club.name} 
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
                          {transaction.club?.name || 'Clube Desconhecido'}
                        </p>
                        <div className="flex items-center text-xs text-gray-400">
                          <span className="inline-flex items-center">
                            <Receipt size={12} className="mr-1" />
                            {formatHash(transaction.hash)}
                          </span>
                          {transaction.hash && (
                            <a 
                              href={`https://explorer.chiliz.com/tx/${transaction.hash}`} 
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
                        {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para compra de tokens */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1c0c2e] rounded-lg w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-primary dark:text-white">
                  {showQRCode ? "Realize o Pagamento" : `${selectedClub.name}`}
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
                      {getClubTokenBalance(selectedClub.id)} {getClubTokenSymbol(selectedClub)}
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-primary/80 dark:text-white/80 mb-2 text-center">
                      Quantidade de FanTokens
                    </label>
                    <div className="flex items-center justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                        className="px-3 mr-2 py-1 hover:bg-secondary hover:text-white transition-colors font-bold"
                      >
                        -
                      </Button>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 mx-2 py-2 text-center border border-primary/20 dark:border-white/20 rounded-md bg-white dark:bg-[#150924] text-primary dark:text-white focus:outline-none"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3 py-1 hover:bg-secondary hover:text-white transition-colors ml-2 font-bold"
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
                    Comprar FanTokens
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