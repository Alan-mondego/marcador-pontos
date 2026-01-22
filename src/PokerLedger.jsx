import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Users, ArrowRightLeft, DollarSign, Trash2, Trophy, PlayCircle, Settings, Check, CheckCircle2, Crown, TrendingUp, TrendingDown, History, X, Scale, ArrowLeft, UserPlus, Lock, Zap } from 'lucide-react';

const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl shadow-xl ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = "primary", className = "", disabled = false, size = "md" }) => {
  const baseStyle = "rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  
  const sizes = {
    sm: "px-2 py-1.5 text-xs", // Reduzi um pouco para caber 3 botões
    md: "px-4 py-3",
    lg: "px-6 py-4 text-lg"
  };

  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-400",
    // Variantes específicas para o resultado
    bankerWin: "bg-slate-800 text-slate-400 border border-slate-600 hover:bg-red-900/30 hover:text-red-400 hover:border-red-500",
    bankerWinActive: "bg-red-600 text-white shadow-lg shadow-red-900/20 ring-2 ring-red-400 ring-offset-2 ring-offset-slate-900",
    playerWin: "bg-slate-800 text-slate-400 border border-slate-600 hover:bg-emerald-900/30 hover:text-emerald-400 hover:border-emerald-500",
    playerWinActive: "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900",
    // Variante Blackjack
    blackjack: "bg-slate-800 text-slate-400 border border-slate-600 hover:bg-purple-900/30 hover:text-purple-400 hover:border-purple-500",
    blackjackActive: "bg-purple-600 text-white shadow-lg shadow-purple-900/20 ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-900",
  };
  
  return (
    <button onClick={onClick} className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
};

export default function PokerLedger() {
  // Estado Principal
  const [players, setPlayers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [viewMode, setViewMode] = useState("players"); 

  // Estado da Rodada
  const [roundPlayers, setRoundPlayers] = useState({}); // { [id]: betAmount }
  const [baseBet, setBaseBet] = useState("");
  const [bankerId, setBankerId] = useState(null); 
  const [playerResults, setPlayerResults] = useState({}); // { [id]: 'banker_won' | 'player_won' | 'blackjack_2.5' }
  const [newPlayerName, setNewPlayerName] = useState("");

  const isRoundInProgress = useMemo(() => {
    return Object.keys(playerResults).length > 0;
  }, [playerResults]);

  // Inicializa jogadores na rodada
  useEffect(() => {
    if (players.length > 0) {
        setRoundPlayers(prev => {
            const next = { ...prev };
            players.forEach(p => {
                if (next[p.id] === undefined) {
                    next[p.id] = baseBet || ""; 
                }
            });
            return next;
        });
    }
  }, [players, baseBet]); 

  // Atualiza apostas EM MASSA
  const applyBaseBetToAll = (amount) => {
    setBaseBet(amount);
    setRoundPlayers(prev => {
        const next = {};
        Object.keys(prev).forEach(id => {
            next[id] = amount;
        });
        players.forEach(p => {
            if (!next[p.id]) next[p.id] = amount;
        });
        return next;
    });
  };

  const updatePlayerBet = (playerId, amount) => {
    setRoundPlayers(prev => ({ ...prev, [playerId]: amount }));
  };

  const setSpecificResult = (playerId, result) => {
      setPlayerResults(prev => {
          if (prev[playerId] === result) {
              const next = { ...prev };
              delete next[playerId];
              return next;
          }
          return { ...prev, [playerId]: result };
      });
  };

  // --- Ações ---

  const addPlayer = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    const newPlayer = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      avatar: newPlayerName.trim().charAt(0).toUpperCase()
    };
    setPlayers(prev => [...prev, newPlayer]);
    setRoundPlayers(prev => ({ ...prev, [newPlayer.id]: baseBet }));
    setNewPlayerName("");
    
    if (players.length === 0) setBankerId(newPlayer.id);
  };

  const removePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id));
    setTransactions(transactions.filter(t => t.from !== id && t.to !== id));
    const nextRound = { ...roundPlayers };
    delete nextRound[id];
    setRoundPlayers(nextRound);
    if (bankerId === id) setBankerId(null);
  };

  const finishRound = () => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newTransactions = [];

    if (!bankerId) return;
    
    Object.entries(roundPlayers).forEach(([playerId, betAmount]) => {
        if (playerId === bankerId) return;
        
        const amount = parseFloat(betAmount);
        if (!amount || amount <= 0) return;

        const result = playerResults[playerId];
        if (!result) return;

        if (result === 'banker_won') {
            newTransactions.push({
                id: Date.now() + Math.random(),
                from: playerId,
                to: bankerId,
                amount: amount,
                timestamp: timestamp,
                type: 'dealer_win_from_player'
            });
        } else if (result === 'player_won') {
            newTransactions.push({
                id: Date.now() + Math.random(),
                from: bankerId,
                to: playerId,
                amount: amount,
                timestamp: timestamp,
                type: 'dealer_pay_player'
            });
        } else if (result === 'blackjack_2.5') {
            // BLACKJACK: Paga 2.5x
            newTransactions.push({
                id: Date.now() + Math.random(),
                from: bankerId,
                to: playerId,
                amount: amount * 2.5,
                timestamp: timestamp,
                type: 'dealer_pay_bj'
            });
        }
    });
    setPlayerResults({}); 

    setTransactions(prev => [...newTransactions, ...prev]);
    setViewMode('ledger');
  };

  const undoLastTransaction = () => {
    if (transactions.length === 0) return;
    setTransactions(prev => prev.slice(1));
  };

  // --- Cálculos ---

  const balances = useMemo(() => {
    const matrix = {}; 
    const playerTotals = {}; 

    players.forEach(p => {
      matrix[p.id] = {};
      playerTotals[p.id] = { totalOwed: 0, totalToReceive: 0, net: 0 };
      players.forEach(other => { if (p.id !== other.id) matrix[p.id][other.id] = 0; });
    });

    transactions.forEach(t => {
      if (matrix[t.from] && matrix[t.from][t.to] !== undefined) {
        matrix[t.from][t.to] += t.amount;
      }
    });

    const debts = [];
    const processedPairs = new Set();

    players.forEach(p1 => {
      players.forEach(p2 => {
        if (p1.id === p2.id) return;
        const pairKey = [p1.id, p2.id].sort().join('-');
        if (processedPairs.has(pairKey)) return;
        processedPairs.add(pairKey);

        const p1OwesP2 = matrix[p1.id]?.[p2.id] || 0;
        const p2OwesP1 = matrix[p2.id]?.[p1.id] || 0;
        const net = p1OwesP2 - p2OwesP1;

        if (net > 0) {
          debts.push({ from: p1, to: p2, amount: net });
          playerTotals[p1.id].net -= net;
          playerTotals[p2.id].net += net;
        } else if (net < 0) {
          const absNet = Math.abs(net);
          debts.push({ from: p2, to: p1, amount: absNet });
          playerTotals[p2.id].net -= absNet;
          playerTotals[p1.id].net += absNet;
        }
      });
    });

    return { debts, playerTotals };
  }, [players, transactions]);

  // Cálculo do lucro PREVISTO
  const currentRoundProfit = useMemo(() => {
      if (!bankerId) return 0;
      let profit = 0;
      Object.entries(playerResults).forEach(([pid, result]) => {
          const amount = parseFloat(roundPlayers[pid] || 0);
          if (result === 'banker_won') profit += amount;
          if (result === 'player_won') profit -= amount;
          if (result === 'blackjack_2.5') profit -= amount * 2.5; // Desconta 2.5x a aposta
      });
      return profit;
  }, [bankerId, playerResults, roundPlayers]);

  const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // --- Helpers UI ---
  const isRoundValid = () => {
      if (!bankerId) return false;
      return Object.keys(playerResults).length > 0;
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-emerald-500/30 pb-24">
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-500/20 rotate-3">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
               ResenhaBet
              </h1>
              <p className="text-xs text-slate-400 font-medium">Gestor de Apostas</p>
            </div>
          </div>
          
          {viewMode === 'players' && players.length > 0 ? (
             <Button variant="ghost" onClick={() => setViewMode('round')} className="text-sm">
                <ArrowLeft className="w-4 h-4" /> Voltar
             </Button>
          ) : (
             <button 
                onClick={() => setViewMode('players')}
                disabled={isRoundInProgress}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${isRoundInProgress ? 'bg-slate-900/50 text-slate-600 cursor-not-allowed' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                title={isRoundInProgress ? "Finalize a rodada para editar jogadores" : "Configurações"}
             >
               {isRoundInProgress ? <Lock className="w-4 h-4" /> : <Settings className="w-5 h-5" />}
             </button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">

        {/* --- VIEW: PLAYERS (Cadastro) --- */}
        {(viewMode === 'players' || players.length < 2) && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <Card className="p-6 border-emerald-500/30 bg-emerald-900/10 mb-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    Gerenciar Jogadores
                </h2>
                <form onSubmit={addPlayer} className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Nome do jogador..."
                    className="flex-1 bg-slate-800 border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    autoFocus
                  />
                  <Button type="submit" disabled={!newPlayerName.trim()}>
                    <Plus className="w-5 h-5" />
                  </Button>
                </form>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {players.map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300">
                                    {p.avatar}
                                </div>
                                <span className="font-medium">{p.name}</span>
                            </div>
                            <button onClick={() => removePlayer(p.id)} className="text-slate-500 hover:text-red-400 p-2">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {players.length === 0 && <p className="text-center text-slate-500 py-4">Sem jogadores cadastrados.</p>}
                </div>
                {players.length >= 2 && (
                    <Button onClick={() => setViewMode('round')} className="w-full mt-6" variant="primary">
                        Confirmar e Iniciar Jogo
                    </Button>
                )}
             </Card>
          </div>
        )}

        {/* --- VIEW: NOVA RODADA --- */}
        {viewMode === 'round' && players.length >= 2 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                
                {/* 1. Configurações da Rodada */}
                <Card className="p-5 border-emerald-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Aposta Padrão</label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 5, 10].map(val => (
                                <button key={val} onClick={() => applyBaseBetToAll(val.toString())} className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-700 border border-slate-700 font-bold transition-colors">
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">R$</span>
                         <input 
                            type="number" 
                            inputMode="decimal"
                            step="0.10"
                            placeholder="0,00"
                            value={baseBet}
                            onChange={(e) => applyBaseBetToAll(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-2xl font-bold text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                         />
                    </div>
                </Card>

                {/* 2. Seleção da Banca */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-500 px-1 uppercase tracking-wider flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-500" />
                            Quem é a Banca?
                        </h3>
                        <button 
                            onClick={() => setViewMode('players')} 
                            disabled={isRoundInProgress}
                            className={`text-xs flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                                isRoundInProgress 
                                ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed' 
                                : 'text-emerald-400 hover:text-emerald-300 bg-emerald-900/20 border-emerald-900/50'
                            }`}
                        >
                            {isRoundInProgress ? <Lock className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                            {isRoundInProgress ? 'Rodada em Andamento' : 'Add Jogador'}
                        </button>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {players.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setBankerId(p.id)}
                            className={`
                                flex flex-col items-center gap-1 min-w-[70px] p-2 rounded-xl border transition-all
                                ${bankerId === p.id 
                                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 ring-1 ring-yellow-500 scale-105' 
                                    : 'bg-slate-800 border-slate-700 text-slate-400 opacity-60 hover:opacity-100'}
                            `}
                        >
                            <div className="font-bold text-xs truncate w-full text-center">{p.name}</div>
                            {bankerId === p.id && <Crown className="w-4 h-4" />}
                        </button>
                    ))}
                    </div>
                    

                    {/* LISTA DE CONFRONTOS */}
                    {bankerId && (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <h3 className="text-sm font-bold text-slate-500 px-1 uppercase tracking-wider flex items-center gap-2 mb-3 mt-4">
                                <Scale className="w-4 h-4 text-slate-400" />
                                Resultado dos Jogadores
                            </h3>
                            <div className="space-y-3">
                                {players.map(p => {
                                    if (p.id === bankerId) return null;
                                    const result = playerResults[p.id];
                                    const betVal = roundPlayers[p.id] || 0;

                                    return (
                                        <div key={p.id} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden shadow-sm">
                                            {/* Cabeçalho do Jogador */}
                                            <div className="flex items-center justify-between p-3 bg-slate-900/30 border-b border-slate-700/50">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-200 text-lg">{p.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded-lg border border-slate-700 focus-within:border-emerald-500 transition-colors">
                                                    <span className="text-xs text-slate-500 font-bold">R$</span>
                                                    <input 
                                                        type="number"
                                                        className="w-16 bg-transparent text-right text-lg font-bold font-mono text-white outline-none"
                                                        value={betVal}
                                                        onChange={(e) => updatePlayerBet(p.id, e.target.value)}
                                                        onClick={(e) => e.target.select()}
                                                    />
                                                </div>
                                            </div>

                                            {/* Botões de Decisão - Agora são 3 opções */}
                                            <div className="grid grid-cols-3 p-1.5 gap-2">
                                                {/* PERDEU */}
                                                <button 
                                                    onClick={() => setSpecificResult(p.id, 'banker_won')}
                                                    className={`
                                                        flex flex-col items-center justify-center gap-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all
                                                        ${result === 'banker_won' 
                                                            ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-400' 
                                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-600'}
                                                    `}
                                                >
                                                    {result === 'banker_won' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                                    <span>Banca</span>
                                                </button>

                                                {/* GANHOU (1x) */}
                                                <button 
                                                    onClick={() => setSpecificResult(p.id, 'player_won')}
                                                    className={`
                                                        flex flex-col items-center justify-center gap-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all
                                                        ${result === 'player_won' 
                                                            ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400' 
                                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-600'}
                                                    `}
                                                >
                                                    {result === 'player_won' ? <CheckCircle2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                                    <span>Jogador</span>
                                                </button>

                                                {/* BLACKJACK (2.5x) */}
                                                <button 
                                                    onClick={() => setSpecificResult(p.id, 'blackjack_2.5')}
                                                    className={`
                                                        flex flex-col items-center justify-center gap-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all
                                                        ${result === 'blackjack_2.5' 
                                                            ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-400 relative overflow-hidden' 
                                                            : 'bg-slate-800 text-purple-400 hover:bg-purple-900/20 border border-purple-500/30 hover:border-purple-500'}
                                                    `}
                                                >
                                                    {result === 'blackjack_2.5' && (
                                                        <div className="absolute inset-0 bg-white/10 animate-pulse" />
                                                    )}
                                                    {result === 'blackjack_2.5' ? <Zap className="w-4 h-4 fill-current" /> : <Zap className="w-4 h-4" />}
                                                    <span>BJ (2.5x)</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Flutuante de Ação */}
                <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-10">
                     <div className="bg-slate-900/95 backdrop-blur border border-slate-600 p-4 rounded-2xl shadow-2xl flex flex-col gap-3">
                        
                        {/* Resumo Dinâmico da Rodada */}
                        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                             <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                Resultado da Banca ({bankerId ? players.find(p=>p.id===bankerId)?.name : '?'})
                            </span>
                            <div className="flex items-center gap-2">
                                {currentRoundProfit !== 0 && (
                                    currentRoundProfit > 0 
                                    ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    : <TrendingDown className="w-4 h-4 text-red-400" />
                                )}
                                <span className={`text-xl font-bold ${currentRoundProfit > 0 ? 'text-emerald-400' : currentRoundProfit < 0 ? 'text-red-400' : 'text-white'}`}>
                                    {(currentRoundProfit > 0 ? '+' : '') + formatMoney(currentRoundProfit)}
                                </span>
                            </div>
                        </div>

                        <Button 
                            onClick={finishRound} 
                            disabled={!isRoundValid()}
                            className="w-full shadow-emerald-500/20 py-3"
                        >
                            Confirmar Rodada
                        </Button>
                     </div>
                </div>
                <div className="h-32"></div>
            </div>
        )}

        {/* --- VIEW: LEDGER (Saldos) --- */}
        {viewMode === 'ledger' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                <Card className="bg-slate-800 border-none p-4">
                     <h2 className="text-center text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">Dívidas Ativas</h2>
                     
                     {balances.debts.length === 0 ? (
                        <div className="text-center py-8 opacity-50">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                            <p>Tudo quitado!</p>
                        </div>
                     ) : (
                         <div className="grid gap-3">
                             {balances.debts.map((debt, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border-l-4 border-l-red-500">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white">{debt.from.name}</span>
                                        <span className="text-slate-500 text-xs">deve para</span>
                                        <span className="font-bold text-emerald-400">{debt.to.name}</span>
                                    </div>
                                    <span className="font-mono font-bold text-lg">{formatMoney(debt.amount)}</span>
                                </div>
                             ))}
                         </div>
                     )}
                </Card>

                {/* Resumo por Jogador */}
                <h3 className="text-sm font-bold text-slate-500 mt-6 px-1 uppercase tracking-wider">Saldo Líquido</h3>
                <div className="grid grid-cols-2 gap-2">
                    {players.map(p => {
                        const net = balances.playerTotals[p.id]?.net || 0;
                        return (
                            <div key={p.id} className={`p-3 rounded-lg border ${net >= 0 ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
                                <div className="text-xs text-slate-400 font-bold mb-1">{p.name}</div>
                                <div className={`text-lg font-bold ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {net > 0 ? '+' : ''}{formatMoney(net)}
                                </div>
                            </div>
                        )
                    })}
                </div>

                 <Button variant="secondary" onClick={() => setViewMode('round')} className="w-full py-4 mt-6">
                    <Plus className="w-5 h-5" /> Nova Rodada
                 </Button>
            </div>
        )}

        {/* --- VIEW: HISTÓRICO --- */}
        {viewMode === 'history' && (
            <div className="space-y-4 animate-in fade-in">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold">Histórico</h2>
                    {transactions.length > 0 && (
                        <button onClick={undoLastTransaction} className="text-red-400 text-sm hover:underline">
                            Desfazer Última
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    {transactions.slice().reverse().map((t, idx) => {
                        const fromName = players.find(p => p.id === t.from)?.name || '???';
                        const toName = players.find(p => p.id === t.to)?.name || '???';
                        
                        let txTypeLabel = '';
                        let colorClass = 'text-slate-400';
                        
                        if (t.type === 'dealer_pay_bj') {
                             txTypeLabel = 'BJ (x2.5)';
                             colorClass = 'text-purple-400';
                        } else if (t.type === 'dealer_win_from_player') {
                             txTypeLabel = 'Banca Ganhou';
                             colorClass = 'text-red-400';
                        } else if (t.type === 'dealer_pay_player') {
                             txTypeLabel = 'Jogador Ganhou';
                             colorClass = 'text-emerald-400';
                        }
                        
                        return (
                            <div key={t.id || idx} className="bg-slate-800 p-3 rounded flex justify-between items-center text-sm border border-slate-700">
                                <div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-red-300 font-bold">{fromName}</span>
                                        <span className="text-slate-500 mx-1">➔</span>
                                        <span className="text-emerald-300 font-bold">{toName}</span>
                                    </div>
                                    <span className={`text-[10px] bg-slate-900 px-1.5 py-0.5 rounded ${colorClass} font-bold mt-1 inline-block`}>
                                        {txTypeLabel}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">{formatMoney(t.amount)}</div>
                                    <div className="text-[10px] text-slate-500">{t.timestamp}</div>
                                </div>
                            </div>
                        );
                    })}
                    {transactions.length === 0 && <p className="text-center text-slate-500 mt-10">Nenhum registro.</p>}
                </div>
            </div>
        )}

      </main>

      {/* Navegação Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe z-30">
        <div className="max-w-md mx-auto grid grid-cols-3 h-16">
            <button 
                onClick={() => setViewMode('round')}
                className={`flex flex-col items-center justify-center gap-1 ${viewMode === 'round' ? 'text-emerald-400' : 'text-slate-500'}`}
            >
                <PlayCircle className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase">Jogar</span>
            </button>
            <button 
                onClick={() => setViewMode('ledger')}
                className={`flex flex-col items-center justify-center gap-1 ${viewMode === 'ledger' ? 'text-emerald-400' : 'text-slate-500'}`}
            >
                <ArrowRightLeft className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase">Saldos</span>
            </button>
            <button 
                onClick={() => setViewMode('history')}
                className={`flex flex-col items-center justify-center gap-1 ${viewMode === 'history' ? 'text-emerald-400' : 'text-slate-500'}`}
            >
                <History className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase">Histórico</span>
            </button>
        </div>
      </nav>

    </div>
  );
}