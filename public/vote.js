const container = document.getElementById("vote-list");

async function loadDesigns() {
  const res = await fetch("http://localhost:3000/api/v1/design/public");

  const designs = await res.json();

  container.innerHTML = "";

  designs.forEach(d => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${d.previewImage}" />
      <p><b>Color:</b> ${d.bagColor}</p>
      <p><b>Pattern:</b> ${d.pattern || "none"}</p>
      <p><b>Chips:</b> ${d.chipsType || "none"}</p>
      <button>👍 Vote</button>
    `;

    container.appendChild(card);
  });
}

loadDesigns();
