const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Caminho absoluto para o arquivo do banco de dados
const DB_FILE = path.join(__dirname, 'db.json');

// Função para inicializar/ler o banco de dados
function initDB() {
    try {
        // Se o arquivo não existir, cria um novo
        if (!fs.existsSync(DB_FILE)) {
            const initialData = {
                users: [
                    { username: "admin", password: crypto.createHash('sha256').update("admin123").digest('hex') }
                ],
                alunos: [
                    {
                        "nome": "João Silva",
                        "nomeMae": "Maria Silva",
                        "nomePai": "José Silva",
                        "dataNascimento": "2010-05-15",
                        "sexo": "Masculino",
                        "escola": "Escola Municipal",
                        "serie": "5º ano",
                        "deficiencia": "Não",
                        "faixaSalarial": "1 a 2 salários mínimos",
                        "observacoes": "Nenhuma observação",
                        "codigo": "ALN-ABC123"
                    }
                ],
                historico: {
                    "0": ["Primeiro acompanhamento realizado em 10/01/2023"]
                },
                pagamentos: []
            };
            fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        
        // Se existir, lê o arquivo
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erro ao inicializar o banco de dados:', error);
        return {
            users: [],
            alunos: [],
            historico: {},
            pagamentos: []
        };
    }
}

// Carrega o banco de dados na memória ao iniciar
let db = initDB();

// Função para salvar no banco de dados
function saveDB() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    } catch (error) {
        console.error('Erro ao salvar o banco de dados:', error);
    }
}

// Rotas de autenticação
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios.' });
    
    if (db.users.find(u => u.username === username)) {
        return res.status(409).json({ error: 'Usuário já existe.' });
    }
    
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    db.users.push({ username, password: hash });
    saveDB();
    res.json({ success: true });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const user = db.users.find(u => u.username === username && u.password === hash);
    
    if (!user) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    res.json({ success: true });
});

// Rotas para alunos
app.get('/api/alunos', (req, res) => {
    res.json(db.alunos);
});

app.post('/api/alunos', (req, res) => {
    const aluno = req.body;
    
    // Gerar código único para o aluno
    if (!aluno.codigo) {
        aluno.codigo = 'ALN-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    }
    
    db.alunos.push(aluno);
    saveDB();
    res.json({ success: true, codigo: aluno.codigo });
});

// Rotas para histórico
app.get('/api/historico/:alunoIdx', (req, res) => {
    res.json(db.historico[req.params.alunoIdx] || []);
});

app.post('/api/historico/:alunoIdx', (req, res) => {
    const alunoIdx = req.params.alunoIdx;
    if (!db.historico[alunoIdx]) {
        db.historico[alunoIdx] = [];
    }
    
    db.historico[alunoIdx].push(req.body.comentario);
    saveDB();
    res.json({ success: true });
});

// Rota para pagamentos
app.post('/api/alunos/pagamento/:codigo', (req, res) => {
    const { codigo } = req.params;
    const { statusPagamento, mes } = req.body;
    
    const aluno = db.alunos.find(a => a.codigo === codigo);
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado.' });
    
    aluno.statusPagamento = statusPagamento;
    aluno.mes = mes;
    saveDB();
    res.json({ success: true });
});

// Rotas para servir as páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/consulta-aluno', (req, res) => {
    res.sendFile(path.join(__dirname, 'consulta-aluno.html'));
});

app.get('/pagamentos', (req, res) => {
    res.sendFile(path.join(__dirname, 'pagamentos.html'));
});

// Rota de fallback para arquivos estáticos
app.get('*', (req, res) => {
    const filePath = path.join(__dirname, req.path);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Página não encontrada');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Banco de dados inicializado em: ${DB_FILE}`);
    console.log(`Alunos cadastrados: ${db.alunos.length}`);
});