
// --- Funções para integração com backend (db.json via API) ---
async function getAlunosAPI() {
    const res = await fetch('http://localhost:3000/api/alunos');
    return await res.json();
}

async function addAlunoAPI(aluno) {
    const res = await fetch('http://localhost:3000/api/alunos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aluno)
    });
    return await res.json();
}

async function getHistoricoAPI(idx) {
    const res = await fetch(`http://localhost:3000/api/historico/${idx}`);
    return await res.json();
}

async function addHistoricoAPI(idx, comentario) {
    const res = await fetch(`http://localhost:3000/api/historico/${idx}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario })
    });
    return await res.json();
}





async function gerarCodigoAluno() {
    // Gera um código único: AAA-9999 (exemplo), checando se já existe
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let codigo;
    let existe = true;
    const alunos = await getAlunosAPI();
    while (existe) {
        codigo = '';
        for (let i = 0; i < 3; i++) codigo += letras[Math.floor(Math.random() * letras.length)];
        codigo += '-';
        codigo += Math.floor(1000 + Math.random() * 9000);
        existe = alunos.some(a => (a.codigo || '').toUpperCase() === codigo);
    }
    return codigo;
}

document.getElementById('cadastro-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!isLoggedIn()) {
        alert('Você precisa estar logado para cadastrar um aluno.');
        return;
    }
    const aluno = {
        nome: document.getElementById('nome').value.trim(),
        nomeMae: document.getElementById('nomeMae').value.trim(),
        nomePai: document.getElementById('nomePai').value.trim(),
        dataNascimento: document.getElementById('dataNascimento').value,
        sexo: document.getElementById('sexo').value,
        escola: document.getElementById('escola').value.trim(),
        serie: document.getElementById('serie').value.trim(),
        deficiencia: document.getElementById('deficiencia').value,
        faixaSalarial: document.getElementById('faixaSalarial').value,
        observacoes: document.getElementById('observacoes').value.trim(),
        codigo: await gerarCodigoAluno()
    };
    await addAlunoAPI(aluno);
    this.reset();
    renderTabela();
    // Melhoria 1: Confirmação visual
    const div = document.createElement('div');
    div.className = 'alert alert-success mt-3';
    div.textContent = 'Aluno cadastrado com sucesso!';
    this.parentNode.insertBefore(div, this.nextSibling);
    setTimeout(() => div.remove(), 2500);
});
// Melhoria 4: Mostrar usuário logado e botão de logout mais visível (sem duplicar)

// Função para garantir exibição do usuário logado no topo de todas as páginas
function exibirUsuarioLogado() {
    let userDiv = document.getElementById('user-info');
    if (!userDiv) {
        // Cria o elemento se não existir
        userDiv = document.createElement('div');
        userDiv.id = 'user-info';
        userDiv.style = 'position:fixed;top:0;right:0;z-index:9999;padding:8px 16px;background:#fff;border-bottom-left-radius:8px;box-shadow:0 2px 8px #0001;';
        document.body.appendChild(userDiv);
    }
    if (isLoggedIn()) {
        const user = localStorage.getItem('usuarioLogado');
        userDiv.innerHTML = `<span class='fw-bold text-primary'>Usuário: ${user}</span> <button class='btn btn-outline-danger btn-sm ms-2' onclick='logout()'>Sair</button>`;
        userDiv.style.display = '';
    } else {
        userDiv.style.display = 'none';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    exibirUsuarioLogado();
    const mainView = document.getElementById('main-view');
    const detalheView = document.getElementById('detalhe-view');
    // Se não estiver logado, mostra só o modal de login
    if (!isLoggedIn()) {
        if (mainView) mainView.style.display = 'none';
        if (detalheView) detalheView.style.display = 'none';
        // Abre modal de login automaticamente
        setTimeout(() => {
            if (typeof loginModal !== 'undefined') loginModal.show();
            else if (document.getElementById('login-btn')) document.getElementById('login-btn').click();
        }, 200);
    } else {
        if (mainView) mainView.style.display = '';
        if (detalheView) detalheView.style.display = '';
    }
});



async function mostrarDetalhe(idx) {
    const alunos = await getAlunosAPI();
    const aluno = alunos[idx];
    document.getElementById('main-view').classList.add('d-none');
    document.getElementById('detalhe-view').classList.remove('d-none');
    const info = document.getElementById('detalhe-info');
    info.innerHTML = `
        <dt class="col-5">Nome</dt><dd class="col-7">${aluno.nome}</dd>
        <dt class="col-5">Idade</dt><dd class="col-7">${aluno.idade}</dd>
        <dt class="col-5">Sexo</dt><dd class="col-7">${aluno.sexo}</dd>
        <dt class="col-5">Faixa Salarial</dt><dd class="col-7">${aluno.faixaSalarial}</dd>
        <dt class="col-5">Observações</dt><dd class="col-7">${aluno.observacoes}</dd>
        <dt class="col-5">Código do Aluno</dt><dd class="col-7">${aluno.codigo || 'N/A'}</dd>
    `;
    renderHistorico(idx);
    document.getElementById('historico-form').onsubmit = function(ev) {
        ev.preventDefault();
        adicionarHistorico(idx);
    };
    document.getElementById('voltar-btn').onclick = function() {
        document.getElementById('detalhe-view').classList.add('d-none');
        document.getElementById('main-view').classList.remove('d-none');
    };
}


async function renderHistorico(idx) {
    const historico = await getHistoricoAPI(idx);
    const lista = document.getElementById('historico-list');
    lista.innerHTML = '';
    (historico || []).forEach(item => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.textContent = item;
        lista.appendChild(li);
    });
}


async function adicionarHistorico(idx) {
    const input = document.getElementById('novo-historico');
    const texto = input.value.trim();
    if (!texto) return;
    await addHistoricoAPI(idx, texto);
    input.value = '';
    renderHistorico(idx);
}

// --- Login e Registro ---
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));

function isLoggedIn() {
    return !!localStorage.getItem('usuarioLogado');
}

function setLoggedIn(username) {
    localStorage.setItem('usuarioLogado', username);
}

function logout() {
    localStorage.removeItem('usuarioLogado');
    exibirUsuarioLogado();
    window.location.reload();
}

function checkAuthOrRedirect() {
    if (!isLoggedIn()) {
        window.location.href = 'acesso-negado.html';
    }
}


// Removido o redirecionamento de acesso negado


loginBtn.addEventListener('click', () => {
    document.getElementById('login-error').classList.add('d-none');
    document.getElementById('login-form').reset();
    loginModal.show();
    window.location.hash = 'login';
});
registerBtn.addEventListener('click', () => {
    document.getElementById('register-error').classList.add('d-none');
    document.getElementById('register-form').reset();
    registerModal.show();
    window.location.hash = 'register';
});

// Fechar modais limpa o hash
document.getElementById('loginModal').addEventListener('hidden.bs.modal', () => {
    if (window.location.hash === '#login') window.location.hash = '';
});
document.getElementById('registerModal').addEventListener('hidden.bs.modal', () => {
    if (window.location.hash === '#register') window.location.hash = '';
});

// Abrir modal correto se hash for #login ou #register
window.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash === '#login') loginBtn.click();
    if (window.location.hash === '#register') registerBtn.click();
});


document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    errorDiv.classList.add('d-none');
    try {
        const res = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            setLoggedIn(username);
            exibirUsuarioLogado();
            loginModal.hide();
            setTimeout(() => {
                window.location.hash = '';
                window.location.reload();
            }, 300);
        } else {
            errorDiv.textContent = data.error || 'Erro ao fazer login.';
            errorDiv.classList.remove('d-none');
        }
    } catch (err) {
        errorDiv.textContent = 'Erro de conexão com o servidor.';
        errorDiv.classList.remove('d-none');
    }
});


document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const errorDiv = document.getElementById('register-error');
    errorDiv.classList.add('d-none');
    try {
        const res = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            registerModal.hide();
            setTimeout(() => {
                alert('Usuário registrado com sucesso! Faça login para continuar.');
                window.location.hash = 'login';
                loginBtn.click();
            }, 300);
        } else {
            errorDiv.textContent = data.error || 'Erro ao registrar.';
            errorDiv.classList.remove('d-none');
        }
    } catch (err) {
        errorDiv.textContent = 'Erro de conexão com o servidor.';
        errorDiv.classList.remove('d-none');
    }
});


// Inicialização
renderTabela();
