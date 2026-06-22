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

// ==========================================
// FUNÇÕES DO PEDIDO (NOVAS)
// ==========================================

// PASSO 2: Função adicionar ao carrinho (substituída)
window.adicionarAoCarrinho = async function(nome, preco, empresaId) {
    const user = auth.currentUser;

    if (!user) {
        alert("Faça login.");
        return;
    }

    try {
        await addDoc(collection(db, "pedidos"), {
            clienteId: user.uid,
            clienteNome: user.displayName || "Usuário",
            clienteEmail: user.email || "",
            produto: nome,
            preco: preco,
            empresaId: empresaId,
            status: "pendente",
            criadoEm: new Date()
        });

        alert("Pedido enviado!");
        mudarTela("tela-7");
        
        // Aguarda a tela carregar e depois carrega os pedidos
        setTimeout(carregarPedidosCliente, 200);
    } catch (erro) {
        console.error(erro);
        alert("Erro ao enviar pedido: " + erro.message);
    }
};

// PASSO 4: Função carregar pedidos do cliente
window.carregarPedidosCliente = async function() {
    const area = document.querySelector(".pedidos-conteudo");
    if (!area) {
        console.warn("Elemento .pedidos-conteudo não encontrado");
        return;
    }

    area.innerHTML = '<p style="text-align:center; padding:20px;">Carregando pedidos...</p>';

    const user = auth.currentUser;
    if (!user) {
        area.innerHTML = '<p style="text-align:center; padding:20px;">Faça login para ver seus pedidos</p>';
        return;
    }

    try {
        const q = query(
            collection(db, "pedidos"),
            where("clienteId", "==", user.uid)
        );

        const pedidos = await getDocs(q);

        if (pedidos.empty) {
            area.innerHTML = '<p style="text-align:center; padding:20px;">Nenhum pedido encontrado</p>';
            return;
        }

        area.innerHTML = "";

        pedidos.forEach((doc) => {
            const pedido = doc.data();
            const dataCriacao = pedido.criadoEm ? new Date(pedido.criadoEm.seconds * 1000) : new Date();
            const dataFormatada = dataCriacao.toLocaleDateString('pt-BR') + ' ' + dataCriacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            area.innerHTML += `
                <div class="pedido-card">
                    <div class="pedido-imagem" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuB9qmCO1wwCO4N0iVnQWSPyVBHgwgZEXoQCF_0SPnDK-u1tits_-bmrj5XJY6rJBISIp4V6VNhhqkgO0-FKRGGt9kHBayxaeJKs4chrxUo4PBM0kFbVU-VKldj_2uv0PFReISHO7Yc-Tikbzi2Oyt-BZRqI8h5r3cJlEJACPTXLJnI6eR-MExNYdgnCWuRGTQX3MFh_mkViSIxRd5PCW5jTmMRrjOQk7b-PLyDk2tNQT37tXo3wroQ2JmEOZiU1c_chvrkP9c6AQVo')"></div>
                    <div class="pedido-info">
                        <div class="pedido-titulo">
                            <h3>${pedido.produto}</h3>
                            <span class="pedido-status status-${pedido.status || 'pendente'}">
                                ${pedido.status || 'Pendente'}
                            </span>
                        </div>
                        <p class="pedido-data">${dataFormatada}</p>
                        <p class="pedido-descricao"><strong>Cliente:</strong> ${pedido.clienteNome}</p>
                        <p class="pedido-descricao"><strong>Total:</strong> ${pedido.preco}</p>
                    </div>
                    <button onclick="mudarTela('tela-8')" class="btn-chat">
                        <span class="material-symbols-outlined">chat</span>
                        <span>Chat com Entregador</span>
                    </button>
                </div>
            `;
        });
    } catch (erro) {
        console.error(erro);
        area.innerHTML = '<p style="text-align:center; padding:20px;">Erro ao carregar pedidos</p>';
    }
};

// PASSO 7: Função escutar pedidos da empresa em tempo real
window.escutarPedidosEmpresa = function() {
    const user = auth.currentUser;
    if (!user) {
        console.warn("Usuário não logado");
        return;
    }

    const area = document.querySelector(".loja-pedidos");
    if (!area) {
        console.warn("Elemento .loja-pedidos não encontrado");
        return;
    }

    const q = query(
        collection(db, "pedidos"),
        where("empresaId", "==", user.uid)
    );

    // Usa onSnapshot para escutar mudanças em tempo real
    onSnapshot(q, (snapshot) => {
        area.innerHTML = "";

        if (snapshot.empty) {
            area.innerHTML = '<p style="text-align:center; padding:20px; color: #666;">Nenhum pedido recebido ainda</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const pedido = doc.data();
            const pedidoId = doc.id;
            
            area.innerHTML += `
                <div class="loja-pedido" data-pedido-id="${pedidoId}">
                    <div class="pedido-top">
                        <strong>${pedido.clienteNome || "Cliente"}</strong>
                        <strong>${pedido.preco || "R$ 0,00"}</strong>
                    </div>
                    <small>${pedido.produto || "Produto"}</small>
                    <div class="pedido-list">
                        ${pedido.produto || "Sem descrição"}
                    </div>
                    <button class="btn-aceitar" onclick="aceitarPedidoEmpresa('${pedidoId}')">
                        Aceitar
                    </button>
                </div>
            `;
        });

        // Atualiza contadores
        const pendentesCard = document.querySelector('.loja-card:first-child h2');
        if (pendentesCard) {
            pendentesCard.textContent = snapshot.size;
        }

        const preparoCard = document.querySelector('.loja-card:last-child h2');
        if (preparoCard) {
            // Aqui você pode contar pedidos em preparo se tiver esse status
            // Por enquanto mantém o número atual
        }
    }, (erro) => {
        console.error("Erro ao escutar pedidos:", erro);
        area.innerHTML = '<p style="text-align:center; padding:20px; color: #dc2626;">Erro ao carregar pedidos em tempo real</p>';
    });
};

// Função para aceitar pedido na empresa
window.aceitarPedidoEmpresa = async function(pedidoId) {
    try {
        // Aqui você pode atualizar o status do pedido no Firestore
        // Por enquanto, vamos apenas mudar visualmente
        const botao = document.querySelector(`[data-pedido-id="${pedidoId}"] .btn-aceitar`);
        if (botao) {
            botao.textContent = '✅ Aceito!';
            botao.style.background = '#10b981';
            botao.disabled = true;
        }
        
        // Atualiza contadores
        const pendentesCard = document.querySelector('.loja-card:first-child h2');
        if (pendentesCard) {
            let pendentes = parseInt(pendentesCard.textContent);
            if (!isNaN(pendentes) && pendentes > 0) {
                pendentesCard.textContent = pendentes - 1;
            }
        }
        
        const preparoCard = document.querySelector('.loja-card:last-child h2');
        if (preparoCard) {
            let preparo = parseInt(preparoCard.textContent);
            if (!isNaN(preparo)) {
                preparoCard.textContent = preparo + 1;
            }
        }
        
        // Opcional: atualizar status no Firestore
        // await updateDoc(doc(db, "pedidos", pedidoId), {
        //     status: "preparando"
        // });
        
    } catch (erro) {
        console.error("Erro ao aceitar pedido:", erro);
        alert("Erro ao aceitar pedido: " + erro.message);
    }
};

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

// INICIALIZAÇÃO
window.addEventListener('DOMContentLoaded', function() {
    mudarTela('tela-1');
    
    const buscaPesquisa = document.querySelector('#tela-6 .pesquisa-busca input');
    if (buscaPesquisa) {
        buscaPesquisa.addEventListener('input', function(e) {
            console.log('Pesquisando:', this.value);
        });
    }
    
    // Verifica se o usuário já está logado
    const tipoSalvo = localStorage.getItem('tipoUsuario');
    const nomeSalvo = localStorage.getItem('nomeUsuario');
    const emailSalvo = localStorage.getItem('emailUsuario');
    
    if (tipoSalvo && nomeSalvo) {
        // Se já estiver logado, vai direto para a tela correspondente
        // Mas só se o Firebase já estiver inicializado
        const user = auth.currentUser;
        if (user) {
            if (tipoSalvo === 'cliente') {
                mudarTela('tela-5');
            } else if (tipoSalvo === 'empresa') {
                mudarTela('tela-10');
                // PASSO 8: Inicia escuta de pedidos após login da empresa
                setTimeout(escutarPedidosEmpresa, 500);
            }
        }
    }
});

document.addEventListener('visibilitychange', function() {
    if (document.hidden && isRecording) pararGravacao();
});

document.addEventListener('submit', function(e) {
    e.preventDefault();
});
