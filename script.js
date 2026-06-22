import { auth, db, provider } from './firebase-config.js';
import { 
    signInWithPopup,
    GoogleAuthProvider 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    updateDoc,
    doc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================
let tipoUsuario = null;
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let audioStream;
let switchInicializado = false;
let currentImageData = null;
let currentFile = null;

// ==========================================
// SISTEMA DE NAVEGAÇÃO ENTRE TELAS
// ==========================================
window.mudarTela = function(idTela) {
    document.querySelectorAll('.tela').forEach(tela => {
        tela.classList.remove('ativa');
    });
    
    document.getElementById(idTela).classList.add('ativa');
    window.scrollTo(0, 0);
    
    if (idTela === 'tela-8') {
        setTimeout(inicializarChat, 100);
    }
    
    if (idTela === 'tela-10') {
        setTimeout(() => {
            inicializarSwitchLoja();
            escutarPedidosEmpresa();
        }, 100);
    }
    
    if (idTela === 'tela-11') {
        setTimeout(() => {
            inicializarBuscaCardapio();
            if (typeof carregarProdutos === 'function') carregarProdutos();
        }, 100);
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
    
    if (idTela === 'tela-14') {
        setTimeout(inicializarCadastroProduto, 100);
    }
    
    if (idTela === 'tela-15') {
        setTimeout(() => {
            if (typeof carregarProdutosCliente === 'function') carregarProdutosCliente();
        }, 100);
    }
    
    if (idTela === 'tela-7') {
        setTimeout(escutarPedidosCliente, 100);
    }
};

// ==========================================
// FUNÇÕES DE LOGIN
// ==========================================
window.irParaLogin = function(tipo) {
    tipoUsuario = tipo;
    mudarTela('tela-login');
};

window.loginComGoogle = async function() {
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
        localStorage.setItem('tipoUsuario', tipoUsuario);
        localStorage.setItem('nomeUsuario', nome);
        localStorage.setItem('emailUsuario', email);
        const nomePerfil = document.getElementById('nomePerfil');
        const emailPerfil = document.getElementById('emailPerfil');
        if (nomePerfil) nomePerfil.textContent = nome;
        if (emailPerfil) emailPerfil.textContent = email;
        if (tipoUsuario === 'cliente') mudarTela('tela-5');
        else if (tipoUsuario === 'empresa') mudarTela('tela-10');
        else mudarTela('tela-5');
    } catch (error) {
        console.error("Erro no login:", error);
        alert("Erro ao fazer login: " + error.message);
    }
};

window.sairDaConta = function() {
    auth.signOut().then(() => {
        tipoUsuario = null;
        localStorage.removeItem('tipoUsuario');
        localStorage.removeItem('nomeUsuario');
        localStorage.removeItem('emailUsuario');
        mudarTela('tela-2');
    }).catch((error) => console.error("Erro ao sair:", error));
};

// ==========================================
// PEDIDOS EM TEMPO REAL - CLIENTE (PASSO 3)
// ==========================================
function escutarPedidosCliente() {
    const user = auth.currentUser;
    const container = document.querySelector(".pedidos-conteudo");

    if (!user || !container) {
        console.log("Usuário não logado ou container não encontrado");
        return;
    }

    const q = query(
        collection(db, "pedidos"),
        where("clienteId", "==", user.uid)
    );

    onSnapshot(q, (snapshot) => {
        container.innerHTML = "";

        if (snapshot.empty) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <span class="material-symbols-outlined" style="font-size: 48px; color: #ccc;">receipt_long</span>
                    <h3 style="color: #666; margin-top: 16px;">Nenhum pedido encontrado</h3>
                    <p style="color: #999;">Faça seu primeiro pedido agora!</p>
                </div>
            `;
            return;
        }

        snapshot.forEach(doc => {
            const p = doc.data();
            const id = doc.id;
            
            let statusClass = 'status-pendente';
            let statusText = 'Pendente';
            
            if (p.status === 'aceito') {
                statusClass = 'status-aceito';
                statusText = 'Aceito';
            } else if (p.status === 'preparo') {
                statusClass = 'status-preparo';
                statusText = 'Em Preparo';
            } else if (p.status === 'rota') {
                statusClass = 'status-rota';
                statusText = 'Saiu para Entrega';
            } else if (p.status === 'entregue') {
                statusClass = 'status-entregue';
                statusText = 'Entregue';
            }

            container.innerHTML += `
                <div class="pedido-card">
                    <div class="pedido-imagem" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuB9qmCO1wwCO4N0iVnQWSPyVBHgwgZEXoQCF_0SPnDK-u1tits_-bmrj5XJY6rJBISIp4V6VNhhqkgO0-FKRGGt9kHBayxaeJKs4chrxUo4PBM0kFbVU-VKldj_2uv0PFReISHO7Yc-Tikbzi2Oyt-BZRqI8h5r3cJlEJACPTXLJnI6eR-MExNYdgnCWuRGTQX3MFh_mkViSIxRd5PCW5jTmMRrjOQk7b-PLyDk2tNQT37tXo3wroQ2JmEOZiU1c_chvrkP9c6AQVo')"></div>
                    <div class="pedido-info">
                        <div class="pedido-titulo">
                            <h3>${p.produto}</h3>
                            <span class="pedido-status ${statusClass}">${statusText}</span>
                        </div>
                        <p class="pedido-data">Pedido #${id.slice(-4)} • ${p.preco}</p>
                        <p class="pedido-descricao">Cliente: ${p.clienteNome || 'Cliente'}</p>
                    </div>
                    ${p.status === 'aceito' || p.status === 'preparo' || p.status === 'rota' ? `
                        <button onclick="mudarTela('tela-8')" class="btn-chat">
                            <span class="material-symbols-outlined">chat</span>
                            <span>Chat com Entregador</span>
                        </button>
                    ` : ''}
                </div>
            `;
        });
    });
}

// ==========================================
// PEDIDOS EM TEMPO REAL - EMPRESA (PASSO 4)
// ==========================================
function escutarPedidosEmpresa() {
    const container = document.querySelector(".loja-pedidos");
    const user = auth.currentUser;

    if (!container || !user) {
        console.log("Container ou usuário não encontrado");
        return;
    }

    const q = query(
        collection(db, "pedidos"),
        where("empresaId", "==", user.uid)
    );

    onSnapshot(q, (snapshot) => {
        container.innerHTML = "";

        let pendentes = 0;
        let emPreparo = 0;

        snapshot.forEach(doc => {
            const p = doc.data();
            if (p.status === 'pendente') pendentes++;
            if (p.status === 'aceito' || p.status === 'preparo') emPreparo++;
        });

        const pendentesCard = document.querySelector('.loja-card:first-child h2');
        const preparoCard = document.querySelector('.loja-card:last-child h2');
        if (pendentesCard) pendentesCard.textContent = pendentes;
        if (preparoCard) preparoCard.textContent = emPreparo;

        if (snapshot.empty) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #999;">
                    <span class="material-symbols-outlined" style="font-size: 48px; color: #ddd;">receipt_long</span>
                    <p style="margin-top: 12px;">Nenhum pedido recebido ainda</p>
                </div>
            `;
            return;
        }

        snapshot.forEach(doc => {
            const p = doc.data();
            const id = doc.id;

            if (p.status === 'pendente') {
                container.innerHTML += `
                    <div class="loja-pedido" id="pedido-${id}">
                        <div class="pedido-top">
                            <strong>${p.clienteNome || 'Cliente'}</strong>
                            <strong>${p.preco}</strong>
                        </div>
                        <small>#${id.slice(-4)}</small>
                        <div class="pedido-list">${p.produto}</div>
                        <button class="btn-aceitar" onclick="aceitarPedidoFirebase('${id}')">
                            Aceitar Pedido
                        </button>
                    </div>
                `;
            } else {
                container.innerHTML += `
                    <div class="loja-pedido" id="pedido-${id}" style="border-left: 3px solid #10b981;">
                        <div class="pedido-top">
                            <strong>${p.clienteNome || 'Cliente'}</strong>
                            <strong>${p.preco}</strong>
                        </div>
                        <small>#${id.slice(-4)}</small>
                        <div class="pedido-list">${p.produto}</div>
                        <span style="color: #10b981; font-weight: 600;">✅ ${p.status === 'aceito' ? 'Aceito' : 'Em Preparo'}</span>
                    </div>
                `;
            }
        });
    });
}

// ==========================================
// ACEITAR PEDIDO REAL (PASSO 5)
// ==========================================
window.aceitarPedidoFirebase = async function(id) {
    if (!id) {
        alert("ID do pedido não encontrado");
        return;
    }

    try {
        await updateDoc(doc(db, "pedidos", id), {
            status: "aceito",
            aceitoEm: new Date().toISOString()
        });

        const pedidoElement = document.getElementById(`pedido-${id}`);
        if (pedidoElement) {
            const botao = pedidoElement.querySelector('.btn-aceitar');
            if (botao) {
                botao.textContent = '✅ Aceito!';
                botao.style.background = '#10b981';
                botao.disabled = true;
            }
            pedidoElement.style.borderLeft = '3px solid #10b981';
        }

        showToast('Pedido aceito com sucesso!', false);

    } catch (error) {
        console.error("Erro ao aceitar pedido:", error);
        alert("Erro ao aceitar pedido: " + error.message);
    }
};

// ==========================================
// FUNÇÕES DO CHAT
// ==========================================
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

// ==========================================
// SWITCH DA LOJA
// ==========================================
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

// ==========================================
// FUNÇÕES DO CARDÁPIO
// ==========================================
window.abrirCadastroProduto = function() {
    mudarTela('tela-14');
    setTimeout(inicializarCadastroProduto, 100);
};

window.fecharCadastroProduto = function() {
    mudarTela('tela-11');
};

window.salvarProduto = async function() {
    const nome = document.getElementById("productName").value;
    const categoria = document.getElementById("productCategory").value;
    const preco = document.getElementById("productPrice").value;
    const descricao = document.getElementById("productDescription").value;

    if (!nome || !categoria || !preco) {
        alert("Preencha todos os campos.");
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        alert("Você precisa estar logado para cadastrar um produto.");
        return;
    }

    try {
        await addDoc(collection(db, "produtos"), {
            nome: nome,
            categoria: categoria,
            preco: preco,
            descricao: descricao,
            empresa: user.uid
        });

        alert("Produto cadastrado com sucesso!");

        document.getElementById("productName").value = "";
        document.getElementById("productPrice").value = "";
        document.getElementById("productDescription").value = "";

        const uploadArea = document.getElementById('uploadArea');
        const previewContainer = document.getElementById('photoPreviewContainer');
        const fileInput = document.getElementById('productPhotoInput');
        const previewImg = document.getElementById('previewImg');
        
        if (fileInput) fileInput.value = '';
        if (previewImg) previewImg.src = '#';
        if (previewContainer) previewContainer.style.display = 'none';
        if (uploadArea) uploadArea.style.display = 'flex';

        carregarProdutos();
        mudarTela("tela-11");

    } catch (erro) {
        console.error(erro);
        alert("Erro ao salvar produto: " + erro.message);
    }
};

window.carregarProdutos = async function() {
    const lista = document.getElementById("cardapio-content");
    if (!lista) return;
    
    lista.innerHTML = "";
    
    const user = auth.currentUser;
    if (!user) {
        lista.innerHTML = '<p style="text-align:center; padding:20px;">Faça login para ver seus produtos</p>';
        return;
    }

    try {
        const q = query(collection(db, "produtos"), where("empresa", "==", user.uid));
        const produtos = await getDocs(q);
        
        if (produtos.empty) {
            lista.innerHTML = '<p style="text-align:center; padding:20px;">Nenhum produto cadastrado. Clique no + para adicionar.</p>';
            return;
        }
        
        let categoriasMap = new Map();
        
        produtos.forEach((doc) => {
            const produto = doc.data();
            if (!categoriasMap.has(produto.categoria)) {
                categoriasMap.set(produto.categoria, []);
            }
            categoriasMap.get(produto.categoria).push(produto);
        });
        
        for (let [categoria, produtosList] of categoriasMap) {
            lista.innerHTML += `<h3>${categoria}</h3>`;
            produtosList.forEach(produto => {
                let precoFormatado = `R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}`;
                lista.innerHTML += `
                    <div class="cardapio-item">
                        <div>
                            <h4>${produto.nome}</h4>
                            <p>${produto.descricao || ''}</p>
                            <span class="cardapio-price">${precoFormatado}</span>
                        </div>
                        <label class="cardapio-switch">
                            <input type="checkbox" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                `;
            });
        }
    } catch (erro) {
        console.error(erro);
        lista.innerHTML = '<p style="text-align:center; padding:20px;">Erro ao carregar produtos</p>';
    }
};

window.carregarProdutosCliente = async function() {
    const lista = document.getElementById("listaProdutosCliente");
    if (!lista) return;
    
    lista.innerHTML = '<p style="text-align:center; padding:20px;">Carregando produtos...</p>';
    
    try {
        const produtos = await getDocs(collection(db, "produtos"));
        
        if (produtos.empty) {
            lista.innerHTML = '<p style="text-align:center; padding:20px;">Nenhum produto disponível no momento.</p>';
            return;
        }
        
        lista.innerHTML = "";
        
        produtos.forEach((doc) => {
            const p = doc.data();
            let precoFormatado = `R$ ${parseFloat(p.preco).toFixed(2).replace('.', ',')}`;
            lista.innerHTML += `
                <div class="produto-cliente-card">
                    <h3>${p.nome}</h3>
                    <p>${p.descricao || ''}</p>
                    <strong>${precoFormatado}</strong>
                    <button class="btn-adicionar-carrinho" onclick="adicionarAoCarrinho('${p.nome}', '${precoFormatado}')">
                        <span class="material-symbols-outlined">shopping_cart</span>
                        Adicionar
                    </button>
                </div>
            `;
        });
    } catch (erro) {
        console.error(erro);
        lista.innerHTML = '<p style="text-align:center; padding:20px;">Erro ao carregar produtos</p>';
    }
};

window.adicionarAoCarrinho = async function(nome, preco) {
    const user = auth.currentUser;

    if (!user) {
        alert("Você precisa estar logado para fazer um pedido.");
        return;
    }

    const empresaId = user.uid;

    try {
        await addDoc(collection(db, "pedidos"), {
            clienteId: user.uid,
            clienteNome: user.displayName || "Cliente",
            empresaId: empresaId,
            produto: nome,
            preco: preco,
            status: "pendente",
            criadoEm: serverTimestamp()
        });

        showToast("Pedido enviado com sucesso! 🎉", false);
        mudarTela("tela-7");

    } catch (error) {
        console.error("Erro ao criar pedido:", error);
        alert("Erro ao criar pedido: " + error.message);
    }
};

window.abrirProdutosCliente = function() {
    mudarTela('tela-15');
    setTimeout(carregarProdutosCliente, 100);
};

// ==========================================
// BUSCA CARDÁPIO
// ==========================================
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

// ==========================================
// BUSCA MENSAGENS
// ==========================================
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

// ==========================================
// CADASTRO DE PRODUTO
// ==========================================
function inicializarCadastroProduto() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('productPhotoInput');
    const previewContainer = document.getElementById('photoPreviewContainer');
    const previewImg = document.getElementById('previewImg');
    const previewFileNameSpan = document.getElementById('previewFileName');
    const removePhotoBtn = document.getElementById('removePhotoBtn');
    const priceInput = document.getElementById('productPrice');
    
    if (!uploadArea) return;
    
    const newUploadArea = uploadArea.cloneNode(true);
    uploadArea.parentNode.replaceChild(newUploadArea, uploadArea);
    
    const newRemovePhotoBtn = removePhotoBtn ? removePhotoBtn.cloneNode(true) : null;
    if (removePhotoBtn && newRemovePhotoBtn) {
        removePhotoBtn.parentNode.replaceChild(newRemovePhotoBtn, removePhotoBtn);
    }
    
    const finalUploadArea = document.getElementById('uploadArea');
    const finalFileInput = document.getElementById('productPhotoInput');
    const finalPreviewContainer = document.getElementById('photoPreviewContainer');
    const finalPreviewImg = document.getElementById('previewImg');
    const finalPreviewFileNameSpan = document.getElementById('previewFileName');
    const finalRemovePhotoBtn = document.getElementById('removePhotoBtn');
    const finalPriceInput = document.getElementById('productPrice');
    
    function showPreview(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImageData = e.target.result;
            if (finalPreviewImg) finalPreviewImg.src = currentImageData;
            if (finalPreviewFileNameSpan) {
                finalPreviewFileNameSpan.innerText = file.name.length > 28 ? file.name.substring(0, 25) + '...' : file.name;
            }
            if (finalUploadArea) finalUploadArea.style.display = 'none';
            if (finalPreviewContainer) finalPreviewContainer.style.display = 'flex';
        };
        reader.readAsDataURL(file);
        currentFile = file;
    }
    
    function resetPhoto() {
        currentImageData = null;
        currentFile = null;
        if (finalFileInput) finalFileInput.value = '';
        if (finalPreviewImg) finalPreviewImg.src = '#';
        if (finalPreviewContainer) finalPreviewContainer.style.display = 'none';
        if (finalUploadArea) finalUploadArea.style.display = 'flex';
    }
    
    if (finalUploadArea) {
        finalUploadArea.addEventListener('click', () => {
            if (finalFileInput) finalFileInput.click();
        });
    }
    
    if (finalFileInput) {
        finalFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];
                if (file.type.startsWith('image/')) {
                    showPreview(file);
                } else {
                    showToast('Por favor selecione uma imagem válida (PNG ou JPG)', true);
                }
            }
        });
    }
    
    if (finalRemovePhotoBtn) {
        finalRemovePhotoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            resetPhoto();
        });
    }
    
    if (finalPriceInput) {
        finalPriceInput.addEventListener('input', function(e) {
            let raw = e.target.value;
            let filtered = raw.replace(/[^\d,]/g, '');
            let parts = filtered.split(',');
            if (parts.length > 2) {
                filtered = parts[0] + ',' + parts.slice(1).join('');
            }
            if (parts.length === 2 && parts[1].length > 2) {
                filtered = parts[0] + ',' + parts[1].substring(0, 2);
            }
            e.target.value = filtered;
        });
        
        finalPriceInput.addEventListener('blur', function() {
            let val = this.value;
            if (val === '') return;
            if (val.endsWith(',')) {
                this.value = val + '00';
            } else {
                let parts = val.split(',');
                if (parts.length === 1 && parts[0].length > 0) {
                    this.value = parts[0] + ',00';
                } else if (parts.length === 2 && parts[1].length === 1) {
                    this.value = parts[0] + ',' + parts[1] + '0';
                }
            }
        });
    }
    
    resetPhoto();
    if (finalPriceInput) finalPriceInput.placeholder = "0,00";
}

function showToast(message, isError = false) {
    let toast = document.querySelector('.toast-message');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-message';
        document.body.appendChild(toast);
    }
    
    toast.innerText = message;
    if (isError) {
        toast.style.backgroundColor = '#dc2626';
    } else {
        toast.style.backgroundColor = 'var(--text-main)';
    }
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        if (isError) {
            toast.style.backgroundColor = 'var(--text-main)';
        }
    }, 2400);
}

function inicializarAjustes() {
    console.log('Tela de Ajustes carregada');
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
window.addEventListener('DOMContentLoaded', function() {
    mudarTela('tela-1');
    
    const buscaPesquisa = document.querySelector('#tela-6 .pesquisa-busca input');
    if (buscaPesquisa) {
        buscaPesquisa.addEventListener('input', function(e) {
            console.log('Pesquisando:', this.value);
        });
    }

    const categoriasGrid = document.querySelector('#tela-5 .categorias-grid');
    if (categoriasGrid) {
        const btnVerProdutos = document.createElement('button');
        btnVerProdutos.className = 'categoria';
        btnVerProdutos.onclick = () => abrirProdutosCliente();
        btnVerProdutos.innerHTML = '<div class="categoria-icone"><span class="material-symbols-outlined">restaurant_menu</span></div><span>Ver Cardápio</span>';
        categoriasGrid.appendChild(btnVerProdutos);
    }
    
    carregarProdutos();
    
    const tipoSalvo = localStorage.getItem('tipoUsuario');
    const nomeSalvo = localStorage.getItem('nomeUsuario');
    const emailSalvo = localStorage.getItem('emailUsuario');
    if (tipoSalvo && nomeSalvo) {
        tipoUsuario = tipoSalvo;
        const nomePerfil = document.getElementById('nomePerfil');
        const emailPerfil = document.getElementById('emailPerfil');
        if (nomePerfil) nomePerfil.textContent = nomeSalvo;
        if (emailPerfil) emailPerfil.textContent = emailSalvo;
        if (tipoSalvo === 'cliente') mudarTela('tela-5');
        else if (tipoSalvo === 'empresa') mudarTela('tela-10');
    }
});

document.addEventListener('visibilitychange', function() {
    if (document.hidden && isRecording) pararGravacao();
});

document.addEventListener('submit', function(e) {
    e.preventDefault();
});

// ==========================================
// TOGGLE VISIBILIDADE DE SENHA
// ==========================================
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
