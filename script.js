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
        setTimeout(() => {
            inicializarSwitchLoja();
            if (typeof carregarPedidosEmpresa === 'function') carregarPedidosEmpresa();
            if (typeof observarStatusLoja === 'function') observarStatusLoja();
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
            if (typeof carregarConversasEmpresa === 'function') carregarConversasEmpresa();
        }, 100);
    }

    if (idTela === 'tela-13') {
        setTimeout(() => {
            inicializarAjustes();
            if (typeof carregarAjustesEmpresa === 'function') carregarAjustesEmpresa();
        }, 100);
    }

    if (idTela === 'tela-14') {
        setTimeout(inicializarCadastroProduto, 100);
    }

    if (idTela === 'tela-7') {
        setTimeout(() => {
            if (typeof carregarPedidosCliente === 'function') carregarPedidosCliente();
        }, 100);
    }

    if (idTela === 'tela-6') {
        setTimeout(() => {
            if (typeof inicializarPesquisa === 'function') inicializarPesquisa();
        }, 100);
    }

    // Carrega perfil do cliente ao abrir tela-9
    if (idTela === 'tela-9') {
        setTimeout(() => {
            if (typeof carregarPerfilCliente === 'function') carregarPerfilCliente();
        }, 100);
    }

    // Finalizar pedido: resumo da sacola + endereço
    if (idTela === 'tela-18') {
        setTimeout(() => {
            if (typeof renderizarResumoCarrinho === 'function') renderizarResumoCarrinho();
            if (typeof preencherCheckout === 'function') preencherCheckout();
        }, 100);
    }

    // Forma de pagamento: atualiza o total
    if (idTela === 'tela-19') {
        setTimeout(() => {
            if (typeof prepararPagamento === 'function') prepararPagamento();
        }, 50);
    }
}

// ==========================================
// FUNCIONALIDADES DO CADASTRO DE PRODUTO
// ==========================================

let currentImageData = null;
let currentFile = null;

// Limite de segurança para a imagem em base64 (documentos do Firestore
// têm um teto de ~1MB; deixamos margem para o resto dos campos do produto)
const LIMITE_IMAGEM_BASE64 = 700000; // ~700KB em base64

function inicializarCadastroProduto() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('productPhotoInput');
    const previewContainer = document.getElementById('photoPreviewContainer');
    const previewImg = document.getElementById('previewImg');
    const previewFileNameSpan = document.getElementById('previewFileName');
    const removePhotoBtn = document.getElementById('removePhotoBtn');

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

    // Redimensiona/comprime a imagem no canvas antes de virar base64,
    // pra não estourar o limite do documento no Firestore.
    function comprimirImagem(file, callback) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const MAX_LADO = 800;
                let largura = img.width;
                let altura = img.height;
                if (largura > altura && largura > MAX_LADO) {
                    altura = Math.round(altura * (MAX_LADO / largura));
                    largura = MAX_LADO;
                } else if (altura > MAX_LADO) {
                    largura = Math.round(largura * (MAX_LADO / altura));
                    altura = MAX_LADO;
                }
                const canvas = document.createElement('canvas');
                canvas.width = largura;
                canvas.height = altura;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, largura, altura);

                let qualidade = 0.8;
                let dataUrl = canvas.toDataURL('image/jpeg', qualidade);
                // Reduz a qualidade até caber no limite ou até um mínimo razoável
                while (dataUrl.length > LIMITE_IMAGEM_BASE64 && qualidade > 0.3) {
                    qualidade -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', qualidade);
                }
                callback(dataUrl);
            };
            img.onerror = function() {
                if (typeof showToast === 'function') showToast('Não foi possível ler essa imagem.', true);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function showPreview(file) {
        if (!file) return;
        comprimirImagem(file, function(dataUrl) {
            if (dataUrl.length > LIMITE_IMAGEM_BASE64) {
                if (typeof showToast === 'function') showToast('Imagem muito grande mesmo após compressão. Escolha outra foto.', true);
                return;
            }
            currentImageData = dataUrl;
            if (finalPreviewImg) finalPreviewImg.src = currentImageData;
            if (finalPreviewFileNameSpan) {
                finalPreviewFileNameSpan.innerText = file.name.length > 28 ? file.name.substring(0, 25) + '...' : file.name;
            }
            if (finalUploadArea) finalUploadArea.style.display = 'none';
            if (finalPreviewContainer) finalPreviewContainer.style.display = 'flex';
        });
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
    // Exposto para permitir reset externo (ex: ao entrar em modo edição)
    window._resetFotoProduto = resetPhoto;
    window._setImagemProdutoAtual = function(dataUrl) {
        currentImageData = dataUrl || null;
        if (dataUrl) {
            if (finalPreviewImg) finalPreviewImg.src = dataUrl;
            if (finalPreviewFileNameSpan) finalPreviewFileNameSpan.innerText = 'imagem atual';
            if (finalUploadArea) finalUploadArea.style.display = 'none';
            if (finalPreviewContainer) finalPreviewContainer.style.display = 'flex';
        }
    };

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

    // Só reseta o formulário se não estivermos entrando em modo de edição
    // (o firebase controla isso via window._modoEdicaoProduto)
    if (!window._modoEdicaoProduto) {
        resetPhoto();
    }
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
window.showToast = showToast;

// ==========================================
// CHAT (interface / UI)
// ==========================================
// A função window.enviarMensagem() que realmente grava a mensagem no
// Firestore e o listener em tempo real (escutarMensagens) ficam
// definidos no módulo Firebase do index.html. Aqui cuidamos só dos
// elementos de interface (input, botão de enviar e gravação de áudio).

let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let audioStream;

function inicializarChat() {
    const chatInput = document.getElementById('chat-input');
    const recordBtn = document.getElementById('record-btn');
    const sendBtn = document.getElementById('send-btn');

    if (!chatInput || !recordBtn || !sendBtn) return;

    // Evita duplicar listeners toda vez que a tela de chat é reaberta
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);

    const newRecordBtn = recordBtn.cloneNode(true);
    recordBtn.parentNode.replaceChild(newRecordBtn, recordBtn);

    const finalSendBtn = document.getElementById('send-btn');
    const finalRecordBtn = document.getElementById('record-btn');

    finalSendBtn.addEventListener('click', function() {
        const input = document.getElementById('chat-input');
        if (input && input.value.trim() && typeof window.enviarMensagem === 'function') {
            window.enviarMensagem(input.value);
            input.value = '';
        }
    });

    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim() && typeof window.enviarMensagem === 'function') {
                window.enviarMensagem(this.value);
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

async function iniciarGravacao() {
    try {
        const recordBtn = document.getElementById('record-btn');
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(audioStream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => { audioChunks.push(event.data); };
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            if (typeof window.enviarAudioMensagem === 'function') {
                window.enviarAudioMensagem(audioBlob);
            } else {
                exibirAudioGravadoLocal(audioBlob);
            }
            audioStream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        isRecording = true;
        recordBtn.classList.add('gravando');
        recordBtn.innerHTML = '<span class="material-symbols-outlined">stop</span>';
    } catch (error) {
        console.error('Erro ao acessar microfone:', error);
        showToast('Não foi possível acessar o microfone. Verifique as permissões.', true);
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

// Fallback local, usado apenas se o envio real (Storage) não estiver
// disponível — o áudio fica só na tela de quem gravou.
function exibirAudioGravadoLocal(audioBlob) {
    const chatMessages = document.getElementById('chat-mensagens');
    if (!chatMessages) return;
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const audioDiv = document.createElement('div');
    audioDiv.className = 'mensagem mensagem-enviada';
    audioDiv.innerHTML = `
        <div class="mensagem-conteudo">
            <div class="mensagem-balao mensagem-balao-enviada">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="material-symbols-outlined" style="font-size: 16px;">mic</span>
                    <span>Áudio (não sincronizado)</span>
                    <span class="material-symbols-outlined audio-play" style="font-size: 16px; margin-left: auto; cursor: pointer;">play_arrow</span>
                </div>
            </div>
            <div class="mensagem-status">
                <span class="mensagem-hora">${horaAtual}</span>
                <span class="material-symbols-outlined">schedule</span>
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

// SWITCH DA LOJA — a mudança visual imediata acontece aqui; quem
// realmente decide o estado (e salva no Firestore) é o
// toggleStatusLoja() do módulo Firebase.
let switchInicializado = false;

function inicializarSwitchLoja() {
    if (switchInicializado) return;
    const switchBtn = document.getElementById("switch");

    if (switchBtn && !switchBtn.hasListener) {
        switchBtn.onclick = () => {
            if (typeof window.toggleStatusLoja === 'function') {
                window.toggleStatusLoja();
            }
        };
        switchBtn.hasListener = true;
        switchInicializado = true;
    }
}

// Usado pelo módulo Firebase para refletir o estado real (vindo do
// Firestore) no switch, mantendo vários dispositivos sincronizados.
function aplicarEstadoLoja(aberta) {
    const switchBtn = document.getElementById("switch");
    const statusText = document.getElementById("status-text");
    if (switchBtn) switchBtn.classList.toggle("off", !aberta);
    if (statusText) statusText.textContent = aberta ? "Aberto" : "Fechado";
}
window.aplicarEstadoLoja = aplicarEstadoLoja;

// BUSCA CARDÁPIO (dentro da própria empresa, tela-11)
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

function inicializarAjustes() {
    // Mantido por compatibilidade; o carregamento real dos dados da
    // loja acontece em carregarAjustesEmpresa() no módulo Firebase
}

// TOGGLE VISIBILIDADE DE SENHA (mantido para telas que ainda usam senha)
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
});

document.addEventListener('visibilitychange', function() {
    if (document.hidden && isRecording) pararGravacao();
});

document.addEventListener('submit', function(e) {
    e.preventDefault();
});
