// إعدادات مشروع Firebase الحقيقية والسرية لموقع Rafqa
const firebaseConfig = {
  apiKey: "AIzaSyAOh6ErrBuwe1xea2dOoFCDTnXXip4jE8",
  authDomain: "rafqa-bc5f4.firebaseapp.com",
  databaseURL: "https://rafqa-bc5f4-default-rtdb.firebaseio.com",
  projectId: "rafqa-bc5f4",
  storageBucket: "rafqa-bc5f4.firebasestorage.app",
  messagingSenderId: "61389146599",
  appId: "1:61389146599:web:61bbadf915bf2dbe7e9a56",
  measurementId: "G-S8CG0BGJNX"
};

// تشغيل وربط السيرفر بالطريقة المتوافقة عالمياً
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// تعريف المتغيرات عالمياً لتقرأها كل الصفحات (الرئيسية ولوحة التحكم) فوراً
db = firebase.firestore();
rtdb = firebase.database();
auth = firebase.auth();