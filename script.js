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
    
    if (idTela === 'tela-14') {
        setTimeout(inicializarCadastroProduto, 100);
    }
}

// ==========================================
// FUNCIONALIDADES DO CADASTRO DE PRODUTO
// ==========================================

let currentImageData = null;
let currentFile = null;

function inicializarCadastroProduto() {
    // Elementos DOM
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
    
    // Remove listeners antigos para evitar duplicação
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
    
    // Função para mostrar preview
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
    
    // Função para resetar foto
    function resetPhoto() {
        currentImageData = null;
        currentFile = null;
        if (finalFileInput) finalFileInput.value = '';
        if (finalPreviewImg) finalPreviewImg.src = '#';
        if (finalPreviewContainer) finalPreviewContainer.style.display = 'none';
        if (finalUploadArea) finalUploadArea.style.display = 'flex';
    }
    
    // Evento de clique na área de upload
    if (finalUploadArea) {
        finalUploadArea.addEventListener('click', () => {
            if (finalFileInput) finalFileInput.click();
        });
    }
    
    // Evento de seleção de arquivo
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
    
    // Evento de remover foto
    if (finalRemovePhotoBtn) {
        finalRemovePhotoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            resetPhoto();
        });
    }
    
    // Máscara de preço
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
    
    // Reset inicial
    resetPhoto();
    if (finalPriceInput) finalPriceInput.placeholder = "0,00";
}

// Função para salvar o produto
window.salvarProduto = function() {
    const productName = document.getElementById('productName');
    const categorySelect = document.getElementById('productCategory');
    const priceInput = document.getElementById('productPrice');
    const descriptionTextarea = document.getElementById('productDescription');
    
    const nome = productName ? productName.value.trim() : '';
    const categoria = categorySelect ? categorySelect.value : '';
    const precoRaw = priceInput ? priceInput.value.trim() : '';
    const descricao = descriptionTextarea ? descriptionTextarea.value.trim() : '';
    
    // Validações
    if (nome === '') {
        showToast('⚠️ Informe o nome do produto', true);
        if (productName) productName.focus();
        return;
    }
    
    if (!categoria || categoria === '') {
        showToast('📂 Selecione uma categoria', true);
        if (categorySelect) categorySelect.focus();
        return;
    }
    
    if (precoRaw === '') {
        showToast('💰 Defina um preço válido (ex: 15,90)', true);
        if (priceInput) priceInput.focus();
        return;
    }
    
    let numericStr = precoRaw.replace(/\./g, '').replace(',', '.');
    let precoNumerico = parseFloat(numericStr);
    if (isNaN(precoNumerico) || precoNumerico < 0) {
        showToast('Preço inválido, utilize formato 0,00', true);
        if (priceInput) priceInput.focus();
        return;
    }
    
    if (descricao === '') {
        showToast('✏️ Adicione uma descrição do produto', true);
        if (descriptionTextarea) descriptionTextarea.focus();
        return;
    }
    
    // Criar objeto do produto
    const novoProduto = {
        id: Date.now(),
        nome: nome,
        categoria: categoria,
        preco: precoNumerico,
        precoFormatado: `R$ ${precoNumerico.toFixed(2).replace('.', ',')}`,
        descricao: descricao,
        disponivel: true,
        temFoto: !!currentImageData,
        fotoBase64: currentImageData || null,
        dataCadastro: new Date().toISOString()
    };
    
    // Salvar no localStorage
    let produtos = JSON.parse(localStorage.getItem('produtosCardapio') || '[]');
    produtos.push(novoProduto);
    localStorage.setItem('produtosCardapio', JSON.stringify(produtos));
    
    // Adicionar ao cardápio visualmente
    adicionarProdutoAoCardapio(novoProduto);
    
    console.log('📦 Produto cadastrado:', novoProduto);
    showToast(`✅ "${nome}" salvo com sucesso!`, false);
    
    // Limpar formulário
    if (productName) productName.value = '';
    if (categorySelect) categorySelect.value = '';
    if (priceInput) priceInput.value = '';
    if (descriptionTextarea) descriptionTextarea.value = '';
    
    // Resetar foto
    const uploadArea = document.getElementById('uploadArea');
    const previewContainer = document.getElementById('photoPreviewContainer');
    const fileInput = document.getElementById('productPhotoInput');
    const previewImg = document.getElementById('previewImg');
    
    currentImageData = null;
    currentFile = null;
    if (fileInput) fileInput.value = '';
    if (previewImg) previewImg.src = '#';
    if (previewContainer) previewContainer.style.display = 'none';
    if (uploadArea) uploadArea.style.display = 'flex';
    
    // Voltar para o cardápio após 1.5 segundos
    setTimeout(() => {
        mudarTela('tela-11');
        setTimeout(() => {
            location.reload();
        }, 100);
    }, 1500);
};

// Função para adicionar produto ao cardápio visualmente
function adicionarProdutoAoCardapio(produto) {
    const cardapioContent = document.getElementById('cardapio-content');
    if (!cardapioContent) return;
    
    // Verificar se já existe a categoria
    let categoriaExists = false;
    const categorias = cardapioContent.querySelectorAll('h3');
    categorias.forEach(cat => {
        if (cat.textContent === produto.categoria) {
            categoriaExists = true;
        }
    });
    
    // Se a categoria não existe, criar nova seção
    if (!categoriaExists && produto.categoria !== '') {
        const newCategoryHeader = document.createElement('h3');
        newCategoryHeader.textContent = produto.categoria;
        cardapioContent.appendChild(newCategoryHeader);
    }
    
    // Encontrar onde inserir (após o header da categoria)
    let targetSection = null;
    const headers = cardapioContent.querySelectorAll('h3');
    for (let i = 0; i < headers.length; i++) {
        if (headers[i].textContent === produto.categoria) {
            targetSection = headers[i];
            break;
        }
    }
    
    // Criar o item do produto
    const newItem = document.createElement('div');
    newItem.className = 'cardapio-item';
    newItem.setAttribute('data-id', produto.id);
    newItem.innerHTML = `
        <div>
            <h4>${produto.nome}</h4>
            <p>${produto.descricao}</p>
            <span class="cardapio-price">${produto.precoFormatado}</span>
        </div>
        <label class="cardapio-switch">
            <input type="checkbox" checked>
            <span class="slider"></span>
        </label>
    `;
    
    // Inserir após o header da categoria
    if (targetSection && targetSection.nextSibling) {
        if (targetSection.nextSibling.classList && targetSection.nextSibling.classList.contains('cardapio-item')) {
            // Inserir antes do próximo item
            cardapioContent.insertBefore(newItem, targetSection.nextSibling);
        } else {
            cardapioContent.insertBefore(newItem, targetSection.nextSibling);
        }
    } else if (targetSection) {
        cardapioContent.appendChild(newItem);
    } else {
        cardapioContent.appendChild(newItem);
    }
}

// Função para mostrar toast
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

// FUNCIONALIDADE DO CHAT
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

// SWITCH DA LOJA
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

// ACEITAR PEDIDO
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

// BUSCA CARDÁPIO
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
    
    // Carregar produtos salvos do localStorage
    carregarProdutosSalvos();
}

function carregarProdutosSalvos() {
    const produtos = JSON.parse(localStorage.getItem('produtosCardapio') || '[]');
    produtos.forEach(produto => {
        adicionarProdutoAoCardapio(produto);
    });
}

// BUSCA MENSAGENS
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

// TOGGLE VISIBILIDADE DE SENHA
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

// Função para abrir o cadastro de produto
window.abrirCadastroProduto = function() {
    mudarTela('tela-14');
};

// INICIALIZAÇÃO
window.addEventListener('DOMContentLoaded', function() {
    mudarTela('tela-1');
    
    const buscaPesquisa = document.querySelector('#tela-6 .pesquisa-busca input');
    if (buscaPesquisa) {
        buscaPesquisa.addEventListener('input', function(e) {
            console.log('Pesquisando:', this.value);
        });
    }
});

document.addEventListener('visibilitychange', function() {
    if (document.hidden && isRecording) pararGravacao();
});

document.addEventListener('submit', function(e) {
    e.preventDefault();
});
