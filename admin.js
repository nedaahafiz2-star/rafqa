// --- عناصر لوحة التحكم (DOM Elements) ---
const adminForm = document.getElementById("addGameForm");
const gameNameInput = document.getElementById("gameName");
const gameCategoryInput = document.getElementById("gameCategory");
const gamePriceInput = document.getElementById("gamePrice");
const gameDescInput = document.getElementById("gameDescription");
const gameImageInput = document.getElementById("gameImage"); // حقل ملف الصورة
const adminGamesList = document.getElementById("adminGamesList");

// دالة لماب أسماء التصنيفات
function mapCategoryName(cat) {
  switch (cat) {
    case "eid": return "ألعاب العيد";
    case "brain": return "ألعاب الذكاء";
    case "summer": return "ألعاب الذكاء الاصطناعي";
    case "edu": return "ألعاب تعليمية";
    default: return "عام";
  }
}

// 🔄 جلب وعرض الألعاب الحالية في لوحة التحكم مع زر الحذف
function loadAdminGames() {
  if (!adminGamesList) return;
  
  rtdb.ref("games").on("value", (snapshot) => {
    adminGamesList.innerHTML = "";
    if (!snapshot.exists()) {
      adminGamesList.innerHTML = `<p style="color:#7a8194; padding:10px;">لا توجد ألعاب مرفوعة حالياً.</p>`;
      return;
    }

    snapshot.forEach((childSnapshot) => {
      const gameId = childSnapshot.key;
      const gameData = childSnapshot.val();
      const gameName = gameData.name || gameData.title || "لعبة بدون اسم";

      const item = document.createElement("div");
      item.className = "games-list-item";
      item.innerHTML = `
        <div>
          <strong>${gameName}</strong> - 
          <span style="color:#ff7a00; font-size:0.85rem;">${mapCategoryName(gameData.category)}</span> 
          (${gameData.price} ر.س)
        </div>
        <button class="danger-btn" data-id="${gameId}">حذف ✕</button>
      `;
      adminGamesList.appendChild(item);
    });
  });
}

// 🗑️ تفعيل زر الحذف للألعاب من السيرفر
if (adminGamesList) {
  adminGamesList.addEventListener("click", async (e) => {
    if (e.target.classList.contains("danger-btn")) {
      const gameId = e.target.dataset.id;
      if (confirm("هل أنتِ متأكدة من رغبتكِ في حذف هذه اللعبة نهائياً من المتجر؟")) {
        try {
          await rtdb.ref(`games/${gameId}`).remove();
          alert("تم حذف اللعبة بنجاح! 🗑️");
        } catch (error) {
          alert("حدث خطأ أثناء الحذف: " + error.message);
        }
      }
    }
  });
}

// 📤 حدث حفظ ورفع لعبة جديدة مع تحويل الصورة إلى Base64 لتخزينها مباشرة في الـ RTDB بمرونة
if (adminForm) {
  adminForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const name = gameNameInput.value.trim();
    const category = gameCategoryInput.value;
    const price = gamePriceInput.value.trim();
    const description = gameDescInput.value.trim();
    const imageFile = gameImageInput.files[0];

    if (!name || !price || !imageFile) {
      alert("الرجاء تعبئة كافة الحقول واختيار صورة اللعبة!");
      return;
    }

    // قارئ ملف الصورة لتحويلها إلى رابط نصي مدمج قابل للحفظ بالسيرفر
    const reader = new FileReader();
    reader.onload = async function(event) {
      const base64Image = event.target.result;

      try {
        await rtdb.ref("games").push({
          name: name,
          category: category,
          price: parseFloat(price),
          description: description,
          image: base64Image,
          createdAt: Date.now()
        });

        alert("تم حفظ اللعبة ورفعها للموقع بنجاح! 🎉🎮");
        adminForm.reset();
      } catch (error) {
        alert("حدث خطأ أثناء الحفظ بالسيرفر: " + error.message);
      }
    };
    
    reader.readAsDataURL(imageFile);
  });
}

// تشغيل جلب قائمة الألعاب فور فتح الصفحة
window.addEventListener("DOMContentLoaded", () => {
  if (typeof rtdb !== "undefined") {
    loadAdminGames();
  }
});
