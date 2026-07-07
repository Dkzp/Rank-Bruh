require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const PDFDocument = require('pdfkit');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/chat', async (req, res) => {
    const { prompt } = req.body;
    console.log("Recebi o prompt:", prompt); // Log para debug

    try {
        // MUITO IMPORTANTE: Use gemini-1.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
        
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        console.log("IA respondeu com sucesso!");
        res.json({ resposta: text });

    } catch (error) {
        // ESSE LOG AQUI VAI TE MOSTRAR O ERRO REAL NO TERMINAL
        console.error("ERRO NA API DO GEMINI:", error.message);
        
        res.status(500).json({ 
            resposta: "Erro interno no servidor. Verifique o terminal do VS Code.",
            detalhe: error.message 
        });
    }
});

app.post('/gerar-pdf', (req, res) => {
    const { prompt, resposta } = req.body;
    try {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=conversa.pdf');
        doc.pipe(res);
        doc.fontSize(20).text("Conversa com Gemini", { align: 'center' });
        doc.moveDown().fontSize(12).text(`Pergunta: ${prompt}`);
        doc.moveDown().text(`Resposta: ${resposta}`);
        doc.end();
    } catch (e) {
        res.status(500).send("Erro ao gerar PDF");
    }
});

app.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});