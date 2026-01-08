const container = document.getElementById("designs");

async function loadDesigns() {
  try {
    const res = await fetch("http://localhost:3000/api/v1/design/public");
    if (!res.ok) throw new Error("Failed");

    const designs = await res.json();
    container.innerHTML = "";

    designs.forEach(d => {
      const div = document.createElement("div");
      div.className = "design-card";

      div.innerHTML = `
        <img src="${d.previewImage}" width="220" />
        <p>Color: ${d.bagColor}</p>
        <p>Pattern: ${d.pattern || "none"}</p>
        <p>Chips: ${d.chipsType || "none"}</p>
        <p>Votes: <strong id="votes-${d._id}">${d.votes}</strong></p>
        <button onclick="vote('${d._id}')">👍 Vote</button>
      `;

      container.appendChild(div);
    });
  } catch {
    container.innerHTML = "<p style='color:red'>Could not load designs</p>";
  }
}

window.vote = async function (id) {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:3000/api/v1/design/${id}/vote`,
    {
      method: "POST",
      headers: token
        ? { Authorization: "Bearer " + token }
        : {}
    }
  );

  if (!res.ok) return alert("Login required to vote");

  const data = await res.json();
  document.getElementById(`votes-${id}`).innerText = data.votes;
};

loadDesigns();

