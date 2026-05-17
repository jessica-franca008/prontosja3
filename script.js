if (clienteSnap.exists()) {
    const dados = clienteSnap.data();
    const nomePerfil = document.getElementById('nomePerfil');
    const emailPerfil = document.getElementById('emailPerfil');
    const fotoPerfil = document.getElementById('fotoPerfil');
    const telefoneEl = document.getElementById('telefonePerfil');
    const localidadeEl = document.getElementById('localidadePerfil');
    
    if (nomePerfil) nomePerfil.textContent = dados.nome;
    if (emailPerfil) emailPerfil.textContent = dados.email;
    if (fotoPerfil && dados.foto) {
        fotoPerfil.style.backgroundImage = `url('${dados.foto}')`;
    }
    // CARREGA O TELEFONE SALVO
    if (telefoneEl && dados.telefone) {
        telefoneEl.value = dados.telefone;
    }
    if (localidadeEl && dados.endereco) {
        localidadeEl.value = dados.endereco;
    }
    
    tipoUsuario = 'cliente';
    localStorage.setItem('tipoUsuario', 'cliente');
    mudarTela('tela-5');
}
