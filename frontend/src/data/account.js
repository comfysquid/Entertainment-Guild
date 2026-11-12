import axios from 'axios';
import { logIn } from './auth';

const AUTH_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:3001/api/inft3050';

// sends the login cookie with the request so the api knows who we are
const options = { withCredentials: true };

// states for the address dropdown
export const STATES = [
  { code: 'ACT', name: 'Australian Capital Territory' },
  { code: 'NSW', name: 'New South Wales' },
  { code: 'NT', name: 'Northern Territory' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'WA', name: 'Western Australia' },
];

// checks an address form and returns an object of error messages, if it's empty the address is ok
export function validateAddress(form) {
  const errors = {};

  // phone is optional but if there is one it has to be 10 numbers starting with 0
  let phone = '';
  if (form.phone) {
    phone = form.phone.replace(/\s/g, ''); // take out spaces
  }
  if (phone !== '' && !/^0\d{9}$/.test(phone)) {
    errors.phone = 'Enter a 10 digit Australian number starting with 0.';
  }

  // street needs a number and a name
  if (form.street.trim() === '') {
    errors.street = 'Enter your street address.';
  } else if (!/\d/.test(form.street) || !/[a-zA-Z]/.test(form.street)) {
    errors.street = 'Street address needs a number and a street name, e.g. 377 Ring Road.';
  }

  if (form.suburb.trim() === '') {
    errors.suburb = 'Enter your suburb.';
  }

  if (form.state === '') {
    errors.state = 'Choose your state.';
  }

  // postcode is 4 numbers
  if (!/^\d{4}$/.test(form.postcode.trim())) {
    errors.postcode = 'Postcode must be 4 numbers, e.g. 2308.';
  }

  return errors;
}

// business scenario 3: create a customer account
// steps: check email is free -> add to Patrons -> log in -> save address in TO (table)
export async function registerCustomer(form) {
  const email = form.email.trim();

  // patronLookup gives 404 if nobody has this email yet
  let emailTaken = true;
  try {
    await axios.get(AUTH_URL + '/patronLookup', { params: { email: email } });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      emailTaken = false;
    } else {
      throw error; // something else went wrong (e.g. api not running)
    }
  }
  if (emailTaken) {
    const error = new Error('That email already has an account. Try logging in instead.');
    error.isDuplicate = true;
    throw error;
  }

  // the api salts and hashes the password
  await axios.post(API_URL + '/Patrons', { Email: email, Name: form.name.trim(), HashPW: form.password }, options);

  // log in as the new customer so we're allowed to save their address
  const user = await logIn(email, form.password, false);

  // TO table holds the customer's contact details
  await axios.post(API_URL + '/TO', {
    PatronId: user.id,
    Email: email,
    PhoneNumber: form.phone.replace(/\s/g, ''),
    StreetAddress: form.street.trim(),
    Suburb: form.suburb.trim(),
    State: form.state,
    PostCode: Number(form.postcode),
  }, options);

  return user;
}

// gets the logged in customer's details (Patrons) and contact details (TO)
// the api only lets a customer see their own rows
export async function fetchMyDetails(patronId) {
  // fields = only the columns I need, so password hash and card details aren't sent
  const patronResponse = await axios.get(API_URL + '/Patrons/' + patronId, {
    withCredentials: true,
    params: { fields: 'UserID,Email,Name' },
  });

  const contactResponse = await axios.get(API_URL + '/TO', {
    withCredentials: true,
    params: {
      where: '(PatronId,eq,' + patronId + ')',
      fields: 'CustomerID,PatronId,Email,PhoneNumber,StreetAddress,PostCode,Suburb,State',
    },
  });

  // a customer should only have one TO row
  let contact = null;
  if (contactResponse.data.list.length > 0) {
    contact = contactResponse.data.list[0];
  }

  return { patron: patronResponse.data, contact: contact };
}

// turns a TO row into form values (form needs empty strings not null)
export function rowToAddress(contact) {
  if (!contact) {
    return { phone: '', street: '', suburb: '', state: '', postcode: '' };
  }

  let postcode = '';
  if (contact.PostCode) {
    postcode = String(contact.PostCode);
  }

  return {
    phone: contact.PhoneNumber || '',
    street: contact.StreetAddress || '',
    suburb: contact.Suburb || '',
    state: contact.State || '',
    postcode: postcode,
  };
}

// saves a new address to the customer's TO row
export async function saveMyAddress(contact, form) {
  await axios.patch(API_URL + '/TO/' + contact.CustomerID, {
    PhoneNumber: form.phone.replace(/\s/g, ''),
    StreetAddress: form.street.trim(),
    Suburb: form.suburb.trim(),
    State: form.state,
    PostCode: Number(form.postcode),
  }, options);
}

// makes a new TO row for a customer who doesn't have one yet (used at CHECKOUT !)
export async function createMyContact(user, form) {
  await axios.post(API_URL + '/TO', {
    PatronId: user.id,
    Email: user.email,
    StreetAddress: form.street.trim(),
    Suburb: form.suburb.trim(),
    State: form.state,
    PostCode: Number(form.postcode),
  }, options);
}

// business scenario 4: account recovery
// there's no email server so the api sends the reset token back to us
export async function requestPasswordReset(email) {
  const response = await axios.post(AUTH_URL + '/requestPasswordReset', { email: email.trim() });
  return response.data;
}

export async function resetPassword(token, password) {
  const response = await axios.post(AUTH_URL + '/resetPassword', { token: token, password: password });
  return response.data;
}
