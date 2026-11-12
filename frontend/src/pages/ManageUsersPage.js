import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../AppTheme.css';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import {
  addStaffUser,
  deleteCustomer,
  deleteStaffUser,
  errorMessage,
  fetchCustomers,
  fetchStaffUsers,
  updateStaffUser,
  validateStaffUser,
} from '../data/admin';
import { getCurrentUser, isStaffUser } from '../data/auth';

const EMPTY_STAFF = { username: '', name: '', email: '', password: '', isAdmin: false };

// manage users page
// admins can add, edit and delete staff and admins. staff can only look
function ManageUsersPage() {
  const user = getCurrentUser();

  let isAdmin = false;
  if (user !== null && user.role === 'ADMIN') {
    isAdmin = true;
  }

  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // the form: editing is null (no form), 'new' (adding) or the user being edited
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_STAFF);
  const [errors, setErrors] = useState({});

  async function loadUsers() {
    setStaff(await fetchStaffUsers());
    setCustomers(await fetchCustomers());
  }

  // load the users when the page opens
  useEffect(() => {
    async function load() {
      try {
        await loadUsers();
      } catch (err) {
        setError('Could not load the accounts. Check the API is running and log in again.');
      }
      setIsLoading(false);
    }

    if (isStaffUser(user)) {
      load();
    }
  }, []);

  function startAdding() {
    setEditing('new');
    setForm(EMPTY_STAFF);
    setErrors({});
    setMessage('');
  }

  function startEditing(staffUser) {
    setEditing(staffUser);
    setForm({ ...staffUser, password: '' });
    setErrors({});
    setMessage('');
  }

  function handleChange(event) {
    // checkboxes use "checked" instead of "value"
    if (event.target.type === 'checkbox') {
      setForm({ ...form, [event.target.id]: event.target.checked });
    } else {
      setForm({ ...form, [event.target.id]: event.target.value });
    }
  }

  async function handleSave(event) {
    event.preventDefault();

    const newErrors = validateStaffUser(form, editing === 'new');
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      if (editing === 'new') {
        await addStaffUser(form);
        setMessage(form.username + ' was added.');
      } else {
        await updateStaffUser(editing, form);
        setMessage('Changes to ' + form.username + ' were saved.');
      }
      setEditing(null);
      setError('');
      await loadUsers(); // reload so table shows the change
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleDelete(staffUser) {
    if (!window.confirm('Delete ' + staffUser.username + '? This cannot be undone.')) {
      return;
    }

    try {
      await deleteStaffUser(staffUser);
      setMessage(staffUser.username + ' was deleted.');
      setError('');
      await loadUsers();
    } catch (err) {
      // 409 = they're the "last updated by" on some products
      if (err.response && err.response.status === 409) {
        setError(staffUser.username + ' has updated items in the store so their account cannot be deleted.');
      } else {
        setError(errorMessage(err));
      }
    }
  }

  async function handleDeleteCustomer(customer) {
    if (!window.confirm('Delete the account for ' + customer.name + '? This cannot be undone.')) {
      return;
    }

    try {
      await deleteCustomer(customer);
      setMessage('The account for ' + customer.name + ' was deleted.');
      setError('');
      await loadUsers();
    } catch (err) {
      // 409 = they have orders
      if (err.response && err.response.status === 409) {
        setError(customer.name + ' has placed orders so their account cannot be deleted.');
      } else {
        setError(errorMessage(err));
      }
    }
  }

  // label + input + error message for the form
  function input(id, label, type) {
    return (
      <>
        <label className="form-label fw-semibold" htmlFor={id}>{label}</label>
        <input className={errors[id] ? 'form-control is-invalid' : 'form-control'} id={id} onChange={handleChange} type={type} value={form[id]} />
        {errors[id] && <div className="invalid-feedback">{errors[id]}</div>}
      </>
    );
  }

  let pageContent;

  if (!isStaffUser(user)) {
    pageContent = (
      <div className="alert alert-warning">
        This page is for store staff. Please <Link to="/login">log in with a staff account</Link>.
      </div>
    );
  } else if (isLoading) {
    pageContent = <p>Loading accounts...</p>;
  } else {
    pageContent = (
      <>
        {!isAdmin && <div className="alert alert-info">Staff can view accounts but only an admin can change them.</div>}
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        {/* staff and admins */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h4 mb-0">Staff and admins</h2>
          {isAdmin && <button className="btn btn-guild" onClick={startAdding} type="button">Add staff or admin</button>}
        </div>

        {isAdmin && editing !== null && (
          <form className="panel p-4 mb-4" noValidate onSubmit={handleSave}>
            <h3 className="h5">{editing === 'new' ? 'Add a staff member or admin' : 'Edit ' + editing.username}</h3>
            <div className="row g-3">
              <div className="col-md-6">{input('username', 'Username', 'text')}</div>
              <div className="col-md-6">{input('name', 'Full name', 'text')}</div>
              <div className="col-md-6">{input('email', 'Email (optional)', 'email')}</div>
              {/* password only when adding, the api can't hash a password on update */}
              {editing === 'new' && <div className="col-md-6">{input('password', 'Password', 'password')}</div>}
              <div className="col-12 form-check ms-2">
                <input checked={form.isAdmin} className="form-check-input" id="isAdmin" onChange={handleChange} type="checkbox" />
                <label className="form-check-label" htmlFor="isAdmin">Admin (can manage items and users)</label>
              </div>
            </div>
            <button className="btn btn-guild mt-3 me-2" type="submit">{editing === 'new' ? 'Add user' : 'Save changes'}</button>
            <button className="btn btn-outline-guild mt-3" onClick={() => setEditing(null)} type="button">Cancel</button>
          </form>
        )}

        <div className="table-responsive mb-5">
          <table className="table table-striped bg-white">
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {staff.map((staffUser) => (
                <tr key={staffUser.id}>
                  <td>{staffUser.username}</td>
                  <td>{staffUser.name}</td>
                  <td>{staffUser.email}</td>
                  <td>{staffUser.isAdmin ? 'Admin' : 'Staff'}</td>
                  {isAdmin && (
                    <td className="text-nowrap">
                      <button className="btn btn-sm btn-outline-guild me-2" onClick={() => startEditing(staffUser)} title={'Edit ' + staffUser.username} type="button">Edit</button>
                      {/* can't delete yourself */}
                      {staffUser.id !== user.id && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(staffUser)} title={'Delete ' + staffUser.username} type="button">Delete</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* customers */}
        <h2 className="h4 mb-3">Customers</h2>
        {/* TODO: editing customers from here didn't make it in, customers can update their own address */}
        <p className="small text-muted">Customer details can't be edited here yet.</p>
        <div className="table-responsive">
          <table className="table table-striped bg-white">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.address || 'Not saved'}</td>
                  {isAdmin && (
                    <td>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCustomer(customer)} title={'Delete ' + customer.name} type="button">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <main className="container py-5">
        <h1 className="display-6 fw-bold mb-4">{isAdmin ? 'Manage users' : 'View accounts'}</h1>
        {pageContent}
      </main>
      <Footer />
    </div>
  );
}

export default ManageUsersPage;
