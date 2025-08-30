import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Trophy, RotateCcw } from 'lucide-react';

interface Card {
  id: number;
  image: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface Score {
  name: string;
  time: number;
  date: string;
}

const CARD_IMAGES = [
  '/public/Quadro-01.png',
  '/public/Quadro-02.png',
  '/public/Quadro-03.png',
  '/public/Quadro-04.png',
  '/public/Quadro-05.png',
  '/public/Quadro-06.png'
];

function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu');
  const [playerName, setPlayerName] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [finalTime, setFinalTime] = useState(0);
  const [scores, setScores] = useState<Score[]>([]);

  // Load scores from localStorage
  useEffect(() => {
    const savedScores = localStorage.getItem('memoryGameScores');
    if (savedScores) {
      setScores(JSON.parse(savedScores));
    }
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing' && startTime) {
      interval = setInterval(() => {
        setCurrentTime(Date.now() - startTime);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameState, startTime]);

  // Initialize game
  const initializeGame = useCallback(() => {
    const gameCards: Card[] = [];
    CARD_IMAGES.forEach((image, index) => {
      // Add two cards for each image (pair)
      gameCards.push(
        { id: index * 2, image, isFlipped: false, isMatched: false },
        { id: index * 2 + 1, image, isFlipped: false, isMatched: false }
      );
    });
    
    // Shuffle cards
    for (let i = gameCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]];
    }
    
    setCards(gameCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setStartTime(Date.now());
    setCurrentTime(0);
  }, []);

  const startGame = () => {
    if (playerName.trim()) {
      setGameState('playing');
      initializeGame();
    }
  };

  const flipCard = (cardId: number) => {
    if (flippedCards.length === 2) return;
    if (flippedCards.includes(cardId)) return;
    if (cards[cardId].isMatched) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    setCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, isFlipped: true } : card
    ));

    if (newFlippedCards.length === 2) {
      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards[firstId];
      const secondCard = cards[secondId];

      if (firstCard.image === secondCard.image) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === firstId || card.id === secondId 
              ? { ...card, isMatched: true }
              : card
          ));
          setMatchedPairs(prev => prev + 1);
          setFlippedCards([]);
        }, 1000);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === firstId || card.id === secondId 
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  // Check for game completion
  useEffect(() => {
    if (matchedPairs === 6 && gameState === 'playing') {
      const endTime = Date.now();
      const gameTime = endTime - (startTime || endTime);
      setFinalTime(gameTime);
      
      // Save score
      const newScore: Score = {
        name: playerName,
        time: gameTime,
        date: new Date().toLocaleDateString()
      };
      
      const updatedScores = [...scores, newScore]
        .sort((a, b) => a.time - b.time)
        .slice(0, 10); // Keep top 10
      
      setScores(updatedScores);
      localStorage.setItem('memoryGameScores', JSON.stringify(updatedScores));
      
      setGameState('finished');
    }
  }, [matchedPairs, gameState, startTime, playerName, scores]);

  const resetGame = () => {
    setGameState('menu');
    setPlayerName('');
    setCards([]);
    setFlippedCards([]);
    setMatchedPairs(0);
    setStartTime(null);
    setCurrentTime(0);
    setFinalTime(0);
  };

  const formatTime = (time: number) => {
    const seconds = Math.floor(time / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const milliseconds = Math.floor((time % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
        {/* Header with logo */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="mb-12 animate-pulse">
            <img 
              src="/public/logo01.png" 
              alt="Logo" 
              className="h-32 md:h-40 lg:h-48 w-auto drop-shadow-2xl"
            />
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 max-w-md w-full">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Jogo da Memória
            </h1>
            
            <div className="space-y-6">
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-3">
                  Digite seu nome:
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
                  placeholder="Seu nome aqui..."
                  maxLength={20}
                />
              </div>
              
              <button
                onClick={startGame}
                disabled={!playerName.trim()}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
              >
                <img 
                  src="/public/iniciar-jogo.png" 
                  alt="Iniciar Jogo" 
                  className="h-8 w-auto mx-auto"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer with sponsors */}
        <div className="p-4 border-t border-cyan-500/20">
          <img 
            src="/public/patrocinadores.png" 
            alt="Patrocinadores" 
            className="h-16 w-auto mx-auto opacity-80"
          />
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        {/* Header with timer and player info */}
        <div className="flex justify-between items-center mb-6 bg-slate-800/50 backdrop-blur-lg rounded-2xl p-4 border border-cyan-500/30">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-300 font-medium">{playerName}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-cyan-400">
            <Clock className="w-5 h-5" />
            <span className="font-mono text-lg font-bold">
              {formatTime(currentTime)}
            </span>
          </div>
          
          <div className="text-cyan-300">
            <span className="text-sm">Pares: </span>
            <span className="font-bold">{matchedPairs}/6</span>
          </div>
        </div>

        {/* Game board */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 max-w-6xl mx-auto">
          {cards.map((card, index) => (
            <div
              key={card.id}
              onClick={() => flipCard(index)}
              className={`
                aspect-square relative cursor-pointer transform transition-all duration-500 hover:scale-105
                ${card.isMatched ? 'opacity-75 scale-95' : ''}
                ${flippedCards.includes(index) || card.isMatched ? 'rotate-y-180' : ''}
              `}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Card back */}
              <div className={`
                absolute inset-0 w-full h-full rounded-xl border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/20 backface-hidden
                ${!(flippedCards.includes(index) || card.isMatched) ? 'block' : 'hidden'}
              `}>
                <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-2 flex items-center justify-center">
                  <img 
                    src="/public/equatorial.png" 
                    alt="Card Back" 
                    className="w-full h-full object-contain opacity-80"
                  />
                </div>
              </div>

              {/* Card front */}
              <div className={`
                absolute inset-0 w-full h-full rounded-xl border-2 border-cyan-400/50 shadow-lg shadow-cyan-400/30 backface-hidden rotate-y-180
                ${flippedCards.includes(index) || card.isMatched ? 'block' : 'hidden'}
              `}>
                <div className="w-full h-full bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-2 flex items-center justify-center">
                  <img 
                    src={card.image} 
                    alt="Card" 
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reset button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={resetGame}
            className="flex items-center space-x-2 bg-slate-700/50 hover:bg-slate-600/50 text-cyan-300 px-6 py-3 rounded-xl transition-all duration-300 border border-cyan-500/30 hover:border-cyan-400/50"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Reiniciar</span>
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="mb-6">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
              <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
                Parabéns!
              </h2>
              <p className="text-cyan-300 text-lg">
                {playerName}, você completou o jogo!
              </p>
            </div>
            
            <div className="bg-slate-700/50 rounded-2xl p-6 mb-8 border border-cyan-500/20">
              <p className="text-cyan-400 text-sm mb-2">Seu tempo:</p>
              <p className="text-3xl font-mono font-bold text-white">
                {formatTime(finalTime)}
              </p>
            </div>
          </div>

          {/* Ranking */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-cyan-300 mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Ranking dos Melhores Tempos
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {scores.map((score, index) => (
                <div
                  key={index}
                  className={`
                    flex justify-between items-center p-3 rounded-xl border
                    ${score.name === playerName && score.time === finalTime
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                      : 'bg-slate-700/30 border-slate-600/30 text-slate-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${index === 0 ? 'bg-yellow-500 text-yellow-900' :
                        index === 1 ? 'bg-gray-400 text-gray-900' :
                        index === 2 ? 'bg-orange-600 text-orange-100' :
                        'bg-slate-600 text-slate-300'}
                    `}>
                      {index + 1}
                    </span>
                    <span className="font-medium">{score.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold">
                      {formatTime(score.time)}
                    </div>
                    <div className="text-xs opacity-70">
                      {score.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                setGameState('playing');
                initializeGame();
              }}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/25"
            >
              Jogar Novamente
            </button>
            <button
              onClick={resetGame}
              className="flex-1 bg-slate-700/50 hover:bg-slate-600/50 text-cyan-300 font-bold py-3 px-6 rounded-xl transition-all duration-300 border border-cyan-500/30 hover:border-cyan-400/50"
            >
              Menu Principal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;