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

// العناصر الجديدة والمحدثة للنظام الشامل (البريد، كلمة المرور، الجوال)
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginErrorMsg = document.getElementById("loginErrorMsg");

const registerModal = document.getElementById("registerModal");
const openRegister = document.getElementById("openRegister");
const registerForm = document.getElementById("registerForm");
const registerName = document.getElementById("registerName");
const registerEmail = document.getElementById("registerEmail");
const registerPhone = document.getElementById("registerPhone");
const registerPassword = document.getElementById("registerPassword");
const registerErrorMsg = document.getElementById("registerErrorMsg");

const openLogin = document.getElementById("openLogin");
const googleLogin = document.getElementById("googleLogin");

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

// دالة ذكية للحصول على خدمات Firebase Auth و Database بالإصدارين الحديث والقديم لضمان عدم توقف الموقع
function getFirebaseAuth() {
  if (typeof firebase !== "undefined" && firebase.auth) {
    return firebase.auth();
  }
  return window.auth || null;
}

function firebaseGetDatabase() {
  if (typeof firebase !== "undefined" && firebase.database) {
    return firebase.database();
  }
  return window.rtdb || (typeof rtdb !== "undefined" ? rtdb : null);
}

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

// فتح النوافذ المنبثقة
function openModal(el) {
  if (el) el.classList.remove("hidden");
}

// إغلاق النوافذ المنبثقة
function closeModal(el) {
  if (el) el.classList.add("hidden");
}

// تحديث الهيدر باسم المستخدم أو كلمة "حسابي" عند تسجيل الدخول
function updateHeaderUser(user) {
  if (!loginToggle) return;
  if (user) {
    loginToggle.textContent = user.displayName || "حسابي";
  } else {
    loginToggle.textContent = "تسجيل الدخول";
    if (userDropdown) userDropdown.classList.add("hidden");
  }
}

// إعادة تعيين الحقول وإخفاء رسائل الخطأ
function resetAuthForms() {
  if (loginForm) loginForm.reset();
  if (registerForm) registerForm.reset();
  if (loginErrorMsg) loginErrorMsg.classList.add("hidden");
  if (registerErrorMsg) registerErrorMsg.classList.add("hidden");
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

// --- Firebase Data Fetching ---
async function loadGames() {
  const currentRtdb = firebaseGetDatabase();
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
    if (target === "loginModal") { closeModal(loginModal); resetAuthForms(); }
    if (target === "registerModal") { closeModal(registerModal); resetAuthForms(); }
  });
});

if (cartToggle && cartPanel) {
  cartToggle.addEventListener("click", () => {
    cartPanel.classList.toggle("hidden");
  });
}

if (checkoutToggle) {
  checkoutToggle.addEventListener("click", () => {
    const oldNotice = document.getElementById("cartAuthNotice");
    if (oldNotice) oldNotice.remove();

    if (!currentUser) {
      const notice = document.createElement("div");
      notice.id = "cartAuthNotice";
      notice.className = "error-text";
      notice.style.marginBottom = "12px";
      notice.innerHTML = `⚠️ يرجى تسجيل الدخول أولاً لإتمام عملية الشراء!`;
      
      checkoutToggle.before(notice);
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
    const currentAuth = getFirebaseAuth();
    if (!currentAuth) return;

    if (confirm("هل تريد تسجيل الخروج؟")) {
      currentAuth.signOut().then(() => {
        if (userDropdown) userDropdown.classList.add("hidden");
        const oldNotice = document.getElementById("cartAuthNotice");
        if (oldNotice) oldNotice.remove();
        alert("تم تسجيل الخروج بنجاح.");
      }).catch((error) => {
        console.error("خطأ أثناء تسجيل الخروج:", error);
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

// 🔐 --- ربط الـ Authentication الفعلي بـ Firebase المحدث ---

// 1. تسجيل الدخول الذكي (رقم الجوال أو البريد الإلكتروني + كلمة المرور)
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (loginErrorMsg) loginErrorMsg.classList.add("hidden");

    let inputVal = loginEmail.value.trim();
    const passwordVal = loginPassword.value;
    const currentAuth = getFirebaseAuth();

    if (!currentAuth) {
      alert("خطأ: لم يتم تحميل خدمة التحقق من الفايربيس بعد.");
      return;
    }

    // 💡 التحقق الذكي: إذا كان المدخل يبدأ بـ 05 ويتكون من أرقام فقط، نعتبره رقم جوال ونقوم بتهيئته تلقائياً
    if (/^[0-9]+$/.test(inputVal) && inputVal.startsWith("05")) {
      inputVal = `${inputVal}@rafqa-phone.com`;
    }

    try {
      await currentAuth.signInWithEmailAndPassword(inputVal, passwordVal);
      
      closeModal(loginModal);
      resetAuthForms();
      
      const oldNotice = document.getElementById("cartAuthNotice");
      if (oldNotice) oldNotice.remove();
      
      alert("مرحباً بعودتكِ مجدداً إلى Rafqa! 🎉");
    } catch (error) {
      console.error("خطأ تسجيل الدخول:", error);
      if (loginErrorMsg) {
        loginErrorMsg.classList.remove("hidden");
        if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
          loginErrorMsg.textContent = "❌ رقم الجوال/البريد الإلكتروني أو كلمة المرور غير صحيحة.";
        } else {
          loginErrorMsg.textContent = "❌ تعذر تسجيل الدخول، يرجى مراجعة البيانات والمحاولة مرة أخرى.";
        }
      }
    }
  });
}

// 2. إنشاء حساب جديد شامل (الاسم، البريد، الجوال، كلمة المرور)
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (registerErrorMsg) registerErrorMsg.classList.add("hidden");

    const nameVal = registerName.value.trim();
    let emailVal = registerEmail.value.trim();
    const phoneVal = registerPhone.value.trim();
    const passwordVal = registerPassword.value;
    
    const currentAuth = getFirebaseAuth();
    if (!currentAuth) return;

    // التحقق من صحة رقم الجوال السعودي
    if (phoneVal.length < 10 || !phoneVal.startsWith("05")) {
      if (registerErrorMsg) {
        registerErrorMsg.textContent = "❌ يرجى إدخال رقم جوال سعودي صحيح مكون من 10 خانات ويبدأ بـ 05.";
        registerErrorMsg.classList.remove("hidden");
      }
      return;
    }

    // إذا لم تدخل المستخدمة بريداً إلكترونياً، ننشئ لها بريداً تلقائياً مربوطاً برقم جوالها للفايربيس
    if (!emailVal) {
      emailVal = `${phoneVal}@rafqa-phone.com`;
    }

    try {
      const userCredential = await currentAuth.createUserWithEmailAndPassword(emailVal, passwordVal);
      const user = userCredential.user;

      if (user.updateProfile) {
        await user.updateProfile({
          displayName: nameVal,
          photoURL: phoneVal 
        });
      }

      // تحديث فوري للحالة المحلية للـ Header والـ User بعد الحفظ مباشرة لتعمل فوراً
      currentUser = currentAuth.currentUser || user;
      updateHeaderUser(currentUser);

      closeModal(registerModal);
      resetAuthForms();
      
      const oldNotice = document.getElementById("cartAuthNotice");
      if (oldNotice) oldNotice.remove();

      alert(`🎉 أهلاً بكِ يا ${nameVal}! تم إنشاء حسابكِ بنجاح في متجر Rafqa.`);
    } catch (error) {
      console.error("خطأ أثناء إنشاء الحساب:", error);
      if (registerErrorMsg) {
        registerErrorMsg.classList.remove("hidden");
        if (error.code === "auth/email-already-in-use") {
          registerErrorMsg.textContent = "❌ رقم الجوال أو البريد الإلكتروني هذا مسجل بالفعل مسبقاً.";
        } else if (error.code === "auth/weak-password") {
          registerErrorMsg.textContent = "❌ كلمة المرور ضعيفة جداً، يجب أن تكون من 6 خانات على الأقل.";
        } else {
          registerErrorMsg.textContent = "❌ حدث خطأ أثناء تسجيل الحساب، يرجى المحاولة لاحقاً.";
        }
      }
    }
  });
}

// التبديل السلس بين النوافذ المنبثقة
if (openRegister) {
  openRegister.addEventListener("click", (e) => {
    e.preventDefault();
    closeModal(loginModal);
    resetAuthForms();
    openModal(registerModal);
  });
}

if (openLogin) {
  openLogin.addEventListener("click", (e) => {
    e.preventDefault();
    closeModal(registerModal);
    resetAuthForms();
    openModal(loginModal);
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

// --- مراقب وموثق حالة الدخول المباشر ---
function initializeAppLogic() {
  const currentAuth = getFirebaseAuth();

  if (currentAuth) {
    currentAuth.onAuthStateChanged((user) => {
      currentUser = user;
      updateHeaderUser(user);
      if (user) {
        const oldNotice = document.getElementById("cartAuthNotice");
        if (oldNotice) oldNotice.remove();
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
  setTimeout(initializeAppLogic, 500); // زيادة مهلة الانتظار لضمان استقرار قراءة الفايربيس الجديد
});
