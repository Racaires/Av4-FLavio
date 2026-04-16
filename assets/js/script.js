const SALDO_INICIAL = 100;
const VALOR_APOSTA = 10;

const SLOT_SYMBOLS = [
    { id: "banana", label: "BANANA", hint: "ganho normal" },
    { id: "cofre", label: "COFRE", hint: "quase premio" },
    { id: "coroa", label: "COROA", hint: "super ganho" },
    { id: "mico", label: "MICO", hint: "mega ganho" }
];

const SLOT_OUTCOMES = [
    { id: "loss", chance: 0.72, payout: 0, label: "Sem premio" },
    { id: "normal", chance: 0.18, payout: 18, label: "Ganho normal" },
    { id: "super", chance: 0.08, payout: 35, label: "Super ganho" },
    { id: "mega", chance: 0.02, payout: 100, label: "Mega ganho" }
];

const RETORNO_MEDIO = SLOT_OUTCOMES.reduce((total, resultado) => {
    return total + (resultado.chance * resultado.payout);
}, 0);

const PERDA_MEDIA = VALOR_APOSTA - RETORNO_MEDIO;

let saldo = SALDO_INICIAL;
let totalApostas = 0;
let totalDerrotas = 0;
let totalGanhosNormais = 0;
let totalSuperGanhos = 0;
let totalMegaGanhos = 0;
let giroEmAndamento = false;

document.addEventListener("DOMContentLoaded", () => {
    configurarMenuMobile();
    atualizarAnoRodape();
    prepararSimulador();
    prepararFormularioContato();
});

function atualizarAnoRodape() {
    const anoAtual = document.getElementById("anoAtual");

    if (anoAtual) {
        anoAtual.textContent = new Date().getFullYear();
    }
}

function prepararSimulador() {
    const botaoGiro = document.getElementById("spinButton");

    if (!botaoGiro) {
        return;
    }

    renderizarRolos(["banana", "coroa", "mico"]);
    atualizarTelaSaldo();
    atualizarPainelEstatistico();
    atualizarAlertaDeRisco();

    botaoGiro.addEventListener("click", girarCacaNiquel);

    const botaoReset = document.getElementById("resetButton");

    if (botaoReset) {
        botaoReset.addEventListener("click", reiniciarSimulador);
    }
}

function girarCacaNiquel() {
    if (giroEmAndamento) {
        return;
    }

    if (saldo < VALOR_APOSTA) {
        mostrarMensagemJogo(
            "Saldo insuficiente. Reinicie a simulacao ou pare para observar o prejuizo acumulado.",
            "loss"
        );
        atualizarUltimoTipoPremio("Ultimo resultado: saldo insuficiente");
        return;
    }

    const resultado = sortearResultadoSlot();
    const combinacaoFinal = criarCombinacaoFinal(resultado.id);

    giroEmAndamento = true;
    saldo -= VALOR_APOSTA;
    totalApostas += 1;

    atualizarTelaSaldo();
    atualizarPainelEstatistico();
    mostrarMensagemJogo("Os rolos estao girando. A expectativa sobe antes do resultado final.", "neutral");
    atualizarUltimoTipoPremio("Ultimo resultado: rolos em movimento");
    alternarControlesDoSlot(true);

    animarRolos(combinacaoFinal, () => {
        finalizarGiro(resultado, combinacaoFinal);
    });
}

function finalizarGiro(resultado, combinacaoFinal) {
    const combinacaoFormatada = formatarCombinacao(combinacaoFinal);

    if (resultado.id === "loss") {
        totalDerrotas += 1;
        mostrarMensagemJogo(
            "Sem premio desta vez. A tela fez suspense, mas a combinacao final foi " + combinacaoFormatada + ".",
            "loss"
        );
        atualizarUltimoTipoPremio("Ultimo resultado: sem premio");
        registrarHistorico("Sem premio em " + combinacaoFormatada + ": -" + formatarMoeda(VALOR_APOSTA), "loss");
    } else {
        saldo += resultado.payout;
        registrarFaixaDePremio(resultado.id);
        mostrarMensagemJogo(
            resultado.label + " com " + combinacaoFormatada + ". Premio liberado de " + formatarMoeda(resultado.payout) + ".",
            resultado.id
        );
        atualizarUltimoTipoPremio("Ultimo resultado: " + resultado.label);
        registrarHistorico(
            resultado.label + " em " + combinacaoFormatada + ": +" + formatarMoeda(resultado.payout),
            resultado.id
        );
    }

    giroEmAndamento = false;
    atualizarTelaSaldo();
    atualizarPainelEstatistico();
    atualizarAlertaDeRisco();
    alternarControlesDoSlot(false);
}

function animarRolos(combinacaoFinal, aoConcluir) {
    const rolos = ["slotReel1", "slotReel2", "slotReel3"]
        .map((id) => document.getElementById(id))
        .filter(Boolean);

    const temposDeParada = [900, 1250, 1600];

    rolos.forEach((rolo, indice) => {
        const moldura = rolo.closest(".slot-reel");

        if (moldura) {
            moldura.classList.add("is-spinning");
        }

        const intervalo = setInterval(() => {
            renderizarSimbolo(rolo, sortearSimboloAleatorio());
        }, 90 + (indice * 20));

        setTimeout(() => {
            clearInterval(intervalo);
            renderizarSimbolo(rolo, buscarSimbolo(combinacaoFinal[indice]));

            if (moldura) {
                moldura.classList.remove("is-spinning");
            }

            if (indice === rolos.length - 1 && typeof aoConcluir === "function") {
                aoConcluir();
            }
        }, temposDeParada[indice]);
    });
}

function criarCombinacaoFinal(tipo) {
    if (tipo === "normal") {
        return ["banana", "banana", "banana"];
    }

    if (tipo === "super") {
        return ["coroa", "coroa", "coroa"];
    }

    if (tipo === "mega") {
        return ["mico", "mico", "mico"];
    }

    return criarCombinacaoDePerda();
}

function criarCombinacaoDePerda() {
    const simbolos = SLOT_SYMBOLS.map((simbolo) => simbolo.id);

    if (Math.random() < 0.55) {
        const simboloPrincipal = sortearIdAleatorio(["banana", "coroa", "mico"]);
        const simboloSecundario = sortearIdDiferente(simboloPrincipal);
        const quaseGanhos = [
            [simboloPrincipal, simboloPrincipal, simboloSecundario],
            [simboloPrincipal, simboloSecundario, simboloPrincipal],
            [simboloSecundario, simboloPrincipal, simboloPrincipal]
        ];

        return quaseGanhos[Math.floor(Math.random() * quaseGanhos.length)];
    }

    let combinacao = [];

    do {
        combinacao = [
            simbolos[Math.floor(Math.random() * simbolos.length)],
            simbolos[Math.floor(Math.random() * simbolos.length)],
            simbolos[Math.floor(Math.random() * simbolos.length)]
        ];
    } while (combinacao[0] === combinacao[1] && combinacao[1] === combinacao[2]);

    return combinacao;
}

function sortearResultadoSlot() {
    const sorteio = Math.random();
    let acumulado = 0;

    for (const resultado of SLOT_OUTCOMES) {
        acumulado += resultado.chance;

        if (sorteio < acumulado) {
            return resultado;
        }
    }

    return SLOT_OUTCOMES[SLOT_OUTCOMES.length - 1];
}

function registrarFaixaDePremio(tipo) {
    if (tipo === "normal") {
        totalGanhosNormais += 1;
    }

    if (tipo === "super") {
        totalSuperGanhos += 1;
    }

    if (tipo === "mega") {
        totalMegaGanhos += 1;
    }
}

function renderizarRolos(idsDosSimbolos) {
    const rolos = ["slotReel1", "slotReel2", "slotReel3"];

    rolos.forEach((idDoRolo, indice) => {
        const elemento = document.getElementById(idDoRolo);

        if (elemento) {
            renderizarSimbolo(elemento, buscarSimbolo(idsDosSimbolos[indice]));
        }
    });
}

function renderizarSimbolo(elemento, simbolo) {
    elemento.dataset.symbol = simbolo.id;

    const nome = elemento.querySelector(".slot-symbol__name");
    const dica = elemento.querySelector(".slot-symbol__hint");

    if (nome) {
        nome.textContent = simbolo.label;
    }

    if (dica) {
        dica.textContent = simbolo.hint;
    }
}

function alternarControlesDoSlot(estado) {
    const botaoGiro = document.getElementById("spinButton");
    const botaoReset = document.getElementById("resetButton");

    if (botaoGiro) {
        botaoGiro.disabled = estado;
        botaoGiro.textContent = estado ? "Girando..." : "Girar os rolos";
    }

    if (botaoReset) {
        botaoReset.disabled = estado;
    }
}

function reiniciarSimulador() {
    if (giroEmAndamento) {
        return;
    }

    saldo = SALDO_INICIAL;
    totalApostas = 0;
    totalDerrotas = 0;
    totalGanhosNormais = 0;
    totalSuperGanhos = 0;
    totalMegaGanhos = 0;

    renderizarRolos(["banana", "coroa", "mico"]);
    atualizarTelaSaldo();
    atualizarPainelEstatistico();
    atualizarAlertaDeRisco();
    atualizarUltimoTipoPremio("Ultimo resultado: simulacao reiniciada");
    mostrarMensagemJogo("Simulacao reiniciada. O saldo voltou ao valor inicial.", "neutral");
    limparHistorico();
}

function atualizarTelaSaldo() {
    const elementoSaldo = document.getElementById("saldoUsuario");

    if (elementoSaldo) {
        elementoSaldo.textContent = formatarMoeda(saldo);
    }
}

function atualizarPainelEstatistico() {
    const resultadoAcumulado = saldo - SALDO_INICIAL;

    atualizarTexto("totalApostas", totalApostas);
    atualizarTexto("totalGanhosNormais", totalGanhosNormais);
    atualizarTexto("totalSuperGanhos", totalSuperGanhos);
    atualizarTexto("totalMegaGanhos", totalMegaGanhos);
    atualizarTexto("totalDerrotas", totalDerrotas);
    atualizarTexto("resultadoAcumulado", formatarMoeda(resultadoAcumulado));
}

function atualizarAlertaDeRisco() {
    const aviso = document.getElementById("alertaRetorno");

    if (!aviso) {
        return;
    }

    if (totalApostas === 0) {
        aviso.textContent = "Se voce repetir os giros muitas vezes, a tendencia estatistica continua sendo terminar no prejuizo.";
        return;
    }

    const prejuizoEsperado = totalApostas * PERDA_MEDIA;
    aviso.textContent =
        "Pela media da simulacao, depois de " +
        totalApostas +
        " giros a perda esperada seria de aproximadamente " +
        formatarMoeda(prejuizoEsperado) +
        ".";
}

function mostrarMensagemJogo(texto, tipo) {
    const mensagemJogo = document.getElementById("mensagemJogo");

    if (!mensagemJogo) {
        return;
    }

    mensagemJogo.textContent = texto;
    mensagemJogo.className = "status-panel status-panel--" + tipo;
}

function atualizarUltimoTipoPremio(texto) {
    const ultimoTipoPremio = document.getElementById("ultimoTipoPremio");

    if (ultimoTipoPremio) {
        ultimoTipoPremio.textContent = texto;
    }
}

function registrarHistorico(texto, tipo) {
    const historico = document.getElementById("historicoApostas");

    if (!historico) {
        return;
    }

    if (historico.children.length === 1 && historico.firstElementChild.textContent.includes("historico")) {
        historico.innerHTML = "";
    }

    const cores = {
        loss: "#7f2f1f",
        normal: "#8a5c0c",
        super: "#7b1f4a",
        mega: "#1f5e40"
    };

    const item = document.createElement("li");
    item.textContent = texto;
    item.style.color = cores[tipo] || "#6f5a4f";
    historico.prepend(item);

    while (historico.children.length > 6) {
        historico.removeChild(historico.lastElementChild);
    }
}

function limparHistorico() {
    const historico = document.getElementById("historicoApostas");

    if (!historico) {
        return;
    }

    historico.innerHTML = "<li>O historico dos giros aparecera aqui.</li>";
}

function prepararFormularioContato() {
    const formContato = document.getElementById("formContato");

    if (!formContato) {
        return;
    }

    formContato.addEventListener("submit", (event) => {
        event.preventDefault();

        const nome = document.getElementById("nome").value.trim();
        const email = document.getElementById("email").value.trim();
        const mensagem = document.getElementById("mensagem").value.trim();

        if (nome.length < 3) {
            mostrarMensagemFormulario("Por favor, insira um nome com pelo menos 3 letras.", true);
            return;
        }

        if (!validarEmail(email)) {
            mostrarMensagemFormulario("Por favor, insira um e-mail valido.", true);
            return;
        }

        if (mensagem.length < 15) {
            mostrarMensagemFormulario("A mensagem precisa ter pelo menos 15 caracteres.", true);
            return;
        }

        mostrarMensagemFormulario(
            "Obrigado, " + nome + "! Sua mensagem foi recebida pela equipe da MicoBet.",
            false
        );
        formContato.reset();
    });
}

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function mostrarMensagemFormulario(texto, erro) {
    const formStatus = document.getElementById("formStatus");

    if (!formStatus) {
        return;
    }

    formStatus.textContent = texto;
    formStatus.className = erro ? "form-status is-error" : "form-status is-success";
}

function buscarSimbolo(id) {
    return SLOT_SYMBOLS.find((simbolo) => simbolo.id === id) || SLOT_SYMBOLS[0];
}

function sortearSimboloAleatorio() {
    return SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
}

function sortearIdAleatorio(idsDosSimbolos) {
    return idsDosSimbolos[Math.floor(Math.random() * idsDosSimbolos.length)];
}

function sortearIdDiferente(idProibido) {
    let idSorteado = idProibido;

    while (idSorteado === idProibido) {
        idSorteado = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].id;
    }

    return idSorteado;
}

function formatarCombinacao(combinacao) {
    return combinacao.map((id) => buscarSimbolo(id).label).join(" | ");
}

function atualizarTexto(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = valor;
    }
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}
