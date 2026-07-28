(function () {
  var cards = document.querySelectorAll(".home-reflective-card");
  if (!cards.length) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (reduceMotion.matches || !canHover.matches) return;

  function resetCard(card) {
    card.classList.remove("is-reflecting");
    card.style.setProperty("--reflect-x", "50%");
    card.style.setProperty("--reflect-y", "50%");
    card.style.setProperty("--reflect-rotate-x", "0deg");
    card.style.setProperty("--reflect-rotate-y", "0deg");
  }

  function findReflectiveCard(element) {
    if (!element) return null;
    if (element.classList && element.classList.contains("home-reflective-card")) return element;
    return element.closest ? element.closest(".home-reflective-card") : null;
  }

  cards.forEach(function (card) {
    card.addEventListener("pointermove", function (event) {
      var rect = card.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;
      var xPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      var yPercent = Math.max(0, Math.min(100, (y / rect.height) * 100));
      var rotateY = ((xPercent - 50) / 50) * 5;
      var rotateX = ((50 - yPercent) / 50) * 5;

      card.classList.add("is-reflecting");
      card.style.setProperty("--reflect-x", xPercent.toFixed(2) + "%");
      card.style.setProperty("--reflect-y", yPercent.toFixed(2) + "%");
      card.style.setProperty("--reflect-rotate-x", rotateX.toFixed(2) + "deg");
      card.style.setProperty("--reflect-rotate-y", rotateY.toFixed(2) + "deg");
    });

    card.addEventListener("pointerout", function (event) {
      if (findReflectiveCard(event.relatedTarget) !== card) resetCard(card);
    });

    card.addEventListener("blur", function () {
      resetCard(card);
    }, true);
  });
})();
