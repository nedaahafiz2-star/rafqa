// --- DOM elements ---
const gamesGrid = document.getElementById("gamesGrid");
const gamesCount = document.getElementById("gamesCount");
const searchBar = document.getElementById("searchBar");
const searchToggle = document.getElementById("searchToggle");
const searchInput = document.getElementById("searchInput");
const scrollToGamesBtn = document.getElementById("scrollToGames");

const gameModal = document.getElementById("gameModal");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalCategory = document.getElementById("modalCategory");
const modalDescription = document.getElementById("modalDescription");
const modalPrice = document.getElementById("modalPrice");
const modalAddToCart = document.getElementById("modalAddToCart");

const cartPanel = document.getElementById("cartPanel");
const cartToggle = document.getElementById("cartToggle");
const cartItemsEl = document.getElementById("cartItems");
const cartCountEl = document.getElementById("cartCount");
const cartTotalEl = document.getElementById("cartTotal");
const checkoutToggle = document.getElementById("checkoutToggle");
const checkoutSection = document.getElementById("checkoutSection");
const closeCheckoutBtn = document.getElementById("closeCheckout");

const loginToggle = document.getElementById("loginToggle");
const loginModal = document.getElementById("loginModal");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const registerModal = document.getElementById("registerModal");
const openRegister = document.getElementById("openRegister");
const registerForm = document.getElementById("registerForm");
const registerName = document.getElementById("registerName");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");

const googleLoginBtn = document.getElementById("googleLogin");

// عناصر القائمة المنسدلة
const userDropdown = document.getElementById("userDropdown");
const btnLogout = document.getElementById("btnLogout");
const btnMyOrders = document.getElementById("btnMyOrders");

// --- State ---
let games = [];
let filteredGames = [];
let selectedGame = null;
let cart = [];
let currentUser = null;

// --- Helpers ---
function mapCategory(cat) {
  switch (cat) {
    case "eid":
      return "ألعاب العيد";
    case "brain":
      return "ألعاب الذكاء";
    case "summer":
      return "ألعاب الذكاء الاصطناعي";
    case "edu":
      return "ألعاب تعليمية";
    case "group":
      return "ألعاب جماعية";
    case "kids":
      return "ألعاب للأطفال";
    default:
      return "ألعاب تفاعلية";
  }
}

function openModal(el) {
  if (el) el.classList.remove("hidden");
}

function closeModal(el) {
  if (el) el.classList.add("hidden");
}

function updateHeaderUser(user) {
  if (!loginToggle) return;
  if (user) {
    loginToggle.textContent = user.displayName || user.email.split('@')[0] || "حسابي";
  } else {
    loginToggle.textContent = "تسجيل الدخول";
    if (userDropdown) userDropdown.classList.add("hidden");
  }
}

// --- Render functions ---
function renderGames(list) {
  if (!gamesGrid) return;
  gamesGrid.innerHTML = "";
  
  if (list.length === 0) {
    gamesGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px;">لا توجد ألعاب معروضة حالياً.</p>`;
    if (gamesCount) gamesCount.textContent = "0 لعبة";
    return;
  }

  list.forEach((game) => {
    // إيجاد اسم وصورة اللعبة بمرونة سواءً بالنظام القديم أو الجديد لحقول الفايربيس
    const gameName = game.name || game.title || "لعبة تفاعلية";
    const gameImg = game.image || game.imageUrl || 'placeholder.png';

    const card = document.createElement("article");
    card.className = "game-card";
    card.dataset.id = game.id;

    card.innerHTML = `
      <div class="game-thumb">
        <img src="${gameImg}" alt="${gameName}">
      </div>
      <div class="game-body">
        <div class="game-title">${gameName}</div>
        <div class="game-meta">
          <span>${mapCategory(game.category)}</span>
          <span class="game-price">${game.price} ر.س</span>
        </div>
        <div class="game-actions">
          <button class="add-btn" data-add="${game.id}">إضافة إلى السلة</button>
        </div>
      </div>
    `;

    gamesGrid.appendChild(card);
  });

  if (gamesCount) {
    gamesCount.textContent = `${list.length} لعبة`;
  }
}

function renderCart() {
  if (!cartItemsEl) return;
  cartItemsEl.innerHTML = "";
  
  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<p style="font-size:0.85rem;color:#6b7280;padding:10px;">السلة فارغة حالياً.</p>`;
  } else {
    cart.forEach((item) => {
      const game = games.find((g) => g.id === item.id);
      if (!game) return;
      
      const gameName = game.name || game.title || "لعبة تفاعلية";
      const gameImg = game.image || game.imageUrl || 'placeholder.png';

      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="cart-item-thumb">
          <img src="${gameImg}" alt="${gameName}">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-title">${gameName}</div>
          <div class="cart-item-meta">
            <span>${game.price} ر.س</span>
            <button class="cart-remove" data-remove="${game.id}">حذف</button>
          </div>
        </div>
      `;
      cartItemsEl.appendChild(row);
    });
  }

  const total = cart.reduce((sum, item) => {
    const game = games.find((g) => g.id === item.id);
    return sum + (game ? parseFloat(game.price) : 0);
  }, 0);

  if (cartTotalEl) cartTotalEl.textContent = total.toFixed(2);
  if (cartCountEl) cartCountEl.textContent = cart.length;
}

// 🔐 --- دالة جلب الألعاب (تم دمج منطق window.rtdb القديم مع الاحتياطي القياسي لضمان القراءة السليمة) ---
async function loadGames() {
  // التحقق من وجود الاتصال بالنظام القديم أو القياسي لـ الـ Realtime Database
  const currentRtdb = window.rtdb || (typeof rtdb !== "undefined" ? rtdb : null) || (typeof firebase !== "undefined" && firebase.database ? firebase.database() : null);
  
  if (!currentRtdb) {
    console
.error("خطأ: قاعدة بيانات Firebase (RTDB) غير معرفة بالملفات الحالية.");
    return;
  }
  
  currentRtdb.ref("games").on("value", (snapshot) => {
    games = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        games.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      games.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    filteredGames = [...games];
    renderGames(filteredGames);
    renderCart();
  }, (error) => {
    console.error("خطأ أثناء جلب الألعاب للموقع الأساسي:", error);
  });
}

// --- Event wiring ---
if (searchToggle && searchBar) {
  searchToggle.addEventListener("click", () => {
    searchBar.classList.toggle("hidden");
    if (!searchBar.classList.contains("hidden") && searchInput) {
      searchInput.focus();
    }
  });
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    filteredGames = games.filter((g) => {
      const gameName = g.name || g.title || "";
      return gameName.toLowerCase().includes(q);
    });
    renderGames(filteredGames);
  });
}

if (scrollToGamesBtn) {
  scrollToGamesBtn.addEventListener("click", () => {
    const sect = document.getElementById("gamesSection");
    if (sect) sect.scrollIntoView({ behavior: "smooth" });
  });
}

document.querySelectorAll(".category-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    const cat = btn.dataset.category;
    filteredGames = games.filter((g) => g.category === cat);
    renderGames(filteredGames);
  });
});

if (gamesGrid) {
  gamesGrid.addEventListener("click", (e) => {
    const addId = e.target.dataset.add;
    const card = e.target.closest(".game-card");
    if (!card) return;
    const id = card.dataset.id;
    const game = games.find((g) => g.id === id);
    if (!game) return;

    if (addId) {
      cart.push({ id: game.id });
      renderCart();
    } else {
      selectedGame = game;
      const gameName = game.name || game.title || "لعبة تفاعلية";
      const gameImg = game.image || game.imageUrl || 'placeholder.png';

      if (modalImage) modalImage.src = gameImg;
      if (modalTitle) modalTitle.textContent = gameName;
      if (modalCategory) modalCategory.textContent = mapCategory(game.category);
      if (modalDescription) modalDescription.textContent = game.description;
      if (modalPrice) modalPrice.textContent = `${game.price} ر.س`;
      openModal(gameModal);
    }
  });
}

if (modalAddToCart) {
  modalAddToCart.addEventListener("click", () => {
    if (!selectedGame) return;
    cart.push({ id: selectedGame.id });
    renderCart();
    closeModal(gameModal);
  });
}

document.querySelectorAll(".close-modal").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.close;
    if (target === "gameModal") closeModal(gameModal);
    if (target === "cartPanel") closeModal(cartPanel);
    if (target === "loginModal") closeModal(loginModal);
    if (target === "registerModal") closeModal(registerModal);
  });
});

if (cartToggle && cartPanel) {
  cartToggle.addEventListener("click", () => {
    cartPanel.classList.toggle("hidden");
  });
}

// 🛒 --- ربط زر إتمام الشراء ببوابة دفع Stripe ---
if (checkoutToggle) {
  checkoutToggle.addEventListener("click", () => {
    if (!currentUser) {
      alert("الرجاء تسجيل الدخول أولاً لإتمام الطلب.");
      openModal(loginModal);
      return;
    }

    if (cart.length === 0) {
      alert("سلتك فارغة حالياً، يرجى إضافة لعبة أولاً.");
      return;
    }

    window.location.href = "https://buy.stripe.com/test_4gMdR229ve1TcgDbuZcfK00";
  });
}

if (closeCheckoutBtn) {
  closeCheckoutBtn.addEventListener("click", () => {
    closeModal(checkoutSection);
  });
}

if (loginToggle) {
  loginToggle.addEventListener("click", (e) => {
    e.stopPropagation(); 
    const currentAuth = window.auth || (typeof auth !== "undefined" ? auth : null) || (typeof firebase !== "undefined" ? firebase.auth() : null);
    if (!currentAuth) return;

    if (currentUser) {
      if (userDropdown) userDropdown.classList.toggle("hidden");
    } else {
      openModal(loginModal);
    }
  });
}

document.addEventListener("click", () => {
  if (userDropdown) userDropdown.classList.add("hidden");
});

if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    const currentAuth = window.auth || (typeof auth !== "undefined" ? auth : null) || (typeof firebase !== "undefined" ? firebase.auth() : null);
    if (!currentAuth) return;

    if (confirm("هل تريد تسجيل الخروج؟")) {
      currentAuth.signOut().then(() => {
        if (userDropdown) userDropdown.classList.add("hidden");
        alert("تم تسجيل الخروج بنجاح.");
      });
    }
  });
}

if (btnMyOrders) {
  btnMyOrders.addEventListener("click", (e) => {
    e.preventDefault();
    alert("قريباً: سيتم عرض ألعابك التفاعلية التي قمتِ بشرائها هنا! 🎮✨");
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginEmail.value.trim();
    const pass = loginPassword.value;
    const currentAuth = window.auth || (typeof auth !== "undefined" ? auth : null) || (typeof firebase !== "undefined" ? firebase.auth() : null);

    if (!currentAuth) return;

    try {
      await currentAuth.signInWithEmailAndPassword(email, pass);
      closeModal(loginModal);
      alert("مرحباً بعودتكِ مجدداً! 🎉");
    } catch (err) {
      alert("خطأ في تسجيل الدخول: " + err.message);
    }
  });
}

if (openRegister) {
  openRegister.addEventListener("click", () => {
    closeModal(loginModal);
    openModal(registerModal);
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = registerName.value.trim();
    const email = registerEmail.value.trim();
    const pass = registerPassword.value;
    const currentAuth = window.auth || (typeof auth !== "undefined" ? auth : null) || (typeof firebase !== "undefined" ? firebase.auth() : null);

    if (!currentAuth) return;

    if (pass.length < 6) {
      alert("عذراً، يجب أن تكون كلمة المرور من 6 خانات أو أكثر لحماية حسابك.");
      return;
    }

    try {
      const cred = await currentAuth.createUserWithEmailAndPassword(email, pass);
      await cred.user.updateProfile({ displayName: name });
      
      try {
        await cred.user.sendEmailVerification();
      } catch (verErr) {
        console.warn("تعذر إرسال بريد التحقق:", verErr);
      }

      alert("🎉 تم إنشاء حسابكِ بنجاح أهلاً بكِ في Rafqa!");
      updateHeaderUser(cred.user);
      closeModal(registerModal);
    } catch (err) {
      alert("حدث خطأ أثناء إنشاء الحساب: " + err.message);
    }
  });
}

if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", async () => {
    if (typeof firebase === "undefined") return;
    const currentAuth = window.auth || (typeof auth !== "undefined" ? auth : null) || (typeof firebase !== "undefined" ? firebase.auth() : null);
    if (!currentAuth) return;

    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await currentAuth.signInWithPopup(provider);
      closeModal(loginModal);
      alert("تم تسجيل الدخول عبر Google بنجاح! 🚀");
    } catch (err) {
      alert("فشل تسجيل الدخول بـ قوقل: " + err.message);
    }
  });
}

if (cartItemsEl) {
  cartItemsEl.addEventListener("click", (e) => {
    const removeId = e.target.dataset.remove;
    if (!removeId) return;
    cart = cart.filter((item) => item.id !== removeId);
    renderCart();
  });
}

function initializeAppLogic() {
  const currentAuth = window.auth || (typeof auth !== "undefined" ? auth : null) || (typeof firebase !== "undefined" ? firebase.auth() : null);

  if (currentAuth) {
    currentAuth.onAuthStateChanged((user) => {
      currentUser = user;
      updateHeaderUser(user);
    });
  }
  
  try {
    loadGames();
  } catch (error) {
    console.error("تعذر جلب الألعاب فوراً، جاري محاولة البناء الأساسي:", error);
  }

  renderCart();
}

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(initializeAppLogic, 400);
});
