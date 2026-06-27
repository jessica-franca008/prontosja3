// ==========================================
// CONFIGURAÇÕES FIREBASE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    updateDoc,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
let usuarioLogado = null;

// ==========================================
// SISTEMA DE NAVEGAÇÃO ENTRE TELAS
// ==========================================
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
        setTimeout(() => {
            inicializarSwitchLoja();
            carregarPedidosEmpresa();
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
        setTimeout(() => {
            carregarPedidosCliente();
        }, 100);
    }
}

// ==========================================
// FUNCIONALIDADES DO CADASTRO DE PRODUTO
// ==========================================
let currentImageData = null;
let currentFile = null;

function inicializarCadastroProduto() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('productPhotoInput');
    const previewContainer = document.getElementById('photoPreviewContainer');
    const previewImg = document.getElementById('previewImg');
    const previewFileNameSpan = document.getElementById('previewFileName');
    const removePhotoBtn = document.getElementById('removePhotoBtn');
    const productNameInput = document.getElementById('productName');
    const categorySelect = document.getElementById('productCategory');
    const priceInput = document.getElementById('productPrice');
    const descriptionTextarea = document.getElementById('productDescription');
    
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

// ==========================================
// FUNCIONALIDADE DE PEDIDOS
// ==========================================

// PARTE 1 & 2: CRIAR PEDIDO NO FIRESTORE
async function criarPedido(produtoId, produtoNome, produtoPreco) {
    if (!usuarioLogado) {
        showToast('Faça login para fazer um pedido', true);
        return;
    }

    try {
        // Buscar informações do produto para pegar empresaId e empresaNome
        const produtoRef = doc(db, "produtos", produtoId);
        const produtoDoc = await getDoc(produtoRef);
        
        if (!produtoDoc.exists()) {
            showToast('Produto não encontrado', true);
            return;
        }

        const produtoData = produtoDoc.data();

        const pedidoData = {
            clienteId: usuarioLogado.uid,
            clienteNome: usuarioLogado.displayName || 'Cliente',
            clienteEmail: usuarioLogado.email || '',
            empresaId: produtoData.empresa || '',
            empresaNome: produtoData.empresaNome || 'Empresa',
            produtoId: produtoId,
            nomeProduto: produtoNome,
            preco: produtoPreco,
            quantidade: 1,
            status: 'Pendente',
            criadoEm: serverTimestamp(),
            atualizadoEm: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, "pedidos"), pedidoData);
        showToast('Pedido realizado com sucesso!');
        console.log('Pedido criado com ID:', docRef.id);
        
        // Redirecionar para tela de pedidos
        setTimeout(() => {
            mudarTela('tela-7');
        }, 1000);

    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        showToast('Erro ao realizar pedido: ' + error.message, true);
    }
}

// PARTE 3: CARREGAR PEDIDOS DO CLIENTE
function carregarPedidosCliente() {
    const container = document.querySelector('.pedidos-conteudo');
    if (!container) return;

    if (!usuarioLogado) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">Faça login para ver seus pedidos</p>';
        return;
    }

    container.innerHTML = '<p style="text-align:center; padding:20px;">Carregando pedidos...</p>';

    const q = query(
        collection(db, "pedidos"),
        where("clienteId", "==", usuarioLogado.uid),
        orderBy("criadoEm", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (querySnapshot.empty) {
            container.innerHTML = `
                <div style="text-align:center; padding:40px 20px;">
                    <span class="material-symbols-outlined" style="font-size:64px; color:#ccc;">receipt_long</span>
                    <h3 style="color:#666;">Nenhum pedido encontrado</h3>
                    <p style="color:#999;">Faça seu primeiro pedido agora!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const pedido = doc.data();
            const pedidoId = doc.id;
            
            const statusClass = getStatusClass(pedido.status);
            const statusIcon = getStatusIcon(pedido.status);
            
            // Formatar preço
            let precoFormatado = pedido.preco;
            if (typeof precoFormatado === 'string' && precoFormatado.includes('R$')) {
                // Já está formatado
            } else {
                const precoNum = parseFloat(pedido.preco);
                precoFormatado = !isNaN(precoNum) ? `R$ ${precoNum.toFixed(2).replace('.', ',')}` : pedido.preco;
            }

            const pedidoCard = document.createElement('div');
            pedidoCard.className = 'pedido-card';
            pedidoCard.innerHTML = `
                <div class="pedido-imagem" style="background-image: url('https://via.placeholder.com/80x80/eee/999?text=🍔');"></div>
                <div class="pedido-info">
                    <div class="pedido-titulo">
                        <h3>${pedido.nomeProduto || 'Produto'}</h3>
                        <span class="pedido-status status-${pedido.status.toLowerCase()}">
                            ${statusIcon} ${pedido.status}
                        </span>
                    </div>
                    <p class="pedido-data">
                        Pedido #${pedidoId.slice(0, 6).toUpperCase()} • 
                        ${pedido.criadoEm ? new Date(pedido.criadoEm.toDate()).toLocaleDateString('pt-BR') : 'Data não disponível'}
                    </p>
                    <p class="pedido-descricao">
                        <strong>${precoFormatado}</strong> • ${pedido.quantidade || 1}x
                    </p>
                    <div style="margin-top: 5px; font-size: 12px; color: #888;">
                        ${pedido.empresaNome || 'Loja'}
                    </div>
                </div>
                ${pedido.status !== 'Entregue' ? `
                    <button onclick="abrirChatPedido('${pedidoId}')" class="btn-chat-pedido">
                        <span class="material-symbols-outlined">chat</span>
                    </button>
                ` : ''}
            `;
            
            container.appendChild(pedidoCard);
        });
    });

    // Armazenar unsubscribe para limpeza
    window.pedidosClienteUnsubscribe = unsubscribe;
}

// PARTE 4 & 5: CARREGAR PEDIDOS DA EMPRESA
function carregarPedidosEmpresa() {
    if (!usuarioLogado) {
        const pedidosContainer = document.querySelector('.loja-pedidos');
        if (pedidosContainer) {
            pedidosContainer.innerHTML = '<p style="text-align:center; padding:20px;">Faça login para ver os pedidos</p>';
        }
        return;
    }

    // Buscar empresaId do usuário logado (pode vir do cadastro ou do produto)
    const empresaId = usuarioLogado.uid;

    // Atualizar contadores
    atualizarContadoresPedidos(empresaId);

    const q = query(
        collection(db, "pedidos"),
        where("empresaId", "==", empresaId),
        where("status", "in", ["Pendente", "Aceito", "Em preparo", "Saiu para entrega"]),
        orderBy("criadoEm", "desc")
    );

    const pedidosContainer = document.querySelector('.loja-pedidos');
    if (!pedidosContainer) return;

    pedidosContainer.innerHTML = '<p style="text-align:center; padding:20px;">Carregando pedidos...</p>';

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (querySnapshot.empty) {
            pedidosContainer.innerHTML = `
                <div style="text-align:center; padding:30px 20px; color:#999;">
                    <span class="material-symbols-outlined" style="font-size:48px;">inbox</span>
                    <p>Nenhum pedido pendente</p>
                </div>
            `;
            atualizarContadoresPedidos(empresaId);
            return;
        }

        pedidosContainer.innerHTML = '';
        let pendentes = 0;
        let preparo = 0;

        querySnapshot.forEach((doc) => {
            const pedido = doc.data();
            const pedidoId = doc.id;
            
            if (pedido.status === 'Pendente') pendentes++;
            if (pedido.status === 'Aceito' || pedido.status === 'Em preparo') preparo++;

            let precoFormatado = pedido.preco;
            if (typeof precoFormatado === 'string' && precoFormatado.includes('R$')) {
                // Já está formatado
            } else {
                const precoNum = parseFloat(pedido.preco);
                precoFormatado = !isNaN(precoNum) ? `R$ ${precoNum.toFixed(2).replace('.', ',')}` : pedido.preco;
            }

            const pedidoDiv = document.createElement('div');
            pedidoDiv.className = 'loja-pedido';
            pedidoDiv.setAttribute('data-pedido-id', pedidoId);
            
            const statusMap = {
                'Pendente': { class: 'status-pendente', label: '🕐 Pendente' },
                'Aceito': { class: 'status-aceito', label: '✅ Aceito' },
                'Em preparo': { class: 'status-preparo', label: '👨‍🍳 Em preparo' },
                'Saiu para entrega': { class: 'status-entrega', label: '🚚 Saiu para entrega' }
            };

            const statusInfo = statusMap[pedido.status] || { class: '', label: pedido.status };

            pedidoDiv.innerHTML = `
                <div class="pedido-top">
                    <strong>${pedido.clienteNome || 'Cliente'}</strong>
                    <strong>${precoFormatado}</strong>
                </div>
                <small>#${pedidoId.slice(0, 6).toUpperCase()}</small>
                <div class="pedido-list">
                    ${pedido.nomeProduto || 'Produto'} × ${pedido.quantidade || 1}
                    ${pedido.status ? `<br><span class="${statusInfo.class}">${statusInfo.label}</span>` : ''}
                </div>
                ${pedido.status === 'Pendente' ? `
                    <button class="btn-aceitar" onclick="aceitarPedido('${pedidoId}')">
                        Aceitar
                    </button>
                ` : pedido.status === 'Aceito' ? `
                    <button class="btn-atualizar" onclick="atualizarStatusPedido('${pedidoId}', 'Em preparo')">
                        Iniciar Preparo
                    </button>
                ` : pedido.status === 'Em preparo' ? `
                    <button class="btn-atualizar" onclick="atualizarStatusPedido('${pedidoId}', 'Saiu para entrega')">
                        Enviar para Entrega
                    </button>
                ` : pedido.status === 'Saiu para entrega' ? `
                    <button class="btn-atualizar" onclick="atualizarStatusPedido('${pedidoId}', 'Entregue')">
                        Marcar como Entregue
                    </button>
                ` : ''}
            `;
            
            pedidosContainer.appendChild(pedidoDiv);
        });

        // Atualizar contadores
        const pendentesCard = document.querySelector('.loja-card:first-child h2');
        if (pendentesCard) {
            pendentesCard.textContent = pendentes;
        }
        
        const preparoCard = document.querySelector('.loja-card:last-child h2');
        if (preparoCard) {
            preparoCard.textContent = preparo;
        }
    });

    window.pedidosEmpresaUnsubscribe = unsubscribe;
}

// Função para atualizar contadores de pedidos
async function atualizarContadoresPedidos(empresaId) {
    try {
        // Pendentes
        const qPendentes = query(
            collection(db, "pedidos"),
            where("empresaId", "==", empresaId),
            where("status", "==", "Pendente")
        );
        const snapPendentes = await getDocs(qPendentes);
        const pendentesCard = document.querySelector('.loja-card:first-child h2');
        if (pendentesCard) {
            pendentesCard.textContent = snapPendentes.size;
        }

        // Em preparo (Aceito + Em preparo)
        const qPreparo = query(
            collection(db, "pedidos"),
            where("empresaId", "==", empresaId),
            where("status", "in", ["Aceito", "Em preparo"])
        );
        const snapPreparo = await getDocs(qPreparo);
        const preparoCard = document.querySelector('.loja-card:last-child h2');
        if (preparoCard) {
            preparoCard.textContent = snapPreparo.size;
        }
    } catch (error) {
        console.error('Erro ao atualizar contadores:', error);
    }
}

// Função para aceitar pedido
async function aceitarPedido(pedidoId) {
    try {
        await atualizarStatusPedido(pedidoId, 'Aceito');
        showToast('Pedido aceito com sucesso!');
    } catch (error) {
        console.error('Erro ao aceitar pedido:', error);
        showToast('Erro ao aceitar pedido', true);
    }
}

// Função para atualizar status do pedido
async function atualizarStatusPedido(pedidoId, novoStatus) {
    try {
        const pedidoRef = doc(db, "pedidos", pedidoId);
        await updateDoc(pedidoRef, {
            status: novoStatus,
            atualizadoEm: serverTimestamp()
        });
        showToast(`Status atualizado para: ${novoStatus}`);
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showToast('Erro ao atualizar status do pedido', true);
        throw error;
    }
}

// Funções auxiliares para status
function getStatusClass(status) {
    const map = {
        'Pendente': 'status-pendente',
        'Aceito': 'status-aceito',
        'Em preparo': 'status-preparo',
        'Saiu para entrega': 'status-entrega',
        'Entregue': 'status-entregue'
    };
    return map[status] || '';
}

function getStatusIcon(status) {
    const map = {
        'Pendente': '🕐',
        'Aceito': '✅',
        'Em preparo': '👨‍🍳',
        'Saiu para entrega': '🚚',
        'Entregue': '📦'
    };
    return map[status] || '';
}

// Função para abrir chat do pedido
function abrirChatPedido(pedidoId) {
    // Armazenar o ID do pedido para o chat
    localStorage.setItem('pedidoChatId', pedidoId);
    mudarTela('tela-8');
    setTimeout(() => {
        inicializarChatPedido(pedidoId);
    }, 100);
}

// ==========================================
// FUNCIONALIDADE DO CHAT POR PEDIDO
// ==========================================
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let audioStream;
let currentChatPedidoId = null;

function inicializarChat() {
    // Verificar se há um pedido específico para o chat
    const pedidoId = localStorage.getItem('pedidoChatId');
    if (pedidoId) {
        inicializarChatPedido(pedidoId);
    } else {
        // Chat genérico (fallback)
        configurarChatGenerico();
    }
}

function inicializarChatPedido(pedidoId) {
    currentChatPedidoId = pedidoId;
    const chatInput = document.getElementById('chat-input');
    const recordBtn = document.getElementById('record-btn');
    const sendBtn = document.getElementById('send-btn');
    
    if (!chatInput || !recordBtn || !sendBtn) return;
    
    // Limpar mensagens anteriores
    const chatMessages = document.getElementById('chat-mensagens');
    if (chatMessages) {
        chatMessages.innerHTML = `
            <div class="chat-data">Hoje</div>
            <div class="chat-info">
                <p style="text-align:center; color:#666; padding:20px;">
                    Chat do Pedido #${pedidoId.slice(0, 6).toUpperCase()}
                </p>
            </div>
        `;
    }
    
    // Configurar listeners
    configurarListenersChat(chatInput, recordBtn, sendBtn);
    
    // Carregar histórico do chat (se implementado)
    // carregarHistoricoChat(pedidoId);
}

function configurarChatGenerico() {
    const chatInput = document.getElementById('chat-input');
    const recordBtn = document.getElementById('record-btn');
    const sendBtn = document.getElementById('send-btn');
    
    if (!chatInput || !recordBtn || !sendBtn) return;
    
    // Limpar mensagens
    const chatMessages = document.getElementById('chat-mensagens');
    if (chatMessages) {
        chatMessages.innerHTML = `
            <div class="chat-data">Hoje</div>
            <div class="chat-info">
                <p style="text-align:center; color:#666; padding:20px;">
                    Chat geral do entregador
                </p>
            </div>
        `;
    }
    
    configurarListenersChat(chatInput, recordBtn, sendBtn);
}

function configurarListenersChat(chatInput, recordBtn, sendBtn) {
    // Remover listeners antigos
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    
    const newRecordBtn = recordBtn.cloneNode(true);
    recordBtn.parentNode.replaceChild(newRecordBtn, recordBtn);
    
    const finalSendBtn = document.getElementById('send-btn');
    const finalRecordBtn = document.getElementById('record-btn');
    
    finalSendBtn.addEventListener('click', function() {
        const input = document.getElementById('chat-input');
        if (input && input.value.trim()) {
            enviarMensagemChat(input.value);
            input.value = '';
        }
    });
    
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim()) {
                enviarMensagemChat(this.value);
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

function enviarMensagemChat(texto) {
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
    
    // Salvar mensagem no Firestore (se implementado)
    // salvarMensagemChat(currentChatPedidoId, texto, 'enviada');
    
    // Simular resposta automática
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
}

// ==========================================
// SWITCH DA LOJA
// ==========================================
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
            const nome = item.querySelector('h4')?.textContent.toLowerCase() || '';
            const descricao = item.querySelector('p')?.textContent.toLowerCase() || '';
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

function inicializarAjustes() {
    console.log('Tela de Ajustes carregada');
}

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
        usuarioLogado = user;
        
        const nome = user.displayName || "Usuário";
        const email = user.email || "";
        localStorage.setItem('tipoUsuario', tipoUsuario);
        localStorage.setItem('nomeUsuario', nome);
        localStorage.setItem('emailUsuario', email);
        
        const nomePerfil = document.getElementById('nomePerfil');
        const emailPerfil = document.getElementById('emailPerfil');
        if (nomePerfil) nomePerfil.textContent = nome;
        if (emailPerfil) emailPerfil.textContent = email;
        
        if (tipoUsuario === 'cliente') {
            mudarTela('tela-5');
            // Carregar pedidos do cliente
            setTimeout(carregarPedidosCliente, 200);
        } else if (tipoUsuario === 'empresa') {
            mudarTela('tela-10');
            // Carregar pedidos da empresa
            setTimeout(carregarPedidosEmpresa, 200);
        } else {
            mudarTela('tela-5');
        }
    } catch (error) {
        console.error("Erro no login:", error);
        alert("Erro ao fazer login: " + error.message);
    }
};

window.sairDaConta = function() {
    // Cancelar listeners
    if (window.pedidosClienteUnsubscribe) {
        window.pedidosClienteUnsubscribe();
    }
    if (window.pedidosEmpresaUnsubscribe) {
        window.pedidosEmpresaUnsubscribe();
    }
    
    auth.signOut().then(() => {
        tipoUsuario = null;
        usuarioLogado = null;
        localStorage.removeItem('tipoUsuario');
        localStorage.removeItem('nomeUsuario');
        localStorage.removeItem('emailUsuario');
        mudarTela('tela-2');
    }).catch((error) => console.error("Erro ao sair:", error));
};

// ==========================================
// FUNÇÕES DE PRODUTOS (Firestore)
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
            empresa: user.uid,
            empresaNome: user.displayName || 'Empresa',
            empresaEmail: user.email || '',
            criadoEm: serverTimestamp()
        });

        showToast("Produto cadastrado com sucesso!");

        document.getElementById("productName").value = "";
        document.getElementById("productPrice").value = "";
        document.getElementById("productDescription").value = "";

        // Resetar foto
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
        showToast("Erro ao salvar produto: " + erro.message, true);
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
            const produtoId = doc.id;
            if (!categoriasMap.has(produto.categoria)) {
                categoriasMap.set(produto.categoria, []);
            }
            categoriasMap.get(produto.categoria).push({ ...produto, id: produtoId });
        });
        
        for (let [categoria, produtosList] of categoriasMap) {
            lista.innerHTML += `<h3>${categoria}</h3>`;
            produtosList.forEach(produto => {
                let precoFormatado = `R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}`;
                lista.innerHTML += `
                    <div class="cardapio-item" data-produto-id="${produto.id}">
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

// ==========================================
// PRODUTOS PARA CLIENTE
// ==========================================
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
            const produtoId = doc.id;
            let precoFormatado = `R$ ${parseFloat(p.preco).toFixed(2).replace('.', ',')}`;
            lista.innerHTML += `
                <div class="produto-cliente-card">
                    <h3>${p.nome}</h3>
                    <p>${p.descricao || ''}</p>
                    <strong>${precoFormatado}</strong>
                    <button class="btn-adicionar-carrinho" onclick="adicionarAoCarrinho('${produtoId}', '${p.nome.replace(/'/g, "\\'")}', '${p.preco}')">
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

// ==========================================
// FUNÇÃO ADICIONAR AO CARRINHO (CRIA PEDIDO)
// ==========================================
window.adicionarAoCarrinho = async function(produtoId, produtoNome, produtoPreco) {
    await criarPedido(produtoId, produtoNome, produtoPreco);
};

window.abrirProdutosCliente = function() {
    mudarTela('tela-15');
    setTimeout(carregarProdutosCliente, 100);
};

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
    
    // Verificar autenticação
    onAuthStateChanged(auth, (user) => {
        if (user) {
            usuarioLogado = user;
            const tipoSalvo = localStorage.getItem('tipoUsuario');
            if (tipoSalvo) {
                tipoUsuario = tipoSalvo;
                if (tipoSalvo === 'cliente') {
                    // Carregar pedidos do cliente
                    setTimeout(carregarPedidosCliente, 500);
                } else if (tipoSalvo === 'empresa') {
                    // Carregar pedidos da empresa
                    setTimeout(carregarPedidosEmpresa, 500);
                }
            }
        } else {
            // Usuário não logado
            const tipoSalvo = localStorage.getItem('tipoUsuario');
            if (!tipoSalvo) {
                mudarTela('tela-1');
            }
        }
    });

    // Adicionar botão na home cliente para ver produtos
    const categoriasGrid = document.querySelector('#tela-5 .categorias-grid');
    if (categoriasGrid) {
        const btnVerProdutos = document.createElement('button');
        btnVerProdutos.className = 'categoria';
        btnVerProdutos.onclick = () => abrirProdutosCliente();
        btnVerProdutos.innerHTML = '<div class="categoria-icone"><span class="material-symbols-outlined">restaurant_menu</span></div><span>Ver Cardápio</span>';
        categoriasGrid.appendChild(btnVerProdutos);
    }
    
    carregarProdutos();
});

document.addEventListener('visibilitychange', function() {
    if (document.hidden && isRecording) pararGravacao();
});

document.addEventListener('submit', function(e) {
    e.preventDefault();
});
