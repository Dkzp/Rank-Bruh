require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const chatRoutes = require('./routes/chatRoutes'); // Importando suas rotas

const app = express();
const port = process.env.PORT || 3000;

// Middleware (IMPORTANTE: express.json deve vir antes das rotas)
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Conexão com o MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('📦 Conectado ao MongoDB!'))
  .catch((err) => console.error('❌ Erro no banco:', err));

// AQUI ESTÁ O SEGREDO: 
// Isso diz ao express que tudo dentro de chatRoutes começa com /api/chat
app.use('/api/chat', chatRoutes); 

app.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
