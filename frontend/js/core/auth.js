function isLoggedIn(){ return !!window.API.getAccessToken() && !!window.API.getUser(); }
function currentUser(){ return window.API.getUser(); }
function isAdmin(){ const u = currentUser(); return !!u && u.role === "admin"; }
function logout(){
  window.API.clearTokens();
  location.hash = "#/login";
}
window.AUTH = { isLoggedIn, currentUser, isAdmin, logout };
