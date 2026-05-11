============================================
  EMRS — Emergency Medical Response System
  Final Version with Bilingual Support (EN/AR)
============================================

WHAT'S NEW:
-----------
✓ Language toggle button on every page
✓ Click 🌐 to switch English ↔ العربية
✓ Full RTL support for Arabic
✓ All text translated (login, dashboard, citizen, etc.)
✓ Cairo font for Arabic, Inter for English


HOW TO RUN:
-----------
1. Open the project folder in VS Code
2. Open terminal (Ctrl + `)
3. Run: npm install
4. Run: npm start
5. Browser opens at http://localhost:3000


LOGIN CREDENTIALS:
------------------
Admin Accounts (uppercase D and . required):
  Dr.Naser  /  1234
  Dr.Samy   /  1234

Hospital Staff:
  karim     /  1234
  israa     /  1234
  nour      /  1234
  nada      /  1234


WHERE TO FIND THE LANGUAGE BUTTON:
----------------------------------
• Landing page — top right
• Citizen portal — top right (header)
• All logged-in pages — bottom left of sidebar


FIREBASE:
---------
Already configured with your project:
  emrs-gaza
Data auto-seeds on first launch — no manual setup needed.

If hospitals/users don't appear:
1. Go to Firebase Console → Firestore → Rules
2. Paste this and Publish:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}


ENJOY YOUR FYP!
