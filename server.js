require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Configurações Iniciais
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Conexão com o Banco de Dados (MongoDB Atlas)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('📦 Conectado ao MongoDB!'))
  .catch((err) => console.error('❌ Erro ao conectar no banco:', err));

// Chamando as Rotas que você criou na pasta /routes
// Agora, todas as URLs vão começar com /api/chat
app.use('/api/chat', chatRoutes);

// Rota extra para o PDF (se você não moveu ela para o controller ainda)
// Se moveu, pode apagar esse bloco abaixo
const PDFDocument = require('pdfkit');
app.post('/api/gerar-pdf', (req, res) => {
    const { pergunta, resposta } = req.body;
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=conversa.pdf');
    doc.pipe(res);
    doc.fontSize(16).text("Relatório da Conversa", { align: 'center' });
    doc.moveDown().fontSize(12).text(`Pergunta: ${pergunta}`);
    doc.moveDown().text(`Resposta: ${resposta}`);
    doc.end();
});

// Ligar o Servidor
app.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});