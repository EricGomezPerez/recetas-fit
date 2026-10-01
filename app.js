
const state = {
  query: "",
  category: "Todas",
  view: "all",
  favorites: JSON.parse(localStorage.getItem("recetas-fit-favorites") || "[]")
};

const categories = ["Todas", ...new Set(RECIPES.map(r => r.meal).filter(Boolean))];
const filters = document.getElementById("filters");
const grid = document.getElementById("recipeGrid");
const empty = document.getElementById("empty");
const search = document.getElementById("search");
const resultCount = document.getElementById("resultCount");
const sectionTitle = document.getElementById("sectionTitle");
const favCount = document.getElementById("favCount");
const dialog = document.getElementById("recipeDialog");
const detail = document.getElementById("detail");

const icons = {
  "Desayuno":"☀️", "Almuerzo":"🥗", "Cena":"🍽️", "Snack":"🥑", "Postre":"🍫"
};

function esc(v="") {
  return v.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function isFav(id){ return state.favorites.includes(id); }
function saveFavs(){ localStorage.setItem("recetas-fit-favorites", JSON.stringify(state.favorites)); }
function toggleFav(id){
  state.favorites = isFav(id) ? state.favorites.filter(x => x !== id) : [...state.favorites, id];
  saveFavs(); updateFavCount(); render();
}
function updateFavCount(){ favCount.textContent = state.favorites.length; }

function renderFilters(){
  filters.innerHTML = categories.map(c =>
    `<button class="filter ${state.category===c?'active':''}" data-cat="${esc(c)}">${esc(c)}</button>`
  ).join("");
  filters.querySelectorAll(".filter").forEach(b => b.onclick = () => {
    state.category = b.dataset.cat; state.view = "all"; updateNav(); render();
  });
}

function filtered(){
  const q = state.query.toLowerCase().trim();
  return RECIPES.filter(r => {
    const matchesCat = state.category === "Todas" || r.meal === state.category;
    const matchesFav = state.view !== "favorites" || isFav(r.id);
    const haystack = [
      r.title, r.meal, ...(r.tags||[]), ...(r.ingredients||[]).map(i=>i.name)
    ].join(" ").toLowerCase();
    return matchesCat && matchesFav && (!q || haystack.includes(q));
  });
}

function visual(r){
  return `<div class="card-visual">
    <span class="meal">${esc(r.meal)}</span>
    <span class="food">${icons[r.meal] || "🥣"}</span>
  </div>`;
}

function card(r){
  const kcal = (r.nutrition_items||[]).find(x=>x.label.toLowerCase().startsWith("calor"))?.value || "";
  const protein = (r.nutrition_items||[]).find(x=>x.label.toLowerCase().startsWith("prote"))?.value || "";
  return `<article class="card">
    <div style="position:relative">${visual(r)}
      <button class="heart ${isFav(r.id)?'saved':''}" data-fav="${r.id}" aria-label="Favorita">${isFav(r.id)?"♥":"♡"}</button>
    </div>
    <div class="card-body">
      <h3 class="card-title">${esc(r.title)}</h3>
      <div class="meta"><strong>⏱ ${esc(r.time)}</strong><span class="dot"></span><span>${esc(kcal)}</span></div>
      <div class="card-footer">
        <div class="tags">${(r.tags||[]).slice(0,2).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div>
        <button class="open" data-open="${r.id}">Ver receta →</button>
      </div>
    </div>
  </article>`;
}

function render(){
  const list = filtered();
  sectionTitle.textContent = state.view === "favorites" ? "Tus favoritas" : "Todas las recetas";
  resultCount.textContent = `${list.length} ${list.length===1?"receta":"recetas"}`;
  grid.innerHTML = list.map(card).join("");
  empty.hidden = list.length !== 0;
  grid.hidden = list.length === 0;
  grid.querySelectorAll("[data-fav]").forEach(b => b.onclick = e => {
    e.stopPropagation(); toggleFav(Number(b.dataset.fav));
  });
  grid.querySelectorAll("[data-open]").forEach(b => b.onclick = () => openRecipe(Number(b.dataset.open)));
}

function updateNav(){
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active",
    (b.dataset.view==="favorites" && state.view==="favorites") ||
    (b.dataset.view==="all" && state.view==="all")
  ));
}

function openRecipe(id){
  const r = RECIPES.find(x=>x.id===id);
  if(!r) return;
  const nutrition = (r.nutrition_items||[]).filter(x=>x.label!=="Nota");
  detail.innerHTML = `
    <section class="detail-hero">
      <p class="eyebrow">${esc(r.meal)} · ${esc(r.time)}</p>
      <h1 class="detail-title">${esc(r.title)}</h1>
      <div class="detail-meta">
        <span>${r.ingredients.length} ingredientes</span>
        <span>·</span>
        <span>${r.steps.length} pasos</span>
      </div>
    </section>
    <section class="detail-content">
      <aside>
        <h3>Ingredientes</h3>
        <ul class="ingredients">${r.ingredients.map(i=>`<li><span>${esc(i.name)}</span><span>${esc(i.qty)}</span></li>`).join("")}</ul>
        <div class="detail-tags">${(r.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div>
      </aside>
      <div>
        <h3>Elaboración</h3>
        ${r.intro ? `<p class="intro">${esc(r.intro)}</p>` : ""}
        <ol class="steps">${r.steps.map(s=>`<li>${esc(s.replace(/^\d+\.\s*/, ""))}</li>`).join("")}</ol>
        ${nutrition.length ? `<div class="nutrition">${nutrition.map(n=>`<div class="nut"><label>${esc(n.label)}</label><b>${esc(n.value)}</b></div>`).join("")}</div>` : ""}
      </div>
    </section>`;
  dialog.showModal();
}

document.querySelectorAll(".nav-btn").forEach(b => b.onclick = () => {
  state.view = b.dataset.view; updateNav(); render();
});
search.addEventListener("input", e => { state.query = e.target.value; render(); });
document.getElementById("clearFilters").onclick = () => {
  state.query = ""; state.category = "Todas"; search.value = ""; renderFilters(); render();
};
document.getElementById("closeDialog").onclick = () => dialog.close();
dialog.addEventListener("click", e => { if(e.target === dialog) dialog.close(); });

renderFilters();
updateFavCount();
render();
