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
const loginErrorMsg = document.getElementById("loginErrorMsg");

const registerModal = document.getElementById("registerModal");
const openRegister = document.getElementById("openRegister");
const openLogin = document.getElementById("openLogin");
const registerForm = document.getElementById("registerForm");
const registerName = document.getElementById("registerName");
const registerPhone = document.getElementById("registerPhone");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const registerErrorMsg = document.getElementById("registerErrorMsg");

const googleLoginBtn = document.getElementById("googleLogin");

// عناصر القائمة المنسدلة للـ User
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
    case "eid": return "ألعاب العيد";
    case "brain": return "ألعاب الذكاء";
    case "summer": return "ألعاب الذكاء الاصطناعي";
    case "edu": return "ألعاب تعليمية";
    default: return "ألعاب تفاعلية";
  }
}

function openModal(el) { if (el) el.classList.remove("hidden"); }
function closeModal(el) { if (el) el.classList.add("hidden"); }

function updateHeaderUser(user) {
  if (!loginToggle) return;
  if (user) {
    loginToggle.textContent = user.displayName || "حسابي 👤";
  } else {
    loginToggle.textContent = "تسجيل الدخول";
    if (userDropdown) userDropdown.classList.add("hidden");
  }
}

// --- وظائف عرض الألعاب بجودة وسرعة عالية ---
function renderGames(list) {
  if (!gamesGrid) return;
  gamesGrid.innerHTML = "";
  
  if (list.length === 0) {
    gamesGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px;">لا توجد ألعاب معروضة حالياً في هذا القسم.</p>`;
    if (gamesCount) gamesCount.textContent = "0 لعبة";
    return;
  }

  list.forEach((game) => {
    const gameName = game.name || game.title || "لعبة تفاعلية";
    const gameImg = game.image || 'placeholder.png';

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

  if (gamesCount) gamesCount.textContent = `${list.length} لعبة`;
}

function renderCart() {
  if (!cartItemsEl) return;
  cartItemsEl.innerHTML = "";
  
  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<p style="font-size:0.85rem;color:#6b7280;padding:10px;text-align:center;">السلة فارغة حالياً.</p>`;
  } else {
    cart.forEach((item) => {
      const game = games.find((g) => g.id === item.id);
      if (!game) return;
      
      const gameName = game.name || game.title;
      const gameImg = game.image || 'placeholder.png';

      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="cart-item-thumb"><img src="${gameImg}" alt="${gameName}"></div>
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

// 🔐 دالة استدعاء الألعاب من السيرفر
async function loadGames() {
  const currentRtdb = window.rtdb || (typeof rtdb !== "undefined" ? rtdb : null);
  if (!currentRtdb) return;
  
  currentRtdb.ref("games").on("value", (snapshot) => {
    games = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        games.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      games.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    filteredGames = [...games];
    renderGames(filteredGames);
    renderCart();
  });
}

// --- الأحداث والربط (Event Wiring) ---
if (searchToggle && searchBar) {
  searchToggle.addEventListener("click", () => {
    searchBar.classList.toggle("hidden");
    if (!searchBar.classList.contains("hidden") && searchInput) searchInput.focus();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    filteredGames = games.filter(g => (g.name || "").toLowerCase().includes(q));
    renderGames(filteredGames);
  });
}

if (scrollToGamesBtn) {
  scrollToGamesBtn.addEventListener("click", () => {
    document.getElementById("gamesSection")?.scrollIntoView({ behavior: "smooth" });
  });
}

document.querySelectorAll(".category-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    const cat = btn.dataset.category;
    filteredGames = games.filter(g => g.category === cat);
    renderGames(filteredGames);
  });
});

if (gamesGrid) {
  gamesGrid.addEventListener("click", (e) => {
    const addId = e.target.dataset.add;
    const card = e.target.closest(".game-card");
    if (!card) return;
    const game = games.find(g => g.id === card.dataset.id);
    if (!game) return;

    if (addId) {
      cart.push({ id: game.id });
      renderCart();
    } else {
      selectedGame = game;
      if (modalImage) modalImage.src = game.image || 'placeholder.png';
      if (modalTitle) modalTitle.textContent = game.name;
      if (modalCategory) modalCategory.textContent = mapCategory(game.category);
      if (modalDescription) modalDescription.textContent = game.description || "لا يوجد وصف متوفر.";
      if (modalPrice) modalPrice.textContent = `${game.price} ر.س`;
      openModal(gameModal);
    }
  });
}

if (modalAddToCart) {
  modalAddToCart.addEventListener("click", () => {
    if (selectedGame) { cart.push({ id: selectedGame.id }); renderCart(); closeModal(gameModal); }
  });
}

// إغلاق النوافذ المنبثقة بمرونة
document.querySelectorAll(".close-modal").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.close;
    if (target === "gameModal") closeModal(gameModal);
    if (target === "cartPanel") closeModal(cartPanel);
    if (target === "loginModal") closeModal(loginModal);
    if (target === "registerModal") closeModal(registerModal);
    if (target === "checkoutSection") closeModal(checkoutSection);
  });
});

if (cartToggle && cartPanel) {
  cartToggle.addEventListener("click", () => cartPanel.classList.toggle("hidden"));
}

if (openRegister) {
  openRegister.addEventListener("click", (e) => { e.preventDefault(); closeModal(loginModal); openModal(registerModal); });
}
if (openLogin) {
  openLogin.addEventListener("click", (e) => { e.preventDefault(); closeModal(registerModal); openModal(loginModal); });
}

// 🛒 زر إتمام الشراء الدفع
if (checkoutToggle) {
  checkoutToggle.addEventListener("click", () => {
    if (!currentUser) { alert("الرجاء تسجيل الدخول أولاً لإتمام طلبكِ."); openModal(loginModal); return; }
    if (cart.length === 0) { alert("سلتكِ فارغة حالياً!"); return; }
    window.location.href = "https://buy.stripe.com/test_4gMdR229ve1TcgDbuZcfK00";
  });
}

if (loginToggle) {
  loginToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (currentUser) userDropdown?.classList.toggle("hidden");
    else openModal(loginModal);
  });
}
document.addEventListener("click", () => userDropdown?.classList.add("hidden"));

if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    const currentAuth = window.auth || (typeof auth !== "undefined" ? auth : null);
    if (currentAuth && confirm("هل تودين تسجيل الخروج؟")) currentAuth.signOut();
  });
}

if (btnMyOrders) {
  btnMyOrders.addEventListener("click", (e) => { e.preventDefault(); alert("قريباً: عرض الألعاب التي تم شراؤها! 🎮✨"); });
}

// 🔐 نموذج تسجيل الدخول (مرونة الدخول برقم جوال كـ وهمي أو ببريد حقيقي)
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    let userVal = loginEmail.value.trim();
    const pass = loginPassword.value;
    const currentAuth = window.auth || (typeof auth !== "undefined" ? auth : null);

    if (!currentAuth) return;
    if (loginErrorMsg) loginErrorMsg.classList.add("hidden");

    // إذا تم إدخال رقم جوال نقوم بتحويله لبريد وهمي لتسهيل الدخول
    if (!userVal.includes("@")) {
      userVal = userVal + "@rafqa-store.com";
    }

    try {
      await currentAuth.signInWithEmailAndPassword(userVal, pass);
      closeModal(loginModal);
      alert("مرحباً بعودتكِ إلى متجر رِفقة! 🎉");
    } catch (err) {
      if (loginErrorMsg) {
        loginErrorMsg.textContent = "خطأ: تأكدي من البيانات أو كلمة المرور بشكل صحيح.";
        loginErrorMsg.classList.remove("hidden");
      }
    }
  });
}

// 👤 نموذج إنشاء الحساب الجديد والمطوّر بالكامل
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = registerName.value.trim();
    const phone = registerPhone.value.trim();
    let email = registerEmail.value.trim();
    const pass = registerPassword.value;
    const currentAuth = window.auth || (typeof auth !== "undefined" ? auth : null);
    const currentDb = window.db || (typeof db !== "undefined" ? db : null);

    if (!currentAuth) return;
    if (registerErrorMsg) registerErrorMsg.classList.add("hidden");

    if (phone.length < 10) {
      alert("الرجاء إدخال رقم جوال صحيح مكون من 10 خانات.");
      return;
    }

    // إذا لم يكتب المستخدم إيميل نقوم بصناعة إيميل تلقائي له باستخدام رقم جواله ليتم تفعيل الحساب فوراً
    if (!email) {
      email = phone + "@rafqa-store.com";
    }

    try {
      const cred = await currentAuth.createUserWithEmailAndPassword(email, pass);
      // تحديث اسم المستخدم الظاهري في حسابات الفايربيس
      await cred.user.updateProfile({ displayName: name });
      
      // حفظ بيانات المستخدم الإضافية (رقم الجوال والاسم والبريد) بقاعدة البيانات لحفظ حقوق مشترياته
      if (currentDb) {
        await currentDb.collection("users").doc(cred.user.uid).set({
          uid: cred.user.uid,
          name: name,
          phone: phone,
          email: email,
          createdAt: Date.now()
        });
      }

      alert("🎉 مرحباً بكِ يا " + name + "! تم إنشاء حسابكِ وتفعيله بنجاح في متجر Rafqa.");
      closeModal(registerModal);
    } catch (err) {
      if (registerErrorMsg) {
        registerErrorMsg.textContent = "فشل إنشاء الحساب: " + err.message;
        registerErrorMsg.classList.remove("hidden");
      }
    }
  });
}

if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", async () => {
    if (typeof firebase === "undefined") return;
    const currentAuth = window.auth || (typeof auth !== "undefined" ? auth : null);
    if (!currentAuth) return;

    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await currentAuth.signInWithPopup(provider);
      closeModal(loginModal);
      alert("تم تسجيل الدخول بواسطة Google بنجاح! 🚀");
    } catch (err) {
      alert("عذراً، فشل تسجيل الدخول بقوقل: " + err.message);
    }
  });
}

if (cartItemsEl) {
  cartItemsEl.addEventListener("click", (e) => {
    const removeId = e.target.dataset.remove;
    if (!removeId) return;
    cart = cart.filter(item => item.id !== removeId);
    renderCart();
  });
}

function initializeAppLogic() {
  const currentAuth = window.auth || (typeof auth !== "undefined" ? auth : null);
  if (currentAuth) {
    currentAuth.onAuthStateChanged((user) => {
      currentUser = user;
      updateHeaderUser(user);
    });
  }
  loadGames();
  renderCart();
}

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(initializeAppLogic, 400);
});
