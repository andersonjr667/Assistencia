
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');


const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));


const DB_FILE = path.join(__dirname, 'db.json');

function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], alunos: [], historico: {}, chat: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}



app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios.' });
    const db = readDB();
    if (db.users.find(u => u.username === username)) {
        return res.status(409).json({ error: 'Usuário já existe.' });
    }
    // Criptografa a senha antes de salvar
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

// Middleware simples de autenticação por token (simulado via localStorage, para exemplo)
// Em produção, use JWT ou sessão!
app.post('/api/check-auth', (req, res) => {
    const { username } = req.body;
    const db = readDB();
    if (db.users.find(u => u.username === username)) {
        res.json({ auth: true });
    } else {
        res.status(401).json({ auth: false });
    }
});

// CRUD para alunos
app.get('/api/alunos', (req, res) => {
    const db = readDB();
    res.json(db.alunos);
});

app.post('/api/alunos', (req, res) => {
    const db = readDB();
    db.alunos.push(req.body);
    writeDB(db);
    res.json({ success: true });
});

// Histórico de acompanhamento
app.get('/api/historico/:alunoIdx', (req, res) => {
    const db = readDB();
    res.json(db.historico[req.params.alunoIdx] || []);
});

app.post('/api/historico/:alunoIdx', (req, res) => {
    const db = readDB();
    if (!db.historico[req.params.alunoIdx]) db.historico[req.params.alunoIdx] = [];
    db.historico[req.params.alunoIdx].push(req.body.comentario);
    writeDB(db);
    res.json({ success: true });
});

// Chat simples
app.get('/api/chat', (req, res) => {
    const db = readDB();
    res.json(db.chat);
});

app.post('/api/chat', (req, res) => {
    const db = readDB();
    db.chat.push(req.body);
    writeDB(db);
    res.json({ success: true });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
