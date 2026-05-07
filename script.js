// ELEMENTS
const grid = document.getElementById("videoGrid");

const profileBtn = document.getElementById("profileBtn");
const uploadInput = document.getElementById("uploadInput");

const cookieBar = document.getElementById("cookieBar");
const acceptCookie = document.getElementById("acceptCookie");

// STORAGE KEY
const STORAGE_KEY = "crossporn_data";


// 🔄 LOAD SAVED DATA ON START
window.addEventListener("DOMContentLoaded", () => {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  saved.forEach(item => createCard(item, false));
});


// 💾 SAVE TO LOCAL STORAGE
function saveData(data) {
  const current = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  current.unshift(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}



// 🎬 CREATE CARD
function createCard(item, save = true) {

  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <div class="thumb">
      ${item.image ? `<img src="${item.image}">` : `<div class="no-thumb">No Image</div>`}
    </div>
    <div class="info">
      <div class="title">${item.title}</div>
      <div class="meta">Tap to open</div>
    </div>
  `;

  // CLICK OPEN
  card.addEventListener("click", () => {
    if (item.link) window.open(item.link, "_blank");
  });

  grid.prepend(card);

  if (save) saveData(item);
}


// 👤 PROFILE CLICK → FILE PICKER
profileBtn.addEventListener("click", () => {
  uploadInput.click();
});


// 📂 FILE UPLOAD
uploadInput.addEventListener("change", () => {
  const file = uploadInput.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const item = {
      title: file.name,
      image: file.type.startsWith("image") ? e.target.result : "",
      link: e.target.result,
      type: "upload"
    };

    createCard(item, true);
  };

  reader.readAsDataURL(file);
  uploadInput.value = "";
});


// 🍪 COOKIE
acceptCookie.addEventListener("click", () => {
  cookieBar.style.display = "none";
});
// SPLASH FIX (reliable)
function hideSplash() {
  const splash = document.getElementById("splashScreen");
  if (splash) {
    splash.style.opacity = "0";
    splash.style.transition = "1s";

    setTimeout(() => {
      splash.remove();
    }, 500);
  }
}

// 1️⃣ DOM ready pe hide (fast)
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(hideSplash, 800);
});

// 2️⃣ Backup (agar load event aaye)
window.addEventListener("load", hideSplash);