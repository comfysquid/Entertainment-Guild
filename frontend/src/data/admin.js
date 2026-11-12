import axios from 'axios';

const API_URL = 'http://localhost:3001/api/inft3050';
const options = { withCredentials: true };

// gets every row from a table
// fields is optional, it lets us skip columns like the password hash
async function getAllRows(table, fields) {
  const params = { limit: 1000 };
  if (fields) {
    params.fields = fields;
  }
  const response = await axios.get(API_URL + '/' + table, { withCredentials: true, params: params });
  return response.data.list;
}

// turns an api error into a message for the admin
export function errorMessage(error) {
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    return 'You do not have permission to do that. Log in again with an admin account.';
  }
  if (error.response && error.response.status === 409) {
    return 'This is linked to other records (e.g. past orders) so it cannot be deleted.';
  }
  return 'Something went wrong. Check the API is running and try again.';
}

// items (business scenario 2) 

// books, movies and games each have their own subgenre table, so we keep them by genre id (1, 2, 3)
export async function fetchItemOptions() {
  const genres = await getAllRows('Genre');
  const sources = await getAllRows('Source');
  const subgenres = {
    1: await getAllRows('BookGenre'),
    2: await getAllRows('MovieGenre'),
    3: await getAllRows('GameGenre'),
  };
  return { genres: genres, sources: sources, subgenres: subgenres };
}

// subgenre is optional, so send null if none was picked
function subgenreValue(form) {
  if (form.subgenre === '') {
    return null;
  }
  return Number(form.subgenre);
}

// one row for each Stocktake item, with its Product details so we can fill in the form
export async function fetchManagedItems() {
  const stockItems = await getAllRows('Stocktake');
  const products = await getAllRows('Product');
  const items = [];

  for (const stockItem of stockItems) {
    const product = products.find((p) => p.ID === stockItem.ProductId);
    if (!product) {
      continue; // skip stock with no product
    }

    // form inputs need strings, not numbers or null
    items.push({
      itemId: stockItem.ItemId,
      productId: product.ID,
      name: product.Name || '',
      author: product.Author || '',
      description: product.Description || '',
      genre: String(product.Genre || ''),
      subgenre: String(product.subGenre || ''),
      source: String(stockItem.SourceId || ''),
      price: String(stockItem.Price || ''),
      quantity: String(stockItem.Quantity || 0),
    });
  }

  return items;
}

// checks the item form before saving
export function validateItem(form) {
  const errors = {};

  if (form.name.trim() === '') {
    errors.name = 'Enter the item name.';
  }
  if (form.genre === '') {
    errors.genre = 'Choose a category.';
  }
  if (form.source === '') {
    errors.source = 'Choose a format.';
  }
  // price like 19.99
  if (!/^\d+(\.\d{1,2})?$/.test(form.price.trim()) || Number(form.price) <= 0) {
    errors.price = 'Price must be a number greater than 0, e.g. 19.99.';
  }
  // quantity is a whole number
  if (!/^\d+$/.test(form.quantity.trim())) {
    errors.quantity = 'Quantity must be a whole number, 0 or more.';
  }

  return errors;
}

// adding an item = a new Product row, then a Stocktake row that points to it
// LastUpdatedBy has to be a real username from User table
export async function addItem(form, username) {
  const productResponse = await axios.post(API_URL + '/Product', {
    Name: form.name.trim(),
    Author: form.author.trim(),
    Description: form.description.trim(),
    Genre: Number(form.genre),
    SubGenre: subgenreValue(form),
    LastUpdatedBy: username,
    LastUpdated: new Date().toISOString(),
  }, options);

  await axios.post(API_URL + '/Stocktake', {
    ProductId: productResponse.data.ID, // id of the product we just made
    SourceId: Number(form.source),
    Price: Number(form.price),
    Quantity: Number(form.quantity),
  }, options);
}

// editing = update the Product row and the Stocktake row
export async function updateItem(item, form, username) {
  await axios.patch(API_URL + '/Product/' + item.productId, {
    Name: form.name.trim(),
    Author: form.author.trim(),
    Description: form.description.trim(),
    Genre: Number(form.genre),
    SubGenre: subgenreValue(form),
    LastUpdatedBy: username,
    LastUpdated: new Date().toISOString(),
  }, options);

  await axios.patch(API_URL + '/Stocktake/' + item.itemId, {
    SourceId: Number(form.source),
    Price: Number(form.price),
    Quantity: Number(form.quantity),
  }, options);
}

// deletes the Stocktake row, and the Product too if nothing else uses it
// if the item is in an old order the api says 409 and nothing gets deleted
export async function deleteItem(item, allItems) {
  await axios.delete(API_URL + '/Stocktake/' + item.itemId, options);

  // is this product sold in any other format?
  let usedElsewhere = false;
  for (const other of allItems) {
    if (other.productId === item.productId && other.itemId !== item.itemId) {
      usedElsewhere = true;
    }
  }

  if (!usedElsewhere) {
    await axios.delete(API_URL + '/Product/' + item.productId, options);
  }
}

// Users
// staff and admins are in the User table
export async function fetchStaffUsers() {
  const users = await getAllRows('User', 'UserID,UserName,Email,Name,IsAdmin');
  const result = [];
  for (const user of users) {
    result.push({
      id: user.UserID,
      username: user.UserName || '',
      email: user.Email || '',
      name: user.Name || '',
      isAdmin: user.IsAdmin === true,
    });
  }
  return result;
}

// customers are in Patrons, their address is in TO
export async function fetchCustomers() {
  const patrons = await getAllRows('Patrons', 'UserID,Email,Name');
  // card details in TO are never asked for
  const contacts = await getAllRows('TO', 'CustomerID,PatronId,PhoneNumber,StreetAddress,PostCode,Suburb,State');

  const result = [];
  for (const patron of patrons) {
    const contact = contacts.find((c) => c.PatronId === patron.UserID);

    let address = '';
    let phone = '';
    let contactId = null; // needed to delete the TO row
    if (contact) {
      contactId = contact.CustomerID;
    }
    if (contact && contact.StreetAddress) {
      address = contact.StreetAddress + ', ' + contact.Suburb + ' ' + contact.State + ' ' + contact.PostCode;
    }
    if (contact && contact.PhoneNumber) {
      phone = contact.PhoneNumber;
    }

    result.push({ id: patron.UserID, email: patron.Email || '', name: patron.Name || '', phone: phone, address: address, contactId: contactId });
  }
  return result;
}

export function validateStaffUser(form, isNew) {
  const errors = {};
  if (!/^[A-Za-z0-9_.]{3,50}$/.test(form.username.trim())) {
    errors.username = 'Username must be 3-50 letters, numbers, dots or underscores.';
  }
  if (form.name.trim() === '') {
    errors.name = 'Enter their name.';
  }
  if (form.email.trim() !== '' && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  // only need a password when making a new user
  if (isNew && form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  return errors;
}

// only admins can do these, the api stops staff writing to the User table
export async function addStaffUser(form) {
  await axios.post(API_URL + '/User', {
    UserName: form.username.trim(),
    Name: form.name.trim(),
    Email: form.email.trim(),
    IsAdmin: form.isAdmin,
    HashPW: form.password, // the api hashes this
  }, options);
}

// note: no password here because the api doesn't hash passwords when updating
export async function updateStaffUser(user, form) {
  await axios.patch(API_URL + '/User/' + user.id, {
    UserName: form.username.trim(),
    Name: form.name.trim(),
    Email: form.email.trim(),
    IsAdmin: form.isAdmin,
  }, options);
}

export async function deleteStaffUser(user) {
  await axios.delete(API_URL + '/User/' + user.id, options);
}

// deleting a customer: the TO row has to go first because it points at the Patrons row
// if the customer has orders the api says 409 and nothing gets deleted
export async function deleteCustomer(customer) {
  if (customer.contactId) {
    await axios.delete(API_URL + '/TO/' + customer.contactId, options);
  }
  await axios.delete(API_URL + '/Patrons/' + customer.id, options);
}
