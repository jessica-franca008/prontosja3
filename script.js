// SISTEMA DE NAVEGAÇÃO ENTRE TELAS
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
        setTimeout(carregarProdutosEmpresa, 100);
    }
    
    if (idTela === 'tela-12') {
        setTimeout(() => {
            inicializarBuscaMensagens();
            inicializarCliquesMensagens();
        }, 100);
    }
    
    if (idTela === 'tela-14') {
        setTimeout(inicializarCadastroProduto, 100);
    }
    
    if (idTela === 'tela-15') {
        setTimeout(carregarProdutosCliente, 100);
    }
}

// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================
let currentImageData = null;
let currentFile = null;
let unsubscribeEmpresa = null;
let unsubscribeCliente = null;

// ==========================================
// FUNCIONALIDADES DO CADASTRO DE PRODUTO
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
    
    // Resetar formulário
    document.getElementById('productName').value = '';
    document.getElementById('productCategory').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productDescription').value = '';
    
    function showPreview(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImageData = e.target.result;
            if (previewImg) previewImg.src = currentImageData;
            if (previewFileNameSpan) {
                previewFileNameSpan.innerText = file.name.length > 28 ? file.name.substring(0, 25) + '...' : file.name;
            }
            if (uploadArea) uploadArea.style.display = 'none';
            if (previewContainer) previewContainer.style.display = 'flex';
        };
        reader.readAsDataURL(file);
        currentFile = file;
    }
    
    function resetPhoto() {
        currentImageData = null;
        currentFile = null;
        if (fileInput) fileInput.value = '';
        if (previewImg) previewImg.src = '#';
        if (previewContainer) previewContainer.style.display = 'none';
        if (uploadArea) uploadArea.style.display = 'flex';
    }
    
    // Remover listeners antigos
    const newUploadArea = uploadArea.cloneNode(true);
    uploadArea.parentNode.replaceChild(newUploadArea, uploadArea);
    
    const finalUploadArea = document.getElementById('uploadArea');
    const finalFileInput = document.getElementById('productPhotoInput');
    const finalRemovePhotoBtn = document.getElementById('removePhotoBtn');
    
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
                    showToast('Por favor selecione uma imagem válida', true);
                }
            }
        });
    }
    
    if (finalRemovePhotoBtn) {
        const newRemoveBtn = finalRemovePhotoBtn.cloneNode(true);
        finalRemovePhotoBtn.parentNode.replaceChild(newRemoveBtn, finalRemovePhotoBtn);
        document.getElementById('removePhotoBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            resetPhoto();
        });
    }
    
    if (priceInput) {
        priceInput.addEventListener('input', function(e) {
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
    }
    
    resetPhoto();
    if (priceInput) priceInput.placeholder = "0,00";
}

// SALVAR PRODUTO NO FIREBASE
window.salvarProduto = async function() {
    console.log("🔵 FUNÇÃO SALVAR PRODUTO EXECUTADA");
    
    const productName = document.getElementById('productName');
    const categorySelect = document.getElementById('productCategory');
    const priceInput = document.getElementById('productPrice');
    const descriptionTextarea = document.getElementById('productDescription');
    
    const nome = productName ? productName.value.trim() : '';
    const categoria = categorySelect ? categorySelect.value : '';
    const precoRaw = priceInput ? priceInput.value.trim() : '';
    const descricao = descriptionTextarea ? descriptionTextarea.value.trim() : '';
    
    console.log("Dados:", { nome, categoria, precoRaw });
    
    // Validações
    if (nome === '') {
        showToast('⚠️ Informe o nome do produto', true);
        return;
    }
    if (!categoria || categoria === '') {
        showToast('📂 Selecione uma categoria', true);
        return;
    }
    if (precoRaw === '') {
        showToast('💰 Defina um preço válido', true);
        return;
    }
    
    let numericStr = precoRaw.replace(/\./g, '').replace(',', '.');
    let precoNumerico = parseFloat(numericStr);
    if (isNaN(precoNumerico) || precoNumerico < 0) {
        showToast('Preço inválido, utilize formato 0,00', true);
        return;
    }
    
    if (descricao === '') {
        showToast('✏️ Adicione uma descrição', true);
        return;
    }
    
    // Verificar Firebase
    if (!firebase || !firebase.firestore) {
        console.error("❌ Firebase não carregado!");
        showToast('❌ Erro: Firebase não inicializado', true);
        return;
    }
    
    showToast('📤 Salvando...', false);
    
    try {
        let fotoURL = null;
        
        // Upload da foto se existir
        if (currentFile) {
            const fileName = `produtos/${Date.now()}_${currentFile.name}`;
            const storageRef = firebase.storage().ref(fileName);
            const uploadTask = await storageRef.put(currentFile);
            fotoURL = await uploadTask.ref.getDownloadURL();
        }
        
        // Salvar no Firestore
        const produto = {
            nome: nome,
            categoria: categoria,
            preco: precoNumerico,
            precoFormatado: `R$ ${precoNumerico.toFixed(2).replace('.', ',')}`,
            descricao: descricao,
            disponivel: true,
            fotoURL: fotoURL,
            dataCadastro: new Date().toISOString(),
            lojaId: localStorage.getItem('userUID') || 'loja_teste',
            lojaNome: localStorage.getItem('nomeUsuario') || 'Minha Loja'
        };
        
        console.log("Enviando produto:", produto);
        
        const docRef = await firebase.firestore().collection('produtos').add(produto);
        
        console.log("✅ PRODUTO SALVO! ID:", docRef.id);
        showToast(`✅ "${nome}" salvo com sucesso!`, false);
        
        // Limpar formulário
        if (productName) productName.value = '';
        if (categorySelect) categorySelect.value = '';
        if (priceInput) priceInput.value = '';
        if (descriptionTextarea) descriptionTextarea.value = '';
        
        // Resetar foto
        currentImageData = null;
        currentFile = null;
        const fileInput = document.getElementById('productPhotoInput');
        if (fileInput) fileInput.value = '';
        const previewContainer = document.getElementById('photoPreviewContainer');
        const uploadArea = document.getElementById('uploadArea');
        if (previewContainer) previewContainer.style.display = 'none';
        if (uploadArea) uploadArea.style.display = 'flex';
        
        setTimeout(() => {
            mudarTela('tela-11');
        }, 1500);
        
    } catch (error) {
        console.error("❌ ERRO:", error);
        showToast(`❌ Erro: ${error.message}`, true);
    }
};

// ==========================================
// CARDÁPIO DA EMPRESA
// ==========================================

function carregarProdutosEmpresa() {
    const container = document.getElementById('cardapio-content');
    if (!container) return;
    
    if (unsubscribeEmpresa) unsubscribeEmpresa();
    
    const lojaId = localStorage.getItem('userUID') || 'loja_teste';
    
    container.innerHTML = '<p style="text-align:center; padding:20px;">🔄 Carregando...</p>';
    
    const query = firebase.firestore()
        .collection('produtos')
        .where('lojaId', '==', lojaId)
        .orderBy('dataCadastro', 'desc');
    
    unsubscribeEmpresa = query.onSnapshot((snapshot) => {
        const produtos = [];
        snapshot.forEach(doc => {
            produtos.push({ id: doc.id, ...doc.data() });
        });
        
        if (produtos.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px;">📭 Nenhum produto. Clique no + para adicionar.</p>';
            return;
        }
        
        // Agrupar por categoria
        const grupos = {};
        produtos.forEach(p => {
            if (!grupos[p.categoria]) grupos[p.categoria] = [];
            grupos[p.categoria].push(p);
        });
        
        let html = '';
        for (const [categoria, items] of Object.entries(grupos)) {
            html += `<h3 style="margin-top: 16px;">${categoria}</h3>`;
            items.forEach(p => {
                html += `
                    <div class="cardapio-item">
                        <div style="display:flex; gap:12px; flex:1;">
                            ${p.fotoURL ? `<img src="${p.fotoURL}" style="width:56px; height:56px; border-radius:12px; object-fit:cover;">` : ''}
                            <div>
                                <h4>${p.nome}</h4>
                                <p style="font-size:12px; color:#666;">${p.descricao.substring(0, 60)}...</p>
                                <span class="cardapio-price">${p.precoFormatado}</span>
                            </div>
                        </div>
                        <label class="cardapio-switch">
                            <input type="checkbox" ${p.disponivel ? 'checked' : ''} onchange="toggleProduto('${p.id}', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>
                `;
            });
        }
        
        container.innerHTML = html;
        
        // Aplicar busca
        const busca = document.getElementById('cardapio-busca');
        if (busca && busca.value) {
            filtrarProdutosEmpresa(busca.value);
        }
    });
}

function filtrarProdutosEmpresa(termo) {
    termo = termo.toLowerCase();
    const items = document.querySelectorAll('#cardapio-content .cardapio-item');
    items.forEach(item => {
        const nome = item.querySelector('h4')?.textContent.toLowerCase() || '';
        item.style.display = nome.includes(termo) ? 'flex' : 'none';
    });
}

window.toggleProduto = async function(id, disponivel) {
    try {
        await firebase.firestore().collection('produtos').doc(id).update({ disponivel: disponivel });
        console.log(`Produto ${id} agora ${disponivel ? 'disponível' : 'indisponível'}`);
    } catch (error) {
        console.error("Erro:", error);
    }
};

// ==========================================
// CARDÁPIO DO CLIENTE
// ==========================================

window.abrirCardapioCliente = function() {
    mudarTela('tela-15');
};

function carregarProdutosCliente() {
    const container = document.getElementById('cardapio-cliente-content');
    if (!container) return;
    
    if (unsubscribeCliente) unsubscribeCliente();
    
    container.innerHTML = '<p style="text-align:center; padding:20px;">🔄 Carregando cardápio...</p>';
    
    const query = firebase.firestore()
        .collection('produtos')
        .where('disponivel', '==', true)
        .orderBy('dataCadastro', 'desc');
    
    unsubscribeCliente = query.onSnapshot((snapshot) => {
        const produtos = [];
        snapshot.forEach(doc => {
            produtos.push({ id: doc.id, ...doc.data() });
        });
        
        if (produtos.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px;">📭 Nenhum produto disponível no momento.</p>';
            return;
        }
        
        // Agrupar por categoria
        const grupos = {};
        produtos.forEach(p => {
            if (!grupos[p.categoria]) grupos[p.categoria] = [];
            grupos[p.categoria].push(p);
        });
        
        let html = '';
        for (const [categoria, items] of Object.entries(grupos)) {
            html += `<h3 style="margin-top: 16px;">${categoria}</h3>`;
            items.forEach(p => {
                html += `
                    <div class="cardapio-item-cliente" style="background:white; border:1px solid #e9ced0; border-radius:12px; padding:12px; margin-bottom:12px;">
                        <div style="display:flex; gap:12px; align-items:center;">
                            ${p.fotoURL ? `<img src="${p.fotoURL}" style="width:60px; height:60px; border-radius:12px; object-fit:cover;">` : '<div style="width:60px; height:60px; background:#f0f0f0; border-radius:12px;"></div>'}
                            <div style="flex:1;">
                                <h4 style="font-size:14px; margin:0 0 4px 0;">${p.nome}</h4>
                                <p style="font-size:12px; color:#666; margin:0 0 4px 0;">${p.descricao.substring(0, 60)}...</p>
                                <span style="font-weight:700; color:var(--primary);">${p.precoFormatado}</span>
                            </div>
                            <button class="btn-adicionar" onclick="adicionarAoCarrinho('${p.id}', '${p.nome.replace(/'/g, "\\'")}', ${p.preco})">+</button>
                        </div>
                    </div>
                `;
            });
        }
        
        container.innerHTML = html;
        
        const busca = document.getElementById('cardapio-cliente-busca');
        if (busca && busca.value) {
            filtrarProdutosCliente(busca.value);
        }
    });
}

function filtrarProdutosCliente(termo) {
    termo = termo.toLowerCase();
    const items = document.querySelectorAll('#cardapio-cliente-content .cardapio-item-cliente');
    items.forEach(item => {
        const nome = item.querySelector('h4')?.textContent.toLowerCase() || '';
        item.style.display = nome.includes(termo) ? 'block' : 'none';
    });
}

window.adicionarAoCarrinho = function(id, nome, preco) {
    showToast(`🛒 ${nome} adicionado ao carrinho!`, false);
    console.log(`Carrinho: ${nome} - R$ ${preco}`);
};

// ==========================================
// TOAST
// ==========================================

function showToast(message, isError = false) {
    let toast = document.querySelector('.toast-message');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-message';
        document.body.appendChild(toast);
    }
    
    toast.innerText = message;
    toast.style.backgroundColor = isError ? '#dc2626' : 'var(--text-main)';
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2400);
}

// ==========================================
// CHAT
// ==========================================

let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let audioStream;

function inicializarChat() {
    const chatInput = document.getElementById('chat-input');
    const recordBtn = document.getElementById('record-btn');
    const sendBtn = document.getElementById('send-btn');
    
    if (!chatInput) return;
    
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    
    const newRecordBtn = recordBtn.cloneNode(true);
    recordBtn.parentNode.replaceChild(newRecordBtn, recordBtn);
    
    const finalSendBtn = document.getElementById('send-btn');
    const finalRecordBtn = document.getElementById('record-btn');
    
    finalSendBtn.addEventListener('click', () => {
        if (chatInput.value.trim()) {
            enviarMensagem(chatInput.value);
            chatInput.value = '';
        }
    });
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim()) {
            enviarMensagem(chatInput.value);
            chatInput.value = '';
        }
    });
    
    finalRecordBtn.addEventListener('click', () => {
        if (!isRecording) {
            iniciarGravacao();
        } else {
            pararGravacao();
        }
    });
}

function enviarMensagem(texto) {
    const chatMessages = document.getElementById('chat-mensagens');
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const msgDiv = document.createElement('div');
    msgDiv.className = 'mensagem mensagem-enviada';
    msgDiv.innerHTML = `
        <div class="mensagem-conteudo">
            <div class="mensagem-balao mensagem-balao-enviada"><p>${texto}</p></div>
            <div class="mensagem-status"><span class="mensagem-hora">${hora}</span><span class="material-symbols-outlined">done_all</span></div>
        </div>
    `;
    
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    setTimeout(() => {
        const respostas = ["Entendido! O entregador já está a caminho.", "Seu pedido está sendo preparado.", "O entregador está na sua região."];
        const resposta = respostas[Math.floor(Math.random() * respostas.length)];
        const horaResp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const respDiv = document.createElement('div');
        respDiv.className = 'mensagem mensagem-recebida';
        respDiv.innerHTML = `
            <div class="mensagem-conteudo">
                <div class="mensagem-balao"><p>${resposta}</p></div>
                <span class="mensagem-hora">${horaResp}</span>
            </div>
        `;
        chatMessages.appendChild(respDiv);
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
        console.error('Erro:', error);
        alert('Não foi possível acessar o microfone.');
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
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const audioDiv = document.createElement('div');
    audioDiv.className = 'mensagem mensagem-enviada';
    audioDiv.innerHTML = `
        <div class="mensagem-conteudo">
            <div class="mensagem-balao mensagem-balao-enviada">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="material-symbols-outlined">mic</span>
                    <span>Áudio gravado</span>
                    <span class="material-symbols-outlined audio-play" style="cursor:pointer;">play_arrow</span>
                </div>
            </div>
            <div class="mensagem-status"><span class="mensagem-hora">${hora}</span><span class="material-symbols-outlined">done_all</span></div>
        </div>
    `;
    
    chatMessages.appendChild(audioDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    const audio = new Audio(URL.createObjectURL(audioBlob));
    const playBtn = audioDiv.querySelector('.audio-play');
    
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                playBtn.textContent = 'pause';
            } else {
                audio.pause();
                playBtn.textContent = 'play_arrow';
            }
        });
    }
}

// ==========================================
// OUTRAS FUNÇÕES
// ==========================================

function inicializarSwitchLoja() {
    const switchBtn = document.getElementById("switch");
    const statusText = document.getElementById("status-text");
    if (switchBtn && statusText && !switchBtn.hasListener) {
        switchBtn.onclick = () => {
            switchBtn.classList.toggle("off");
            statusText.textContent = switchBtn.classList.contains("off") ? "Fechado" : "Aberto";
        };
        switchBtn.hasListener = true;
    }
}

function aceitarPedido(botao) {
    const pedidoDiv = botao.closest('.loja-pedido');
    if (pedidoDiv) {
        botao.textContent = 'Aceito!';
        botao.style.background = '#10b981';
        botao.disabled = true;
    }
}

function inicializarBuscaMensagens() {
    const buscaInput = document.getElementById('mensagens-busca-input');
    if (!buscaInput || buscaInput.hasListener) return;
    
    buscaInput.addEventListener('input', function(e) {
        const termo = e.target.value.toLowerCase();
        const items = document.querySelectorAll('#mensagens-lista .mensagem-item');
        items.forEach(item => {
            const nome = item.getAttribute('data-nome')?.toLowerCase() || '';
            item.style.display = nome.includes(termo) ? 'flex' : 'none';
        });
    });
    buscaInput.hasListener = true;
}

function inicializarCliquesMensagens() {
    const items = document.querySelectorAll('#mensagens-lista .mensagem-item');
    items.forEach(item => {
        if (item.hasClickListener) return;
        item.addEventListener('click', function() {
            alert(`Conversa com ${this.getAttribute('data-nome')}`);
        });
        item.hasClickListener = true;
    });
}

window.abrirCadastroProduto = function() {
    mudarTela('tela-14');
};

window.fecharCadastroProduto = function() {
    mudarTela('tela-11');
};

// INICIALIZAÇÃO
window.addEventListener('DOMContentLoaded', function() {
    mudarTela('tela-1');
    
    // Busca no cardápio da empresa
    const buscaEmpresa = document.getElementById('cardapio-busca');
    if (buscaEmpresa) {
        buscaEmpresa.addEventListener('input', (e) => filtrarProdutosEmpresa(e.target.value));
    }
    
    // Busca no cardápio do cliente
    const buscaCliente = document.getElementById('cardapio-cliente-busca');
    if (buscaCliente) {
        buscaCliente.addEventListener('input', (e) => filtrarProdutosCliente(e.target.value));
    }
});

document.addEventListener('visibilitychange', function() {
    if (document.hidden && isRecording) pararGravacao();
});

document.addEventListener('submit', function(e) {
    e.preventDefault();
});
