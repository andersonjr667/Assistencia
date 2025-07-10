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

// Configuração crucial para servir arquivos estáticos corretamente
app.use(express.static(path.join(__dirname)));

const DB_FILE = path.join(__dirname, 'db.json');

function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ 
            users: [], 
            alunos: [], 
            historico: {}, 
            pagamentos: [] 
        }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Rotas de autenticação
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios.' });
    
    const db = readDB();
    if (db.users.find(u => u.username === username)) {
        return res.status(409).json({ error: 'Usuário já existe.' });
    }
    
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    db.users.push({ username, password: hash });
    writeDB(db);
    res.json({ success: true });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const db = readDB();
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const user = db.users.find(u => u.username === username && u.password === hash);
    
    if (!user) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    res.json({ success: true });
});

// Rotas para alunos
app.get('/api/alunos', (req, res) => {
    const db = readDB();
    res.json(db.alunos);
});

app.post('/api/alunos', (req, res) => {
    const db = readDB();
    const aluno = req.body;
    
    // Gerar código único para o aluno
    if (!aluno.codigo) {
        aluno.codigo = 'ALN-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    }
    
    db.alunos.push(aluno);
    writeDB(db);
    res.json({ success: true, codigo: aluno.codigo });
});

// Rotas para histórico
app.get('/api/historico/:alunoIdx', (req, res) => {
    const db = readDB();
    res.json(db.historico[req.params.alunoIdx] || []);
});

app.post('/api/historico/:alunoIdx', (req, res) => {
    const db = readDB();
    if (!db.historico[req.params.alunoIdx]) {
        db.historico[req.params.alunoIdx] = [];
    }
    
    db.historico[req.params.alunoIdx].push(req.body.comentario);
    writeDB(db);
    res.json({ success: true });
});

// Rota para pagamentos (CRUCIAL)
app.post('/api/alunos/pagamento/:codigo', (req, res) => {
    const { codigo } = req.params;
    const { statusPagamento, mes } = req.body;
    const db = readDB();
    
    const alunoIndex = db.alunos.findIndex(a => a.codigo === codigo);
    if (alunoIndex === -1) {
        return res.status(404).json({ error: 'Aluno não encontrado.' });
    }
    
    db.alunos[alunoIndex].statusPagamento = statusPagamento;
    db.alunos[alunoIndex].mes = mes;
    
    writeDB(db);
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
});
