
export const isAuthenticated = () => {
  return localStorage.getItem("isLoggedIn") === "true";
};

export const login = (username: string) => {
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("currentUser", username);
};

export const logout = () => {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("currentUser");
};

export const getCurrentUser = () => {
  return localStorage.getItem("currentUser") || "";
};
