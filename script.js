// ============================================
// IMPORTAÇÕES DO FIREBASE
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ============================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyB6OlOdx2p71kv57KF5XlRYoATZa8bWYvw",
    authDomain: "aplicativo-prontoja-80c02.firebaseapp.com",
    projectId: "aplicativo-prontoja-80c02",
    storageBucket: "aplicativo-prontoja-80c02.firebasestorage.app",
    messagingSenderId: "625556388980",
    appId: "1:625556388980:web:32b3bcf47cb3aa9ccda521",
    measurementId: "G-4YMXEHLGDR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let tipoUsuario = null;

// ============================================
// SISTEMA DE NAVEGAÇÃO ENTRE TELAS
// ============================================
function mudarTela(idTela) {
    document.querySelectorAll('.tela').forEach(tela => {
        tela.classList.remove('ativa');
    });
    
    document.getElementById(idTela).classList.add('ativa');
    window.scrollTo(0, 0);
    
    if (idTela === 'tela-8') {
        setTimeout(inicializarChat, 100);
    }
    
    if (idTela === 'tela-10') {
        setTimeout(inicializarSwitchLoja, 100);
    }
    
    if (idTela === 'tela-11') {
        setTimeout(inicializarBuscaCardapio, 100);
    }
    
    if (idTela === 'tela-12') {
        setTimeout(() => {
            inicializarBuscaMensagens();
            inicializarCliquesMensagens();
        }, 100);
    }
    
    if (idTela === 'tela-13') {
        setTimeout(inicializarAjustes, 100);
    }
}

// ============================================
// FUNÇÕES DE LOGIN E CADASTRO
// ============================================
function irParaLogin(tipo) {
    tipoUsuario = tipo;
    mudarTela('tela-login');
}

async function loginComGoogle() {
    if (!tipoUsuario) {
        alert("Erro: Tipo de usuário não definido.");
        mudarTela('tela-2');
        return;
    }

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const nome = user.displayName || "Usuário";
        const email = user.email || "";

        console.log("Usuário logado:", nome);
        console.log("Tipo:", tipoUsuario);

        localStorage.setItem('tipoUsuario', tipoUsuario);
        localStorage.setItem('nomeUsuario', nome);
        localStorage.setItem('emailUsuario', email);

        const nomePerfil = document.getElementById('nomePerfil');
        const emailPerfil = document.getElementById('emailPerfil');
        if (nomePerfil) nomePerfil.textContent = nome;
        if (emailPerfil) emailPerfil.textContent = email;

        if (tipoUsuario === 'cliente') {
            mudarTela('tela-5');
        } else if (tipoUsuario === 'empresa') {
            mudarTela('tela-4');
        } else {
            mudarTela('tela-5');
        }
    } catch (error) {
        console.error("Erro no login:", error);
        alert("Erro ao fazer login: " + error.message);
    }
}

async function cadastrarCliente() {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const telefone = document.getElementById('telefone').value;
    const senha = document.getElementById('senha').value;
    const localidade = document.getElementById('localidade')?.value || '';

    if (!nome || !email || !telefone || !senha) {
        alert("Preencha todos os campos!");
        return;
    }

    try {
        const usuario = await createUserWithEmailAndPassword(auth, email, senha);
        const uid = usuario.user.uid;

        await setDoc(doc(db, "clientes", uid), {
            nome: nome,
            email: email,
            telefone: telefone,
            localidade: localidade
        });

        alert("Cadastro realizado com sucesso!");

        localStorage.setItem('tipoUsuario', 'cliente');
        localStorage.setItem('nomeUsuario', nome);
        localStorage.setItem('emailUsuario', email);

        const nomePerfil = document.getElementById('nomePerfil');
        const emailPerfil = document.getElementById('emailPerfil');
        if (nomePerfil) nomePerfil.textContent = nome;
        if (emailPerfil) emailPerfil.textContent = email;

        mudarTela('tela-5');

    } catch (erro) {
        console.error(erro);
        alert("Erro ao cadastrar: " + erro.message);
    }
}

async function sairDaConta() {
    try {
        await signOut(auth);
        tipoUsuario = null;
        localStorage.removeItem('tipoUsuario');
        localStorage.removeItem('nomeUsuario');
        localStorage.removeItem('emailUsuario');
        mudarTela('tela-2');
    } catch (error) {
        console.error("Erro ao sair:", error);
    }
}

// ============================================
// FUNCIONALIDADE DO CHAT
// ============================================
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let audioStream;

function inicializarChat() {
    const chatInput = document.getElementById('chat-input');
    const recordBtn = document.getElementById('record-btn');
    const sendBtn = document.getElementById('send-btn');
    
    if (!chatInput || !recordBtn || !sendBtn) return;
    
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    
    const newRecordBtn = recordBtn.cloneNode(true);
    recordBtn.parentNode.replaceChild(newRecordBtn, recordBtn);
    
    const finalSendBtn = document.getElementById('send-btn');
    const finalRecordBtn = document.getElementById('record-btn');
    
    finalSendBtn.addEventListener('click', function() {
        const input = document.getElementById('chat-input');
        if (input && input.value.trim()) {
            enviarMensagem(input.value);
            input.value = '';
        }
    });
    
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim()) {
                enviarMensagem(this.value);
                this.value = '';
            }
        });
    }
    
    finalRecordBtn.addEventListener('click', function() {
        if (!isRecording) {
            iniciarGravacao();
        } else {
            pararGravacao();
        }
    });
}

function enviarMensagem(texto) {
    const chatMessages = document.getElementById('chat-mensagens');
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = 'mensagem mensagem-enviada';
    mensagemDiv.innerHTML = `
        <div class="mensagem-conteudo">
            <div class="mensagem-balao mensagem-balao-enviada">
                <p>${texto}</p>
            </div>
            <div class="mensagem-status">
                <span class="mensagem-hora">${horaAtual}</span>
                <span class="material-symbols-outlined">done_all</span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(mensagemDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    setTimeout(() => {
        const respostas = [
            "Entendido! O entregador já está a caminho.",
            "Perfeito! Vamos atualizar o status do seu pedido.",
            "Obrigado pela informação!",
            "Seu pedido está sendo preparado.",
            "O entregador está na sua região."
        ];
        
        const respostaAleatoria = respostas[Math.floor(Math.random() * respostas.length)];
        const horaResposta = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const respostaDiv = document.createElement('div');
        respostaDiv.className = 'mensagem mensagem-recebida';
        respostaDiv.innerHTML = `
            <div class="mensagem-foto" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCo2WOsnviTirPXViHLuIQx6Fc7P9RB04Mt2QW0Ne2r2uObuBI99pgO9Rwy0EMxZSQ8A90BNE-k-TPjnd6so7pDr1NlkwLqUCCBP0u8h704f5m159sd2XuCmX3Od-M3z99hL3voS5JZNWz7kNUFU6W9gmirlsY_s-eciw9XgtG1opIMFE6hWXIHKonrviDD-aYh6TLvnPlwTgJHKUCHDen1hK_Eut_AKTjhjZGNVC13TpeVDgBM0lV_YLF_WUdfQKipbGdIrG9T52c')"></div>
            <div class="mensagem-conteudo">
                <div class="mensagem-balao">
                    <p>${respostaAleatoria}</p>
                </div>
                <span class="mensagem-hora">${horaResposta}</span>
            </div>
        `;
        
        chatMessages.appendChild(respostaDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 2000);
}

async function iniciarGravacao() {
    try {
        const recordBtn = document.getElementById('record-btn');
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(audioStream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = event => { audioChunks.push(event.data); };
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            exibirAudioGravado(audioBlob);
            audioStream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        recordBtn.classList.add('gravando');
        recordBtn.innerHTML = '<span class="material-symbols-outlined">stop</span>';
    } catch (error) {
        console.error('Erro ao acessar microfone:', error);
        alert('Não foi possível acessar o microfone. Por favor, verifique as permissões.');
    }
}

function pararGravacao() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        const recordBtn = document.getElementById('record-btn');
        recordBtn.classList.remove('gravando');
        recordBtn.innerHTML = '<span class="material-symbols-outlined">mic</span>';
    }
}

function exibirAudioGravado(audioBlob) {
    const chatMessages = document.getElementById('chat-mensagens');
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const audioDiv = document.createElement('div');
    audioDiv.className = 'mensagem mensagem-enviada';
    audioDiv.innerHTML = `
        <div class="mensagem-conteudo">
            <div class="mensagem-balao mensagem-balao-enviada">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="material-symbols-outlined" style="font-size: 16px;">mic</span>
                    <span>Áudio gravado</span>
                    <span class="material-symbols-outlined audio-play" style="font-size: 16px; margin-left: auto; cursor: pointer;">play_arrow</span>
                </div>
            </div>
            <div class="mensagem-status">
                <span class="mensagem-hora">${horaAtual}</span>
                <span class="material-symbols-outlined">done_all</span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(audioDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    const audioElement = new Audio(URL.createObjectURL(audioBlob));
    const playButton = audioDiv.querySelector('.audio-play');
    
    if (playButton) {
        playButton.addEventListener('click', function(e) {
            e.stopPropagation();
            if (audioElement.paused) {
                audioElement.play();
                this.textContent = 'pause';
            } else {
                audioElement.pause();
                this.textContent = 'play_arrow';
            }
        });
    }
    
    audioElement.onended = function() {
        if (playButton) playButton.textContent = 'play_arrow';
    };
    
    setTimeout(() => {
        const horaResposta = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const respostaDiv = document.createElement('div');
        respostaDiv.className = 'mensagem mensagem-recebida';
        respostaDiv.innerHTML = `
            <div class="mensagem-foto" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCo2WOsnviTirPXViHLuIQx6Fc7P9RB04Mt2QW0Ne2r2uObuBI99pgO9Rwy0EMxZSQ8A90BNE-k-TPjnd6so7pDr1NlkwLqUCCBP0u8h704f5m159sd2XuCmX3Od-M3z99hL3voS5JZNWz7kNUFU6W9gmirlsY_s-eciw9XgtG1opIMFE6hWXIHKonrviDD-aYh6TLvnPlwTgJHKUCHDen1hK_Eut_AKTjhjZGNVC13TpeVDgBM0lV_YLF_WUdfQKipbGdIrG9T52c')"></div>
            <div class="mensagem-conteudo">
                <div class="mensagem-balao">
                    <p>Áudio recebido! Vou verificar isso.</p>
                </div>
                <span class="mensagem-hora">${horaResposta}</span>
            </div>
        `;
        chatMessages.appendChild(respostaDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 3000);
}

// ============================================
// SWITCH DA LOJA
// ============================================
let switchInicializado = false;

function inicializarSwitchLoja() {
    if (switchInicializado) return;
    const switchBtn = document.getElementById("switch");
    const statusText = document.getElementById("status-text");
    
    if (switchBtn && statusText && !switchBtn.hasListener) {
        switchBtn.onclick = () => {
            switchBtn.classList.toggle("off");
            statusText.textContent = switchBtn.classList.contains("off") ? "Fechado" : "Aberto";
        };
        switchBtn.hasListener = true;
        switchInicializado = true;
    }
}

// ============================================
// ACEITAR PEDIDO
// ============================================
function aceitarPedido(botao) {
    const pedidoDiv = botao.closest('.loja-pedido');
    if (pedidoDiv) {
        botao.textContent = 'Aceito!';
        botao.style.background = '#10b981';
        botao.disabled = true;
        
        const pendentesCard = document.querySelector('.loja-card:first-child h2');
        if (pendentesCard) {
            let pendentes = parseInt(pendentesCard.textContent);
            if (!isNaN(pendentes) && pendentes > 0) pendentesCard.textContent = pendentes - 1;
        }
        
        const preparoCard = document.querySelector('.loja-card:last-child h2');
        if (preparoCard) {
            let preparo = parseInt(preparoCard.textContent);
            if (!isNaN(preparo)) preparoCard.textContent = preparo + 1;
        }
    }
}

// ============================================
// BUSCA CARDÁPIO
// ============================================
function inicializarBuscaCardapio() {
    const buscaInput = document.getElementById('cardapio-busca');
    if (!buscaInput || buscaInput.hasListener) return;
    
    buscaInput.addEventListener('input', function(e) {
        const termo = e.target.value.toLowerCase();
        const items = document.querySelectorAll('#cardapio-content .cardapio-item');
        const categorias = document.querySelectorAll('#cardapio-content h3');
        
        items.forEach(item => {
            const nome = item.querySelector('h4').textContent.toLowerCase();
            const descricao = item.querySelector('p').textContent.toLowerCase();
            item.style.display = (termo === '' || nome.includes(termo) || descricao.includes(termo)) ? 'flex' : 'none';
        });
        
        categorias.forEach(categoria => {
            let nextItem = categoria.nextElementSibling;
            let hasVisibleItem = false;
            while (nextItem && nextItem.classList && nextItem.classList.contains('cardapio-item')) {
                if (nextItem.style.display !== 'none') { hasVisibleItem = true; break; }
                nextItem = nextItem.nextElementSibling;
            }
            categoria.style.display = (hasVisibleItem || termo === '') ? 'block' : 'none';
        });
    });
    buscaInput.hasListener = true;
}

// ============================================
// BUSCA MENSAGENS
// ============================================
function inicializarBuscaMensagens() {
    const buscaInput = document.getElementById('mensagens-busca-input');
    if (!buscaInput || buscaInput.hasListener) return;
    
    buscaInput.addEventListener('input', function(e) {
        const termo = e.target.value.toLowerCase();
        const items = document.querySelectorAll('#mensagens-lista .mensagem-item');
        
        items.forEach(item => {
            const nome = item.getAttribute('data-nome')?.toLowerCase() || '';
            const id = item.getAttribute('data-id') || '';
            const preview = item.querySelector('.mensagem-preview')?.textContent.toLowerCase() || '';
            item.style.display = (termo === '' || nome.includes(termo) || id.includes(termo) || preview.includes(termo)) ? 'flex' : 'none';
        });
    });
    buscaInput.hasListener = true;
}

function abrirChatCliente(nome, id) {
    alert(`Abrindo conversa com ${nome} (Pedido #${id})`);
}

function inicializarCliquesMensagens() {
    const mensagensItems = document.querySelectorAll('#mensagens-lista .mensagem-item');
    mensagensItems.forEach(item => {
        if (item.hasClickListener) return;
        item.addEventListener('click', function() {
            abrirChatCliente(this.getAttribute('data-nome'), this.getAttribute('data-id'));
        });
        item.hasClickListener = true;
    });
}

function inicializarAjustes() {
    console.log('Tela de Ajustes carregada');
}

// ============================================
// TOGGLE VISIBILIDADE DE SENHA
// ============================================
document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-visibilidade')) {
        const btn = e.target.closest('.btn-visibilidade');
        const input = btn.parentElement.querySelector('input[type="password"], input[type="text"]');
        const icon = btn.querySelector('.material-symbols-outlined');
        if (!input || !icon) return;
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.textContent = 'visibility';
        } else {
            input.type = 'password';
            icon.textContent = 'visibility_off';
        }
    }
});

// ============================================
// INICIALIZAÇÃO E EVENTOS
// ============================================
document.addEventListener('visibilitychange', function() {
    if (document.hidden && isRecording) pararGravacao();
});

document.addEventListener('submit', function(e) {
    e.preventDefault();
});

// ============================================
// CONFIGURAÇÃO DOS EVENTOS DOS BOTÕES (sem onclick no HTML)
// ============================================
window.addEventListener('DOMContentLoaded', function() {
    // Tela inicial
    mudarTela('tela-1');
    
    // Botão Começar
    const btnComecar = document.getElementById('btn-comecar');
    if (btnComecar) btnComecar.addEventListener('click', () => mudarTela('tela-2'));
    
    // Botões da tela de seleção
    const btnCliente = document.getElementById('btn-cliente');
    const btnEmpresa = document.getElementById('btn-empresa');
    if (btnCliente) btnCliente.addEventListener('click', () => irParaLogin('cliente'));
    if (btnEmpresa) btnEmpresa.addEventListener('click', () => irParaLogin('empresa'));
    
    // Botão voltar da tela de login
    const voltarLogin = document.getElementById('voltar-login');
    if (voltarLogin) voltarLogin.addEventListener('click', () => mudarTela('tela-2'));
    
    // Botão Google Login
    const btnGoogle = document.getElementById('btn-google-login');
    if (btnGoogle) btnGoogle.addEventListener('click', loginComGoogle);
    
    // Botões do cadastro cliente
    const voltarCadastroCliente = document.getElementById('voltar-cadastro-cliente');
    if (voltarCadastroCliente) voltarCadastroCliente.addEventListener('click', () => mudarTela('tela-2'));
    
    const irEmpresa = document.getElementById('ir-empresa');
    if (irEmpresa) irEmpresa.addEventListener('click', () => mudarTela('tela-4'));
    
    const btnCadastrarCliente = document.getElementById('btn-cadastrar-cliente');
    if (btnCadastrarCliente) btnCadastrarCliente.addEventListener('click', cadastrarCliente);
    
    // Botões do cadastro empresa
    const voltarCadastroEmpresa = document.getElementById('voltar-cadastro-empresa');
    if (voltarCadastroEmpresa) voltarCadastroEmpresa.addEventListener('click', () => mudarTela('tela-2'));
    
    const btnSalvarEmpresa = document.getElementById('btn-salvar-empresa');
    if (btnSalvarEmpresa) btnSalvarEmpresa.addEventListener('click', () => mudarTela('tela-10'));
    
    // Botão Chat
    const btnChat = document.getElementById('btn-chat');
    if (btnChat) btnChat.addEventListener('click', () => mudarTela('tela-8'));
    
    // Botão voltar do chat
    const voltarChat = document.getElementById('voltar-chat');
    if (voltarChat) voltarChat.addEventListener('click', () => mudarTela('tela-7'));
    
    // Botões de voltar da empresa
    const voltarEmpresaBtns = document.querySelectorAll('.voltar-empresa');
    voltarEmpresaBtns.forEach(btn => {
        btn.addEventListener('click', () => mudarTela('tela-10'));
    });
    
    // Botões de sair da conta
    const sairConta = document.getElementById('sair-conta');
    const sairAjustes = document.getElementById('sair-ajustes');
    if (sairConta) sairConta.addEventListener('click', sairDaConta);
    if (sairAjustes) sairAjustes.addEventListener('click', sairDaConta);
    
    // Navegação inferior (todos os botões com data-tela)
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tela = item.getAttribute('data-tela');
            if (tela) mudarTela(tela);
        });
    });
    
    // Botões Aceitar Pedido
    const btnAceitar = document.querySelectorAll('.btn-aceitar');
    btnAceitar.forEach(btn => {
        btn.addEventListener('click', function() {
            aceitarPedido(this);
        });
    });
    
    // Busca da tela de pesquisa
    const buscaPesquisa = document.querySelector('#tela-6 .pesquisa-busca input');
    if (buscaPesquisa) {
        buscaPesquisa.addEventListener('input', function(e) {
            console.log('Pesquisando:', this.value);
        });
    }
    
    // Verifica sessão salva
    const tipoSalvo = localStorage.getItem('tipoUsuario');
    const nomeSalvo = localStorage.getItem('nomeUsuario');
    const emailSalvo = localStorage.getItem('emailUsuario');
    
    if (tipoSalvo && nomeSalvo) {
        tipoUsuario = tipoSalvo;
        const nomePerfil = document.getElementById('nomePerfil');
        const emailPerfil = document.getElementById('emailPerfil');
        if (nomePerfil) nomePerfil.textContent = nomeSalvo;
        if (emailPerfil) emailPerfil.textContent = emailSalvo;
        
        if (tipoSalvo === 'cliente') {
            mudarTela('tela-5');
        } else if (tipoSalvo === 'empresa') {
            mudarTela('tela-10');
        }
    }
});
