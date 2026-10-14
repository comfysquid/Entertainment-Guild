import axios from 'axios';

const AUTH_URL = 'http://localhost:3001';
const USER_KEY = 'eg-user';

// The server sends back a httpOnly login cookie.
// withCredentials lets the browser save and send that cookie.
const options = { withCredentials: true };

// Customers log in with their email (Patrons table),
// staff and admins log in with their username (User table).
export async function logIn(username, password, isStaff) {
  let url = AUTH_URL + '/patronLogin';
  if (isStaff) {
    url = AUTH_URL + '/login';
  }

  const response = await axios.post(url, { username: username, password: password }, options);

  // Server returns user info but not password
  const user = {
    id: response.data.id,
    name: response.data.username,
    email: response.data.email,
    role: response.data.role,
  };
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('auth-changed'));
  return user;
}

export async function logOut() {
  try {
    await axios.post(AUTH_URL + '/logout', {}, options);
  } catch (error) {
    // Even if the server down can still log out on this side
  }
  sessionStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('auth-changed'));
}

// Returns the logged in user, or null if nobody is logged in
export function getCurrentUser() {
  try {
    const saved = sessionStorage.getItem(USER_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
  }
  return null;
}

// For staff/admin users & conditional rendering (no cart)
export function isStaffUser(user) {
  return user !== null && (user.role === 'ADMIN' || user.role === 'STAFF');
}
