// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================
let conversaAtual = null;
let unsubscribeChat = null;
let chatTipo = null;
let isRecording = false;
let mediaRecorder = null;
let audioStream = null;
let audioChunks = [];
let currentImageData = null;
let currentFile = null;

// ==========================================
// SISTEMA DE NAVEGAÇÃO ENTRE TELAS
// ==========================================
function mudarTela(idTela) {
    document.querySelectorAll('.tela').forEach(tela => {
        tela.classList.remove('ativa');
    });
    
    document.getElementById(idTela).classList.add('ativa');
    window.scrollTo(0, 0);
}

// ==========================================
// FUNÇÃO SERVER TIMESTAMP (FALLBACK)
// ==========================================
function serverTimestamp() {
    return new Date();
}

// ==========================================
// FUNÇÕES DE CHAT
// ==========================================
async function abrirChatPedido(pedidoId) {
    const user = auth.currentUser;
    if (!user) {
        alert('Você precisa estar logado para usar o chat.');
        return;
    }

    try {
        const conversasRef = collection(db, "conversas");
        const q = query(conversasRef, where("pedidoId", "==", pedidoId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            conversaAtual = doc.id;
            chatTipo = localStorage.getItem('tipoUsuario') || 'cliente';
            
            const dados = doc.data();
            const nomeContato = chatTipo === 'cliente' ? dados.lojaNome : dados.clienteNome;
            document.getElementById('chatContatoNome').textContent = nomeContato || 'Contato';
            
            mudarTela('tela-8');
            await carregarMensagens(conversaAtual);
        } else {
            const tipoUsuario = localStorage.getItem('tipoUsuario') || 'cliente';
            const nomeUsuario = localStorage.getItem('nomeUsuario') || 'Usuário';
            
            const novaConversa = {
                pedidoId: pedidoId,
                criadoEm: serverTimestamp()
            };

            if (tipoUsuario === 'cliente') {
                novaConversa.clienteId = user.uid;
                novaConversa.clienteNome = nomeUsuario;
                novaConversa.lojaId = 'loja_demo_id';
                novaConversa.lojaNome = 'Burger King';
            } else {
                novaConversa.lojaId = user.uid;
                novaConversa.lojaNome = nomeUsuario;
                novaConversa.clienteId = 'cliente_demo_id';
                novaConversa.clienteNome = 'Maria Silva';
            }

            const docRef = await addDoc(collection(db, "conversas"), novaConversa);
            conversaAtual = docRef.id;
            chatTipo = tipoUsuario;
            
            const nomeContato = chatTipo === 'cliente' ? novaConversa.lojaNome : novaConversa.clienteNome;
            document.getElementById('chatContatoNome').textContent = nomeContato || 'Contato';
            
            mudarTela('tela-8');
            
            await addDoc(collection(db, "conversas", conversaAtual, "mensagens"), {
                texto: `🛵 Conversa iniciada para o pedido #${pedidoId.substring(0, 8)}`,
                usuarioId: 'sistema',
                tipo: 'sistema',
                timestamp: serverTimestamp()
            });
            
            await carregarMensagens(conversaAtual);
        }
    } catch (error) {
        console.error('Erro ao abrir chat:', error);
        alert('Erro ao abrir conversa.');
    }
}

async function carregarMensagens(conversaId) {
    if (unsubscribeChat) {
        unsubscribeChat();
        unsubscribeChat = null;
    }

    const chatMessages = document.getElementById('chat-mensagens');
    if (!chatMessages) return;

    chatMessages.innerHTML = '<div class="chat-data">Carregando mensagens...</div>';

    try {
        const mensagensRef = collection(db, "conversas", conversaId, "mensagens");
        const q = query(mensagensRef, orderBy("timestamp", "asc"));

        unsubscribeChat = onSnapshot(q, (snapshot) => {
            chatMessages.innerHTML = '';
            
            if (snapshot.empty) {
                chatMessages.innerHTML = '<div class="chat-data">Nenhuma mensagem ainda. Envie uma mensagem!</div>';
                return;
            }

            let lastDate = '';
            const user = auth.currentUser;

            snapshot.forEach((doc) => {
                const msg = doc.data();
                const data = msg.timestamp?.toDate?.() || new Date();
                const dataStr = data.toLocaleDateString('pt-BR');
                
                if (dataStr !== lastDate) {
                    const dataDiv = document.createElement('div');
                    dataDiv.className = 'chat-data';
                    dataDiv.textContent = dataStr;
                    chatMessages.appendChild(dataDiv);
                    lastDate = dataStr;
                }

                if (msg.tipo === 'sistema') {
                    const systemDiv = document.createElement('div');
                    systemDiv.className = 'mensagem-sistema';
                    systemDiv.textContent = msg.texto;
                    chatMessages.appendChild(systemDiv);
                    return;
                }

                const isEnviada = msg.usuarioId === user?.uid;
                const mensagemDiv = document.createElement('div');
                mensagemDiv.className = `mensagem ${isEnviada ? 'mensagem-enviada' : 'mensagem-recebida'}`;

                const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                if (!isEnviada) {
                    mensagemDiv.innerHTML = `
                        <div class="mensagem-foto" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCo2WOsnviTirPXViHLuIQx6Fc7P9RB04Mt2QW0Ne2r2uObuBI99pgO9Rwy0EMxZSQ8A90BNE-k-TPjnd6so7pDr1NlkwLqUCCBP0u8h704f5m159sd2XuCmX3Od-M3z99hL3voS5JZNWz7kNUFU6W9gmirlsY_s-eciw9XgtG1opIMFE6hWXIHKonrviDD-aYh6TLvnPlwTgJHKUCHDen1hK_Eut_AKTjhjZGNVC13TpeVDgBM0lV_YLF_WUdfQKipbGdIrG9T52c')"></div>
                        <div class="mensagem-conteudo">
                            <div class="mensagem-balao">
                                <p>${msg.texto}</p>
                            </div>
                            <span class="mensagem-hora">${hora}</span>
                        </div>
                    `;
                } else {
                    mensagemDiv.innerHTML = `
                        <div class="mensagem-conteudo">
                            <div class="mensagem-balao mensagem-balao-enviada">
                                <p>${msg.texto}</p>
                            </div>
                            <div class="mensagem-status">
                                <span class="mensagem-hora">${hora}</span>
                                <span class="material-symbols-outlined">done_all</span>
                            </div>
                        </div>
                    `;
                }

                chatMessages.appendChild(mensagemDiv);
            });

            chatMessages.scrollTop = chatMessages.scrollHeight;
        });

    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
        chatMessages.innerHTML = '<div class="chat-data">Erro ao carregar mensagens</div>';
    }
}

async function enviarMensagemFirestore(texto) {
    if (!conversaAtual) {
        alert('Nenhuma conversa ativa.');
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        alert('Você precisa estar logado.');
        return;
    }

    if (!texto || texto.trim() === '') return;

    try {
        const tipoUsuario = localStorage.getItem('tipoUsuario') || 'cliente';
        await addDoc(collection(db, "conversas", conversaAtual, "mensagens"), {
            texto: texto.trim(),
            usuarioId: user.uid,
            tipo: tipoUsuario,
            timestamp: serverTimestamp()
        });

        const chatInput = document.getElementById('chat-input');
        if (chatInput) chatInput.value = '';

    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        alert('Erro ao enviar mensagem.');
    }
}

function fecharChat() {
    if (unsubscribeChat) {
        unsubscribeChat();
        unsubscribeChat = null;
    }
    conversaAtual = null;
    
    const tipoUsuario = localStorage.getItem('tipoUsuario');
    if (tipoUsuario === 'empresa') {
        mudarTela('tela-12');
    } else {
        mudarTela('tela-7');
    }
}

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
    const finalChatInput = document.getElementById('chat-input');
    
    if (finalChatInput) {
        finalChatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim()) {
                enviarMensagemFirestore(this.value);
            }
        });
    }
    
    if (finalSendBtn) {
        finalSendBtn.addEventListener('click', function() {
            const input = document.getElementById('chat-input');
            if (input && input.value.trim()) {
                enviarMensagemFirestore(input.value);
            }
        });
    }
    
    if (finalRecordBtn) {
        finalRecordBtn.addEventListener('click', function() {
            if (!isRecording) {
                iniciarGravacao();
            } else {
                pararGravacao();
            }
        });
    }
}

// ==========================================
// GRAVAÇÃO DE ÁUDIO
// ==========================================
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
        alert('Não foi possível acessar o microfone. Verifique as permissões.');
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
// FUNÇÃO PARA CARREGAR CONVERSAS DA LOJA
// ==========================================
async function carregarConversasLoja() {
    const lista = document.getElementById('mensagens-lista');
    if (!lista) return;

    const user = auth.currentUser;
    if (!user) {
        lista.innerHTML = '<p style="text-align:center; padding:20px; color: #666;">Faça login para ver suas conversas</p>';
        return;
    }

    try {
        const tipoUsuario = localStorage.getItem('tipoUsuario');
        let q;

        if (tipoUsuario === 'empresa') {
            q = query(
                collection(db, "conversas"),
                where("lojaId", "==", user.uid),
                orderBy("criadoEm", "desc")
            );
        } else {
            q = query(
                collection(db, "conversas"),
                where("clienteId", "==", user.uid),
                orderBy("criadoEm", "desc")
            );
        }

        const querySnapshot = await getDocs(q);
        lista.innerHTML = '';

        if (querySnapshot.empty) {
            lista.innerHTML = '<p style="text-align:center; padding:20px; color: #666;">Nenhuma conversa ainda</p>';
            return;
        }

        for (const doc of querySnapshot.docs) {
            const conversa = doc.data();
            const conversaId = doc.id;
            
            const mensagensRef = collection(db, "conversas", conversaId, "mensagens");
            const msgQuery = query(mensagensRef, orderBy("timestamp", "desc"), limit(1));
            const msgSnapshot = await getDocs(msgQuery);
            
            let ultimaMensagem = 'Nenhuma mensagem';
            let ultimaData = '';
            
            if (!msgSnapshot.empty) {
                const ultima = msgSnapshot.docs[0].data();
                ultimaMensagem = ultima.texto || 'Mensagem';
                if (ultima.timestamp) {
                    const data = ultima.timestamp.toDate();
                    ultimaData = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }
            }

            let nomeContato = '';
            if (tipoUsuario === 'empresa') {
                nomeContato = conversa.clienteNome || 'Cliente';
            } else {
                nomeContato = conversa.lojaNome || 'Loja';
            }

            const itemDiv = document.createElement('div');
            itemDiv.className = 'mensagem-item';
            itemDiv.setAttribute('data-conversa-id', conversaId);
            itemDiv.setAttribute('data-nome', nomeContato);
            itemDiv.setAttribute('data-id', conversa.pedidoId || '');
            
            const iniciais = nomeContato.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const cores = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#a18cd1', '#fbc2eb'];
            const cor = cores[Math.floor(Math.random() * cores.length)];
            
            itemDiv.innerHTML = `
                <div class="avatar" style="background: ${cor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; width: 50px; height: 50px; border-radius: 50%; flex-shrink: 0;">${iniciais}</div>
                <div class="mensagem-info">
                    <div class="mensagem-topo">
                        <h3>${nomeContato}</h3>
                        <span class="badge" style="display: none;">0</span>
                    </div>
                    <div class="mensagem-id">Pedido #${conversa.pedidoId?.substring(0, 8) || 'N/A'}</div>
                    <div class="mensagem-preview">${ultimaMensagem} ${ultimaData ? '• ' + ultimaData : ''}</div>
                </div>
            `;

            itemDiv.addEventListener('click', function() {
                const conversaId = this.getAttribute('data-conversa-id');
                const nome = this.getAttribute('data-nome');
                abrirConversaEspecifica(conversaId, nome);
            });

            lista.appendChild(itemDiv);
        }

    } catch (error) {
        console.error('Erro ao carregar conversas:', error);
        lista.innerHTML = '<p style="text-align:center; padding:20px; color: #666;">Erro ao carregar conversas</p>';
    }
}

async function abrirConversaEspecifica(conversaId, nomeContato) {
    conversaAtual = conversaId;
    chatTipo = localStorage.getItem('tipoUsuario') || 'cliente';
    
    const nomeElement = document.getElementById('chatContatoNome');
    if (nomeElement) nomeElement.textContent = nomeContato;
    
    mudarTela('tela-8');
    await carregarMensagens(conversaId);
}

// ==========================================
// FUNÇÕES DE BUSCA
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

function inicializarAjustes() {
    console.log('Tela de Ajustes carregada');
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

// ==========================================
// EVENT LISTENERS GLOBAIS
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

document.addEventListener('visibilitychange', function() {
    if (document.hidden && isRecording) pararGravacao();
});

document.addEventListener('submit', function(e) {
    e.preventDefault();
});
