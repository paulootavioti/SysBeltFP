(function () {
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

  var anoAtual = document.getElementById("anoAtual");
  if (anoAtual) {
    anoAtual.textContent = String(new Date().getFullYear());
  }

  var form = document.querySelector('form[name="contato"]');
  var status = document.getElementById("formStatus");

  if (form && status) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var data = new FormData(form);

      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString(),
      })
        .then(function () {
          status.textContent = "Recebemos seus dados — vamos entrar em contato em breve.";
          form.reset();
        })
        .catch(function () {
          status.textContent = "Não foi possível enviar agora. Tente novamente em instantes.";
        });
    });
  }
})();
