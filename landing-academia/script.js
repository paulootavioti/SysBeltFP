(function () {
  "use strict";

  // ===== Configuração — ajuste antes de publicar =====
  // URL da API do SysBeltFP (mesmo backend usado por sgcl-web/sgcl-portal-familia).
  var API_BASE_URL = "https://sysbeltfp.netlify.app/api";
  // URL do Portal da Família — "Ver loja completa" leva pra lá, já que o
  // catálogo completo (com carrinho/checkout) só existe autenticado.
  var PORTAL_FAMILIA_URL = "https://sysbeltportalfamilia.netlify.app";

  // ===== Menu mobile =====
  var navToggle = document.getElementById("navToggle");
  var nav = document.getElementById("nav");

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ===== Instrumentação de conversão =====
  // Sem plataforma de analytics configurada neste projeto ainda — dispara
  // pro padrão window.dataLayer (convenção GA4/GTM, funciona assim que uma
  // conta real for plugada) e também um CustomEvent no document, pra
  // qualquer outra ferramenta escutar sem precisar mexer neste arquivo.
  function registrarConversao(nomeEvento, detalhes) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: nomeEvento }, detalhes || {}));
    document.dispatchEvent(new CustomEvent(nomeEvento, { detail: detalhes || {} }));
  }

  document.querySelectorAll(".hero-ctas a").forEach(function (link) {
    link.addEventListener("click", function () {
      registrarConversao("landing_cta_hero_click", { destino: link.getAttribute("href"), texto: link.textContent.trim() });
    });
  });

  var anoAtual = document.getElementById("anoAtual");
  if (anoAtual) {
    anoAtual.textContent = String(new Date().getFullYear());
  }

  var linkLojaCompleta = document.getElementById("linkLojaCompleta");
  if (linkLojaCompleta) {
    linkLojaCompleta.href = PORTAL_FAMILIA_URL;
  }

  // ===== Modalidades (#modalidades) =====
  var modalidadesGrid = document.getElementById("modalidadesGrid");
  if (modalidadesGrid) {
    fetch(API_BASE_URL + "/publico/modalidades")
      .then(function (res) { return res.json(); })
      .then(function (modalidades) {
        if (!Array.isArray(modalidades) || modalidades.length === 0) {
          modalidadesGrid.innerHTML = "<p class=\"estado-vazio\">Em breve.</p>";
          return;
        }

        modalidadesGrid.innerHTML = modalidades
          .map(function (modalidade) {
            return (
              '<article class="card-modalidade">' +
              "<h3>" + escapeHtml(modalidade.nome) + "</h3>" +
              '<p class="card-modalidade-faixa">' + escapeHtml(modalidade.publico) + "</p>" +
              "<p>" + escapeHtml(modalidade.descricao) + "</p>" +
              "</article>"
            );
          })
          .join("");
      })
      .catch(function () {
        modalidadesGrid.innerHTML = "<p class=\"estado-vazio\">Não foi possível carregar as modalidades.</p>";
      });
  }

  // ===== Equipe (#equipe) =====
  var equipeGrid = document.getElementById("equipeGrid");
  if (equipeGrid) {
    fetch(API_BASE_URL + "/publico/equipe")
      .then(function (res) { return res.json(); })
      .then(function (equipe) {
        if (!Array.isArray(equipe) || equipe.length === 0) {
          equipeGrid.innerHTML = "<p class=\"estado-vazio\">Em breve.</p>";
          return;
        }

        equipeGrid.innerHTML = equipe
          .map(function (professor) {
            var foto = professor.fotoUrl
              ? '<img src="' + escapeHtml(professor.fotoUrl) + '" alt="' + escapeHtml(professor.nome) + '" loading="lazy" />'
              : '<span class="avatar-placeholder" aria-hidden="true">' + escapeHtml(iniciais(professor.nome)) + "</span>";

            return (
              '<div class="card-equipe">' +
              '<div class="card-equipe-foto">' + foto + "</div>" +
              "<strong>" + escapeHtml(professor.nome) + "</strong>" +
              (professor.faixa ? '<span class="card-equipe-faixa">' + escapeHtml(professor.faixa) + "</span>" : "") +
              "</div>"
            );
          })
          .join("");
      })
      .catch(function () {
        equipeGrid.innerHTML = "<p class=\"estado-vazio\">Não foi possível carregar a equipe.</p>";
      });
  }

  // ===== Galeria (#galeria) =====
  var galeriaGrid = document.getElementById("galeriaGrid");
  if (galeriaGrid) {
    fetch(API_BASE_URL + "/publico/galeria")
      .then(function (res) { return res.json(); })
      .then(function (fotos) {
        if (!Array.isArray(fotos) || fotos.length === 0) {
          galeriaGrid.innerHTML = "<p class=\"estado-vazio\">Em breve, fotos dos treinos.</p>";
          return;
        }

        galeriaGrid.innerHTML = fotos
          .map(function (foto) {
            return (
              '<figure class="card-galeria">' +
              '<img src="' + escapeHtml(foto.url) + '" alt="' + escapeHtml(foto.legenda) + '" loading="lazy" />' +
              "<figcaption>" + escapeHtml(foto.legenda) + "</figcaption>" +
              "</figure>"
            );
          })
          .join("");
      })
      .catch(function () {
        galeriaGrid.innerHTML = "<p class=\"estado-vazio\">Não foi possível carregar a galeria.</p>";
      });
  }

  // ===== Loja em destaque (#loja) =====
  var produtosGrid = document.getElementById("produtosGrid");
  if (produtosGrid) {
    fetch(API_BASE_URL + "/publico/produtos-destaque")
      .then(function (res) { return res.json(); })
      .then(function (produtos) {
        if (!Array.isArray(produtos) || produtos.length === 0) {
          produtosGrid.innerHTML = "<p class=\"estado-vazio\">Em breve, novidades na loja.</p>";
          return;
        }

        produtosGrid.innerHTML = produtos
          .map(function (produto) {
            var imagem = produto.imagemUrl
              ? '<img src="' + escapeHtml(produto.imagemUrl) + '" alt="' + escapeHtml(produto.nome) + '" loading="lazy" />'
              : '<span class="card-produto-placeholder" aria-hidden="true">🥋</span>';

            return (
              '<div class="card-produto">' +
              '<div class="card-produto-imagem">' + imagem + "</div>" +
              "<strong>" + escapeHtml(produto.nome) + "</strong>" +
              '<span class="card-produto-preco">R$ ' + Number(produto.preco).toFixed(2).replace(".", ",") + "</span>" +
              "</div>"
            );
          })
          .join("");
      })
      .catch(function () {
        produtosGrid.innerHTML = "<p class=\"estado-vazio\">Não foi possível carregar a loja.</p>";
      });
  }

  // ===== Horários (#local) =====
  var horariosLista = document.getElementById("horariosLista");
  if (horariosLista) {
    fetch(API_BASE_URL + "/publico/horarios")
      .then(function (res) { return res.json(); })
      .then(function (horarios) {
        if (!Array.isArray(horarios) || horarios.length === 0) {
          horariosLista.innerHTML = "<p class=\"estado-vazio\">Consulte nossos horários por WhatsApp.</p>";
          return;
        }

        horariosLista.innerHTML = horarios
          .map(function (turma) {
            return (
              '<div class="linha-horario">' +
              "<strong>" + escapeHtml(turma.nome) + "</strong>" +
              "<span>" + escapeHtml(turma.dias) + " · " + escapeHtml(turma.horarioInicio) + "–" + escapeHtml(turma.horarioFim) + "</span>" +
              "</div>"
            );
          })
          .join("");
      })
      .catch(function () {
        horariosLista.innerHTML = "<p class=\"estado-vazio\">Não foi possível carregar os horários.</p>";
      });
  }

  // ===== Formulário de lead (#contato) =====
  var formLead = document.getElementById("formLead");
  var formLeadStatus = document.getElementById("formLeadStatus");

  if (formLead && formLeadStatus) {
    formLead.addEventListener("submit", function (event) {
      event.preventDefault();

      var dados = new FormData(formLead);
      var botao = formLead.querySelector('button[type="submit"]');

      formLeadStatus.textContent = "";
      formLeadStatus.classList.remove("formulario-status-sucesso");
      if (botao) botao.disabled = true;

      fetch(API_BASE_URL + "/publico/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: dados.get("nome"),
          contato: dados.get("contato"),
          interesse: dados.get("interesse"),
        }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Falha ao enviar");
          return res.json();
        })
        .then(function () {
          formLeadStatus.textContent = "Recebemos seus dados — vamos entrar em contato em breve!";
          formLeadStatus.classList.add("formulario-status-sucesso");
          formLead.reset();
          registrarConversao("landing_lead_enviado", { interesse: dados.get("interesse") });
        })
        .catch(function () {
          formLeadStatus.textContent = "Não foi possível enviar agora. Tente novamente em instantes.";
        })
        .finally(function () {
          if (botao) botao.disabled = false;
        });
    });
  }

  function escapeHtml(valor) {
    var div = document.createElement("div");
    div.textContent = valor == null ? "" : String(valor);
    return div.innerHTML;
  }

  function iniciais(nome) {
    var partes = String(nome || "").trim().split(/\s+/).filter(Boolean);
    var primeiras = [partes[0], partes[partes.length - 1]].filter(Boolean);
    return primeiras.map(function (parte) { return parte[0] ? parte[0].toUpperCase() : ""; }).join("");
  }
})();
