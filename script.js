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

// العناصر الجديدة والمحدثة لتسجيل الدخول برقم الجوال
const loginPhone = document.getElementById("loginPhone");
const loginOtpLabel = document.getElementById("loginOtpLabel");
const loginOtp = document.getElementById("loginOtp");
const loginErrorMsg = document.getElementById("loginErrorMsg");
const authSubmitBtn = document.getElementById("authSubmitBtn");

const registerModal = document.getElementById("registerModal");
const openRegister = document.getElementById("openRegister");
const registerForm = document.getElementById("registerForm");
const registerName = document.getElementById("registerName");
const registerPhone = document.getElementById("registerPhone");
const registerErrorMsg = document.getElementById("registerErrorMsg");

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

// تعقب حالة نموذج تسجيل الدخول (إرسال الكود أولاً ثم التحقق منه)
let loginStep = "send_code"; 
// مصفوفة وهمية للأرقام المسجلة مسبقاً (سيتم الاعتماد على قاعدة بيانات Firebase لاحقاً)
let mockRegisteredPhones = ["0500000000", "0555555555"]; 

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
    loginToggle.textContent = user.displayName || user.phoneNumber || "حسابي";
  } else {
    loginToggle.textContent = "تسجيل الدخول";
    if (userDropdown) userDropdown.classList.add("hidden");
  }
}

// إعادة تعيين نموذج تسجيل الدخول لحالته الأولى عند الإغلاق أو التبديل
function resetLoginForm() {
  loginStep = "send_code";
  if (loginPhone) { loginPhone.value = ""; loginPhone.disabled = false; }
  if (loginOtp) loginOtp.value = "";
  if (loginOtpLabel) loginOtpLabel.classList.add("hidden");
  if (loginErrorMsg) loginErrorMsg.classList.add("hidden");
  if (authSubmitBtn) authSubmitBtn.textContent = "إرسال كود التحقق";
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
    if (target === "loginModal") { closeModal(loginModal); resetLoginForm(); }
    if (target === "registerModal") { closeModal(registerModal); if (registerErrorMsg) registerErrorMsg.classList.add("hidden"); }
  });
});

if (cartToggle && cartPanel) {
  cartToggle.addEventListener("click", () => {
    cartPanel.classList.toggle("hidden");
  });
}

// 🛒 --- التعديل رقم 2: منع الشراء بدون حساب وإظهار تنبيه ملون بالأحمر في السلة ---
if (checkoutToggle) {
  checkoutToggle.addEventListener("click", () => {
    // إزالة أي تنبيه أحمر قديم داخل السلة لكي لا يتكرر
    const oldNotice = document.getElementById("cartAuthNotice");
    if (oldNotice) oldNotice.remove();

    if (!currentUser) {
      // بناء عنصر التنبيه الأحمر برمجياً ليوضع فوق الزر مباشرة
      const notice = document.createElement("div");
      notice.id = "cartAuthNotice";
      notice.className = "error-text";
      notice.style.marginBottom = "12px";
      notice.innerHTML = `<i class="fas fa-exclamation-circle"></i> يرجى تسجيل الدخول أولاً لإتمام عملية الشراء!`;
      
      checkoutToggle.before(notice);
      
      // فتح نافذة تسجيل الدخول مباشرة لمساعدته
      openModal(loginModal);
      return;
    }

    if (cart.length === 0) {
      alert("سلتك فارغة حالياً، يرجى إضافة لعبة أولاً.");
      return;
    }

    // التوجيه إلى رابط الدفع في Stripe بعد تخطي شروط الأمان
    window.location.href = "https://buy.stripe.com/test_4gMdR229ve1TcgDbuZcfK00";
  });
}

if (closeCheckoutBtn) {
  closeCheckoutBtn.addEventListener("click", () => {
    closeModal(checkoutSection);
  });
}

// التحكم بالقائمة المنسدلة لحساب المستخدم
if (loginToggle) {
  loginToggle.addEventListener("click", (e) => {
    e.stopPropagation(); 
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
        // إزالة التنبيهات عند خروج المستخدم
        const oldNotice = document.getElementById("cartAuthNotice");
        if (oldNotice) oldNotice.remove();
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

// 🔐 --- التعديل رقم 1 و 3: نموذج الدخول المطور والتحقق من الأخطاء برقم الجوال ---
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (loginErrorMsg) loginErrorMsg.classList.add("hidden"); // تصفير الأخطاء السابقة

    const phoneVal = loginPhone.value.trim();

    // المرحلة الأولى: التحقق من رقم الجوال وإرسال كود التحقق
    if (loginStep === "send_code") {
      // فحص هل الرقم مسجل لدينا أم لا؟
      if (!mockRegisteredPhones.includes(phoneVal)) {
        if (loginErrorMsg) {
          loginErrorMsg.textContent = "❌ رقم الجوال هذا غير مسجل لدينا، يرجى إنشاء حساب جديد أولاً.";
          loginErrorMsg.classList.remove("hidden");
        }
        return;
      }

      // محاكاة إرسال الرسالة النصية (SMS) بنجاح
      alert("تم إرسال كود التحقق بنجاح إلى جوالك! (الكود التجريبي للتجربة هو: 1234)");
      
      // فتح حقل كود التحقق وتعديل الزر
      if (loginOtpLabel) loginOtpLabel.classList.remove("hidden");
      if (loginPhone) loginPhone.disabled = true;
      if (authSubmitBtn) authSubmitBtn.textContent = "تأكيد كود التحقق";
      loginStep = "verify_code";
    } 
    // المرحلة الثانية: مطابقة كود التحقق المدخل من العميل
    else if (loginStep === "verify_code") {
      const otpVal = loginOtp.value.trim();

      if (otpVal === "1234") { // كود التحقق التجريبي المستقر
        // محاكاة مستخدم مسجل عبر الجوال
        currentUser = {
          displayName: "مشتري رافق",
          phoneNumber: phoneVal,
          uid: "mock_user_" + Date.now()
        };
        
        updateHeaderUser(currentUser);
        closeModal(loginModal);
        resetLoginForm();
        
        // حذف رسالة التنبيه الحمراء من السلة فور تسجيل الدخول بنجاح
        const oldNotice = document.getElementById("cartAuthNotice");
        if (oldNotice) oldNotice.remove();
        
        alert("مرحباً بعودتكِ مجدداً إلى Rafqa! 🎉");
      } else {
        // إذا الكود المدخل غير صحيح
        if (loginErrorMsg) {
          loginErrorMsg.textContent = "❌ كود التحقق غير صحيح، يرجى إعادة التأكد والمحاولة مرة أخرى.";
          loginErrorMsg.classList.remove("hidden");
        }
      }
    }
  });
}

if (openRegister) {
  openRegister.addEventListener("click", () => {
    closeModal(loginModal);
    resetLoginForm();
    openModal(registerModal);
  });
}

// 🔐 --- نموذج إنشاء الحساب برقم الجوال والاسم وحماية الأخطاء بالأحمر ---
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (registerErrorMsg) registerErrorMsg.classList.add("hidden");

    const name = registerName.value.trim();
    const phone = registerPhone.value.trim();

    // فحص بسيط لسلامة رقم الجوال المدخل
    if (phone.length < 10) {
      if (registerErrorMsg) {
        registerErrorMsg.textContent = "❌ يرجى إدخال رقم جوال صحيح مكون من 10 خانات (مثل: 05xxxxxxxx).";
        registerErrorMsg.classList.remove("hidden");
      }
      return;
    }

    // إضافة الرقم الجديد للمصفوفة لكي يقبله تسجيل الدخول لاحقاً
    if (!mockRegisteredPhones.includes(phone)) {
      mockRegisteredPhones.push(phone);
    }

    // محاكاة إنشاء وتفعيل الحساب فوراً بالاسم ورقم الجوال
    currentUser = {
      displayName: name,
      phoneNumber: phone,
      uid: "mock_user_" + Date.now()
    };

    updateHeaderUser(currentUser);
    closeModal(registerModal);
    if (registerForm) registerForm.reset();
    
    const oldNotice = document.getElementById("cartAuthNotice");
    if (oldNotice) oldNotice.remove();

    alert(`🎉 أهلاً بكِ يا ${name}! تم إنشاء حسابكِ بنجاح في متجر Rafqa.`);
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
      if (user) {
        currentUser = user;
        updateHeaderUser(user);
      }
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
