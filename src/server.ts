import http from 'http';
import app from './app';
import { initDb } from './models';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 1. Sincronizza i modelli con il database prima di avviare il server
    await initDb();

    // 2. Crea e avvia il server HTTP
    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`[SERVER] Server in esecuzione sulla porta ${PORT}`);
    });
  } catch (error) {
    console.error('[ERROR] Impossibile avviare il server:', error);
    process.exit(1);
  }
};

startServer();

