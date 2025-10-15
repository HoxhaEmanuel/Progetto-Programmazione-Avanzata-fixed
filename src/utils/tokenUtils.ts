/**
 * Utility avanzato per la gestione dei token
 * Fornisce funzioni robuste per calcoli, validazioni e formattazione
 */

/**
 * Formatta il saldo dei token per la visualizzazione
 * Gestisce casi edge come NaN, Infinity, numeri negativi
 * Accetta sia number che string (per valori DECIMAL di Sequelize)
 */
export const formatTokenBalance = (balance: number | string): string => {
  // Converte stringa a numero se necessario
  const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
  
  if (!Number.isFinite(numBalance) || numBalance < 0) {
    return '0.00';
  }
  return numBalance.toFixed(2);
};



/**
 * Calcola i token rimanenti dopo una deduzione con validazione
 */
// Funzione rimossa: calculateRemainingTokens (non utilizzata)

/**
 * Calcola il costo di creazione di un modello basato sulle dimensioni
 */
export const calculateModelCreationCost = (width: number, height: number): number => {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error('Dimensioni modello non valide');
  }
  
  const totalCells = width * height;
  const baseCost = 0.05;
  const cost = totalCells * baseCost;
  return Math.round(cost * 100) / 100; // Arrotonda a 2 decimali
};

/**
 * Calcola il costo di aggiornamento celle
 */
export const calculateUpdateCost = (cellCount: number, isCreator: boolean = false): number => {
  if (!Number.isInteger(cellCount) || cellCount < 0) {
    throw new Error('Numero celle non valido');
  }
  
  if (isCreator) {
    return 0; // I creatori non pagano per modificare le proprie griglie
  }
  
  const baseCostPerCell = 0.35;
  const cost = cellCount * baseCostPerCell;
  return Math.round(cost * 100) / 100;
};

/**
 * Calcola il costo di esecuzione dell'algoritmo A*
 */
// Funzione rimossa: calculateExecutionCost (non utilizzata; il costo è calcolato in authMiddleware)

/**
 * Valida un importo di token
 */
// Funzione rimossa: validateTokenAmount (non utilizzata)

/**
 * Converte token da stringa a numero con validazione
 */
// Funzione rimossa: parseTokenAmount (non utilizzata)

/**
 * Formatta token per display con unità
 */
// Funzione rimossa: formatTokensWithUnit (non utilizzata)

/**
 * Calcola la percentuale di token utilizzati
 */
// Funzione rimossa: calculateTokenUsagePercentage (non utilizzata)