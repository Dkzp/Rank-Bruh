const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Quando o server.js usa app.use('/api/chat', chatRoutes), 
// esta rota abaixo se torna o caminho completo POST /api/chat
router.post('/', chatController.enviarMensagem);

// Esta se torna GET /api/chat/ranking
router.get('/ranking', chatController.obterRanking);

router.delete('/limpar', chatController.limparHistorico);

module.exports = router;
