(function () {
  "use strict";
  var header = document.getElementById("header");
  var menu = document.querySelector(".menu-btn");
  var drawer = document.getElementById("drawer");
  var progress = document.querySelector(".progress span");
  var links = Array.from(document.querySelectorAll(".navlink"));
  function fecharMenu() {
    if (!menu || !drawer) return;
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "Abrir menu");
    drawer.setAttribute("data-open", "0");
  }
  if (menu && drawer) {
    menu.addEventListener("click", function () {
      var abrir = menu.getAttribute("aria-expanded") !== "true";
      menu.setAttribute("aria-expanded", String(abrir));
      menu.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
      drawer.setAttribute("data-open", abrir ? "1" : "0");
    });
    drawer.querySelectorAll("a").forEach(function (link) { link.addEventListener("click", fecharMenu); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape") fecharMenu(); });
  }
  var ticking = false;
  function atualizarRolagem() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var root = document.documentElement;
      var y = window.scrollY || root.scrollTop || document.body.scrollTop || 0;
      var max = Math.max(root.scrollHeight - root.clientHeight, 1);
      if (header) header.setAttribute("data-compact", y > 48 ? "1" : "0");
      if (progress) progress.style.width = Math.min(100, y / max * 100).toFixed(2) + "%";
      ticking = false;
    });
  }
  window.addEventListener("scroll", atualizarRolagem, { passive: true });
  window.addEventListener("resize", atualizarRolagem, { passive: true });
  atualizarRolagem();
  var reveals = Array.from(document.querySelectorAll("[data-reveal]"));
  function revelar(el) { el.setAttribute("data-reveal", "in"); }
  window.setTimeout(function () { reveals.forEach(revelar); }, 2200);
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { revelar(entry.target); revealObserver.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) { link.setAttribute("data-active", link.dataset.sec === entry.target.id ? "1" : "0"); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach(function (link) {
      var section = document.getElementById(link.dataset.sec);
      if (section) navObserver.observe(section);
    });
  } else { reveals.forEach(revelar); }
  var alunos = document.getElementById("alunos");
  var alunoOutput = document.getElementById("alunosValor");
  var unidadeButtons = Array.from(document.querySelectorAll("[data-unidades]"));
  var unidades = 1;
  var precoPublico = { alunosGratis: 3, alunosPorBloco: 10, precoPorBlocoCentavos: 3700 };
  var brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  function calcular() {
    var quantidade = Math.max(1, Number(alunos.value) || 1);
    alunoOutput.textContent = quantidade;
    var gratis = quantidade <= precoPublico.alunosGratis;
    var porUnidade = Math.ceil(quantidade / unidades);
    var faixas = gratis ? 0 : Math.max(1, Math.ceil(porUnidade / precoPublico.alunosPorBloco)) * unidades;
    var total = faixas * (precoPublico.precoPorBlocoCentavos / 100);
    document.getElementById("precoValor").textContent = brl.format(total);
    document.getElementById("faixasValor").textContent = gratis ? "—" : String(faixas);
    document.getElementById("custoValor").textContent = gratis ? brl.format(0) : brl.format(total / quantidade);
    document.getElementById("precoLegenda").textContent = gratis ? "Plano grátis: até 3 alunos, sem prazo de expiração." : "por mês · " + faixas + (faixas === 1 ? " faixa" : " faixas") + " em " + unidades + (unidades === 1 ? " unidade" : " unidades");
  }
  if (alunos && alunoOutput) {
    alunos.addEventListener("input", calcular);
    unidadeButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        unidades = Number(button.dataset.unidades);
        unidadeButtons.forEach(function (item) { item.setAttribute("aria-pressed", String(item === button)); });
        calcular();
      });
    });
    calcular();
    fetch((window.SYSBELT_API_URL || "") + "/publico/preco-plataforma").then(function (resposta) {
      if (!resposta.ok) throw new Error();
      return resposta.json();
    }).then(function (preco) {
      precoPublico = preco;
      document.querySelectorAll("[data-preco-faixa]").forEach(function (item) { item.textContent = brl.format(preco.precoPorBlocoCentavos / 100); });
      document.querySelectorAll("[data-alunos-faixa]").forEach(function (item) { item.textContent = String(preco.alunosPorBloco); });
      calcular();
    }).catch(function () { /* mantém o último preço publicado se a API estiver indisponível */ });
  }
  var form = document.querySelector('form[name="contato"]');
  var status = document.getElementById("formStatus");
  if (form && status) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var contato = String(new FormData(form).get("contato") || "").trim();
      if (contato.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contato)) {
        status.textContent = "Confira o endereço de e-mail informado.";
        status.className = "form-status error";
        return;
      }
      var button = form.querySelector('button[type="submit"]');
      button.disabled = true; button.textContent = "Enviando..."; status.textContent = "";
      fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(form)).toString() })
        .then(function (response) { if (!response.ok) throw new Error("Falha no envio"); form.reset(); status.className = "form-status"; status.textContent = "Recebido! Entramos em contato em até 1 dia útil."; })
        .catch(function () { status.className = "form-status error"; status.textContent = "Não foi possível enviar agora. Seus dados continuam preenchidos; tente novamente."; })
        .finally(function () { button.disabled = false; button.textContent = "Enviar"; });
    });
  }
  var ano = document.getElementById("anoAtual");
  if (ano) ano.textContent = String(new Date().getFullYear());
}());
