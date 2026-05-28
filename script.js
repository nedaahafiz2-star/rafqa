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
const registerPhone = document.getElementById("registerPhone"); // حقل رقم الجوال الحقيقي
const googleLoginBtn = document.getElementById("googleLogin");

// عناصر القائمة المنسدلة الجديدة
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
  if (!el) return;
  el.classList.remove("hidden");
  // دعم كلا النظامين modal-overlay و modal
  el.style.display = "flex";
}

function closeModal(el) {
  if (!el) return;
  el.classList.add("hidden");
  el.style.display = "";
}

function updateHeaderUser(user) {
  if (!loginToggle) return;
  if (user) {
    loginToggle.textContent = user.displayName || (user.email ? user.email.split('@')[0] : "حسابي");
  } else {
    loginToggle.textContent = "تسجيل الدخول";
    if (userDropdown) userDropdown.classList.add("hidden");
  }
}

// --- Render functions ---
function renderGames(list) {
  if (!gamesGrid) return;
  gamesGrid.innerHTML = "";
  
  list.forEach((game) => {
    const card = document.createElement("article");
    card.className = "game-card";
    card.dataset.id = game.id;

    card.innerHTML = `
      <div class="game-thumb">
        <img src="${game.image}" alt="${game.name}">
      </div>
      <div class="game-body">
        <div class="game-title">${game.name}</div>
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
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="cart-item-thumb">
          <img src="${game.image}" alt="${game.name}">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-title">${game.name}</div>
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

// --- Firebase ---
async function loadGames() {
  const currentRtdb = window.rtdb || (typeof rtdb !== "undefined" ? rtdb : null);
  if (!currentRtdb) return;
  
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
    filteredGames = games.filter((g) =>
      g.name.toLowerCase().includes(q)
    );
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
      if (modalImage) modalImage.src = game.image;
      if (modalTitle) modalTitle.textContent = game.name;
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

    // ⚠️ استبدلي هذا الرابط برابط Stripe الحقيقي قبل النشر
    window.location.href = "https://buy.stripe.com/YOUR_REAL_STRIPE_LINK";
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
    const currentAuth = window.auth || (typeof auth !== "undefined" ? auth : null);
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
    const currentAuth = window.auth || (typeof auth !== "undefined" ? auth : null);
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

if (openRegister) {
  openRegister.addEventListener("click", () => {
    closeModal(loginModal);
    openModal(registerModal);
  });
}

// 🔐 ==========================================================================
// 🛠️ تفعيل وتعديل نموذج تسجيل الدخول برقم جوال أو إيميل حقيقي
// ==========================================================================
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    let userInput = loginEmail.value.trim();
    const pass = loginPassword.value;
    const currentAuth = window.auth || (typeof auth !== "undefined" ? auth : null);

    if (!currentAuth) return;

    // دعم تسجيل الدخول برقم الجوال أيضاً عبر تحويله إلى صيغة بريد إلكتروني افتراضية متطابقة مع التسجيل
    if (!userInput.includes("@")) {
      userInput = userInput + "@rafqa-store.com";
    }

    try {
      await currentAuth.signInWithEmailAndPassword(userInput, pass);
      closeModal(loginModal);
      alert("مرحباً بعودتكِ مجدداً إلى متجر رِفقة! 🎉🧡");
    } catch (err) {
      alert("خطأ في تسجيل الدخول: يرجى التحقق من صحة البيانات أو كلمة المرور.");
    }
  });
}

// 👤 ==========================================================================
// 🛠️ تفعيل وتعديل نموذج إنشاء حساب جديد بالكامل وبشكل حقيقي (مع الجوال)
// ==========================================================================
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = registerName.value.trim();
    const phone = registerPhone ? registerPhone.value.trim() : "";
    let email = registerEmail.value.trim();
    const pass = registerPassword.value;
    
    const currentAuth = window.auth || (typeof auth !== "undefined" ? auth : null);
    const currentDb = window.db || (typeof db !== "undefined" ? db : null);

    if (!currentAuth) return;

    // 1. التحقق من صحة وطول رقم الجوال الحقيقي لخدمة العملاء
    if (phone.length < 10) {
      alert("الرجاء إدخال رقم جوال حقيقي مكون من 10 خانات (مثال: 05xxxxxxxx).");
      return;
    }

    // 2. التحقق من طول كلمة المرور لأمان وحماية الحساب
    if (pass.length < 6) {
      alert("عذراً، يجب أن تكون كلمة المرور من 6 خانات أو أكثر لحماية حسابك.");
      return;
    }

    // 3. الحساب يُنشأ دائماً بالرقم بغض النظر عن الإيميل
    const realEmail = email; // نحفظ الإيميل الحقيقي في Firestore فقط
    email = phone + "@rafqa-store.com"; // هذا هو الحساب الفعلي دائماً

    try {
      // أ) إنشاء الحساب الفعلي داخل نظام الحسابات (Firebase Authentication)
      const cred = await currentAuth.createUserWithEmailAndPassword(email, pass);
      
      // ب) تحديث وتثبيت اسم العميل الظاهر بـ الهيدر
      await cred.user.updateProfile({ displayName: name });
      
      // جـ) حفظ بيانات العميل بالكامل (رقم الجوال الحقيقي والاسم والبريد) داخل الـ Database لتوثيق مشترياته
      if (currentDb) {
        await currentDb.collection("users").doc(cred.user.uid).set({
          uid: cred.user.uid,
          name: name,
          phone: phone,
          email: realEmail || "",
          createdAt: Date.now()
        });
      }

      alert("🎉 تم إنشاء حسابكِ بنجاح! أهلاً بكِ في عائلة Rafqa.");
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
    const currentAuth = window.auth || (typeof auth !== "undefined" ? auth : null);
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
  const currentAuth = window.auth || (typeof auth !== "undefined" ? auth : null);

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

// ننتظر Firebase يتهيأ فعلياً بدل setTimeout عشوائي
window.addEventListener("DOMContentLoaded", () => {
  let attempts = 0;
  const waitForFirebase = setInterval(() => {
    const currentAuth = window.auth || (typeof auth !== "undefined" ? auth : null);
    attempts++;
    if (currentAuth || attempts >= 30) {
      clearInterval(waitForFirebase);
      initializeAppLogic();
    }
  }, 100);
});
