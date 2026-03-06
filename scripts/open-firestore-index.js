// Opens the Firebase Console to create the chats composite index (one-click then "Create").
const url = "https://console.firebase.google.com/v1/r/project/uptura-leads/firestore/indexes?create_composite=Ckpwcm9qZWN0cy91cHR1cmEtbGVhZHMvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2NoYXRzL2luZGV4ZXMvXxABGhUKEXBhcnRpY2lwYW50RW1haWxzGAEaDQoJdXBkYXRlZEF0EAIaDAoIX19uYW1lX18QAg";
const { execSync } = require("child_process");
const cmd = process.platform === "win32" ? `start "" "${url}"` : process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`;
execSync(cmd, { stdio: "inherit", shell: true });
console.log("Opened Firebase Console. Click 'Create index' on the page.");
