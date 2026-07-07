const Mensagem = require('../models/Mensagem');
const Jogador = require('../models/Jogador'); // Importar o novo modelo
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY?.trim());

// FUNÇÃO LOCAL: Adicionar XP ao Banco de Dados
async function adicionarXP({ nickname, quantidade }) {
    try {
        console.log(`🎁 Dando ${quantidade} XP para ${nickname}`);
        const jogador = await Jogador.findOneAndUpdate(
            { nome: nickname },
            { $inc: { xp: quantidade } },
            { upsert: true, new: true }
        );
        return { mensagem: `XP atualizado! ${nickname} agora tem ${jogador.xp} XP.` };
    } catch (e) {
        return { erro: "Erro ao atualizar XP: " + e.message };
    }
}

// Configuração das Ferramentas (Tools)
const tools = [{
    functionDeclarations: [{
        name: "adicionarXP",
        description: "Adiciona ou remove pontos de experiência (XP) de um jogador baseado em suas ações ou acertos.",
        parameters: {
            type: "OBJECT",
            properties: {
                nickname: { type: "STRING", description: "O apelido do usuário." },
                quantidade: { type: "NUMBER", description: "A quantidade de XP (positivo para ganhar, negativo para perder)." }
            },
            required: ["nickname", "quantidade"]
        }
    }]
}];

exports.enviarMensagem = async (req, res) => {
    try {
        const { pergunta, nickname } = req.body; // Agora recebemos o nickname do front
        if (!pergunta || !nickname) return res.status(400).json({ erro: "Nickname e Pergunta são obrigatórios." });

        const historicoDB = await Mensagem.find().sort({ dataHora: 1 }).limit(10).lean();
        let history = historicoDB.map(m => ({
            role: m.role === "model" ? "model" : "user",
            parts: [{ text: m.parts[0]?.text || "" }]
        })).filter(m => m.parts[0].text !== "");

        while (history.length > 0 && history[0].role !== 'user') { history.shift(); }

        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.5-flash", // Modelo recomendado
            tools: tools,
            systemInstruction: `Você é o Guardião de um cofre de conhecimento. 
            Seu objetivo é propor charadas de tecnologia. 
            REGRAS:
            1. Se o usuário acertar a charada, você DEVE chamar a função 'adicionarXP' com 50 pontos para o nickname '${nickname}'.
            2. Se o usuário pedir a resposta ou desistir, tire 10 pontos usando a função.
            3. Nunca diga o total de pontos que ele tem, apenas avise se ganhou ou perdeu.
            4. Seja misterioso e divertido.`
        });

        const chat = model.startChat({ history });
        let result = await chat.sendMessage(pergunta);
        let response = result.response;

        // Lógica de Function Calling (loop simples)
        const calls = response.functionCalls();
        if (calls && calls.length > 0) {
            for (const call of calls) {
                if (call.name === "adicionarXP") {
                    const funcResult = await adicionarXP(call.args);
                    result = await chat.sendMessage([{
                        functionResponse: { name: "adicionarXP", response: funcResult }
                    }]);
                    response = result.response;
                }
            }
        }

        const textoFinal = response.text();
        await Mensagem.create([
            { role: "user", parts: [{ text: pergunta }] },
            { role: "model", parts: [{ text: textoFinal }] }
        ]);

        return res.json({ resposta: textoFinal });

    } catch (error) {
        console.error("ERRO:", error);
        return res.status(500).json({ erro: error.message });
    }
};

// NOVA ROTA: Ranking
exports.obterRanking = async (req, res) => {
    try {
        const topJogadores = await Jogador.find().sort({ xp: -1 }).limit(10);
        res.json(topJogadores);
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
};

exports.limparHistorico = async (req, res) => {
    await Mensagem.deleteMany({});
    res.json({ mensagem: "Limpo" });
};