"use client";
import { useState, useEffect, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import styles from "./page.module.css";

// Declare minikit type inline to avoid compilation issues
declare global {
  interface Window {
    minikit?: {
      cast: (options: { text: string; embeds?: { url: string }[] }) => Promise<void>;
    };
  }
}

type Player = 'X' | 'O' | null;
type GameBoard = Player[];
type GameStatus = 'playing' | 'player-wins' | 'computer-wins' | 'draw';

interface GameStats {
  playerWins: number;
  computerWins: number;
  draws: number;
  gamesPlayed: number;
}


export default function Home() {
  const [board, setBoard] = useState<GameBoard>(Array(9).fill(null));
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [stats, setStats] = useState<GameStats>({
    playerWins: 0,
    computerWins: 0,
    draws: 0,
    gamesPlayed: 0
  });
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [error, setError] = useState("");
  const [isAppReady, setIsAppReady] = useState(false);

  // Initialize MiniApp SDK
  useEffect(() => {
    const initializeMiniApp = async () => {
      try {
        // Wait for the app to be fully loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Signal that the app is ready to display
        await sdk.actions.ready();
        
        setIsAppReady(true);
        console.log('MiniApp initialized successfully');
      } catch (error) {
        console.error('Failed to initialize MiniApp:', error);
        // Set ready anyway for non-MiniApp environments
        setIsAppReady(true);
      }
    };

    initializeMiniApp();
  }, []);

  // Load stats from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem('tic-tac-toe-stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  // Save stats to localStorage
  const saveStats = useCallback((newStats: GameStats) => {
    localStorage.setItem('tic-tac-toe-stats', JSON.stringify(newStats));
    setStats(newStats);
  }, []);

  // Check for winning combinations
  const checkWinner = useCallback((board: GameBoard): Player => {
    const winningCombinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const [a, b, c] of winningCombinations) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  }, []);

  // Check if board is full
  const isBoardFull = useCallback((board: GameBoard): boolean => {
    return board.every(cell => cell !== null);
  }, []);

  // Computer AI - simple but effective strategy
  const getComputerMove = useCallback((board: GameBoard): number => {
    // Check if computer can win
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const testBoard = [...board];
        testBoard[i] = 'O';
        if (checkWinner(testBoard) === 'O') {
          return i;
        }
      }
    }

    // Check if player can win and block them
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const testBoard = [...board];
        testBoard[i] = 'X';
        if (checkWinner(testBoard) === 'X') {
          return i;
        }
      }
    }

    // Take center if available
    if (board[4] === null) {
      return 4;
    }

    // Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => board[i] === null);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // Take any available space
    const availableSpaces = board.map((cell, index) => cell === null ? index : null).filter(i => i !== null);
    return availableSpaces[Math.floor(Math.random() * availableSpaces.length)] as number;
  }, [checkWinner]);

  // Handle player move
  const handlePlayerMove = useCallback((index: number) => {
    if (board[index] !== null || gameStatus !== 'playing' || !isPlayerTurn) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const winner = checkWinner(newBoard);
    if (winner === 'X') {
      setGameStatus('player-wins');
      const newStats = {
        ...stats,
        playerWins: stats.playerWins + 1,
        gamesPlayed: stats.gamesPlayed + 1
      };
      saveStats(newStats);
      return;
    }

    if (isBoardFull(newBoard)) {
      setGameStatus('draw');
      const newStats = {
        ...stats,
        draws: stats.draws + 1,
        gamesPlayed: stats.gamesPlayed + 1
      };
      saveStats(newStats);
      return;
    }

    setIsPlayerTurn(false);
  }, [board, gameStatus, isPlayerTurn, checkWinner, isBoardFull, stats, saveStats]);

  // Computer move effect
  useEffect(() => {
    if (!isPlayerTurn && gameStatus === 'playing') {
      const timer = setTimeout(() => {
        const computerMoveIndex = getComputerMove(board);
        const newBoard = [...board];
        newBoard[computerMoveIndex] = 'O';
        setBoard(newBoard);

        const winner = checkWinner(newBoard);
        if (winner === 'O') {
          setGameStatus('computer-wins');
          const newStats = {
            ...stats,
            computerWins: stats.computerWins + 1,
            gamesPlayed: stats.gamesPlayed + 1
          };
          saveStats(newStats);
        } else if (isBoardFull(newBoard)) {
          setGameStatus('draw');
          const newStats = {
            ...stats,
            draws: stats.draws + 1,
            gamesPlayed: stats.gamesPlayed + 1
          };
          saveStats(newStats);
        } else {
          setIsPlayerTurn(true);
        }
      }, 500); // Small delay to make computer move visible

      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, gameStatus, board, getComputerMove, checkWinner, isBoardFull, stats, saveStats]);

  // Reset game
  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setGameStatus('playing');
    setIsPlayerTurn(true);
    setError("");
  }, []);

  // Post to Farcaster cast
  const postGameResult = useCallback(async () => {
    const gameResultText = gameStatus === 'player-wins' 
      ? `🎉 Just crushed the AI in Tic-Tac-Toe!`
      : gameStatus === 'computer-wins' 
      ? `🤖 The AI got me this time in Tic-Tac-Toe, but I'll be back!`
      : `⚖️ Fought to a draw with the AI in Tic-Tac-Toe!`;

    const winRate = stats.gamesPlayed > 0 ? Math.round((stats.playerWins / stats.gamesPlayed) * 100) : 0;
    
    const statsText = `\n\n📊 My Battle Stats:\n🏆 Wins: ${stats.playerWins}\n🤖 AI Wins: ${stats.computerWins}\n⚖️ Draws: ${stats.draws}\n📈 Win Rate: ${winRate}%\n🎮 Total Games: ${stats.gamesPlayed}`;
    
    const appLink = `\n\n🎯 Think you can beat the AI? Challenge it here!`;
    
    const castText = gameResultText + statsText + appLink;

    try {
      setError(""); // Clear any existing errors

      // Create the proper Warpcast compose URL
      const baseUrl = 'https://warpcast.com/~/compose';
      const params = new URLSearchParams({
        'text': castText,
        'embeds[]': window.location.origin
      });
      const composeUrl = `${baseUrl}?${params.toString()}`;

      // Use the Farcaster MiniApp SDK to open cast composer
      if (sdk?.actions?.openUrl) {
        console.log('Opening compose URL:', composeUrl);
        
        await sdk.actions.openUrl(composeUrl);
        
        console.log('Cast composer opened successfully');
        
      } else {
        // Non-MiniApp fallback - try to open in new window
        console.log('Fallback: opening compose URL in new window');
        
        const newWindow = window.open(composeUrl, '_blank', 'noopener,noreferrer');
        
        if (!newWindow) {
          throw new Error("Popup blocked - please allow popups for this site");
        }
      }
      
    } catch (error) {
      console.error("Failed to share cast:", error);
      
      // Fallback - copy to clipboard with better user feedback
      try {
        await navigator.clipboard.writeText(castText + `\n\nGame: ${window.location.origin}`);
        setError("📋 Cast text copied to clipboard! Open Warpcast to paste and share your result.");
      } catch (clipboardError) {
        console.error("Clipboard failed:", clipboardError);
        // Show the text so user can manually copy
        setError(`❌ Copy this text to share on Warpcast:\n\n${castText}\n\nGame: ${window.location.origin}`);
      }
    }
  }, [gameStatus, stats]);

  const getStatusMessage = () => {
    switch (gameStatus) {
      case 'player-wins':
        return '🎉 You won!';
      case 'computer-wins':
        return '🤖 Computer wins!';
      case 'draw':
        return '⚖️ It\'s a draw!';
      default:
        return isPlayerTurn ? 'Your turn (X)' : 'Computer thinking... (O)';
    }
  };

  const renderCell = (index: number) => {
    const cellValue = board[index];
    return (
      <button
        key={index}
        className={`${styles.cell} ${cellValue ? styles.cellFilled : ''}`}
        onClick={() => handlePlayerMove(index)}
        disabled={cellValue !== null || gameStatus !== 'playing' || !isPlayerTurn}
      >
        {cellValue}
      </button>
    );
  };

  // Show loading screen while MiniApp is initializing
  if (!isAppReady) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.gameContainer}>
            <h1 className={styles.title}>Tic-Tac-Toe vs Computer</h1>
            <p className={styles.subtitle}>Loading game...</p>
            <div className={styles.gameStatus}>🎮 Getting ready to play!</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.gameContainer}>
          <h1 className={styles.title}>Tic-Tac-Toe vs Computer</h1>
          
          <p className={styles.subtitle}>
            Challenge the AI and share your victories!
          </p>

          <div className={styles.statsContainer}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.playerWins}</span>
              <span className={styles.statLabel}>Your Wins</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.computerWins}</span>
              <span className={styles.statLabel}>Computer Wins</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.draws}</span>
              <span className={styles.statLabel}>Draws</span>
            </div>
          </div>

          <div className={styles.gameStatus}>
            {getStatusMessage()}
          </div>

          <div className={styles.gameBoard}>
            {board.map((_, index) => renderCell(index))}
          </div>

          <div className={styles.gameControls}>
            <button 
              onClick={resetGame} 
              className={styles.resetButton}
            >
              New Game
            </button>
            
            {gameStatus !== 'playing' && (
              <button 
                onClick={postGameResult} 
                className={styles.shareButton}
              >
                Share Result
              </button>
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
