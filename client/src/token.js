// Session token + "token was rejected" hook, shared by the real API and the mock one
const TOKEN_KEY = 'et-token';

const read = (storage) => {
  try {
    return storage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getToken = () => read(sessionStorage) || read(localStorage);

// remember=true keeps the login across browser restarts, false only for this tab
export const setToken = (token, remember = true) => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    if (token) (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  } catch {
    // storage unavailable: the session just will not survive a reload
  }
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};
export const notifyUnauthorized = () => onUnauthorized();
