import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../AppTheme.css';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { addItem, deleteItem, errorMessage, fetchItemOptions, fetchManagedItems, updateItem, validateItem } from '../data/admin';
import { getCurrentUser, isStaffUser } from '../data/auth';

const MAX_ROWS = 50;

const EMPTY_ITEM = { name: '', author: '', description: '', genre: '', source: '', subgenre: '', price: '', quantity: '' };

// manage items page (business scenario 2)
// admins can add, edit and delete. staff can only look
function ManageItemsPage() {
  const user = getCurrentUser();

  let isAdmin = false;
  if (user !== null && user.role === 'ADMIN') {
    isAdmin = true;
  }

  const [items, setItems] = useState([]);
  const [lookups, setLookups] = useState({ genres: [], sources: [], subgenres: {} }); // for the dropdowns
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // the form: editing is null (no form), 'new' (adding) or the item being edited
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [errors, setErrors] = useState({});

  // load everything when the page opens
  useEffect(() => {
    async function load() {
      try {
        setLookups(await fetchItemOptions());
        setItems(await fetchManagedItems());
      } catch (err) {
        setError('Could not load the items. Check the API is running.');
      }
      setIsLoading(false);
    }

    if (isStaffUser(user)) {
      load();
    }
  }, []);

  // open the form for a new item
  function startAdding() {
    setEditing('new');
    setForm(EMPTY_ITEM);
    setErrors({});
    setMessage('');
  }

  // open the form with an item's details filled in
  function startEditing(item) {
    setEditing(item);
    setForm(item);
    setErrors({});
    setMessage('');
    window.scrollTo(0, 0);
  }

  function handleChange(event) {
    const updated = { ...form, [event.target.id]: event.target.value };
    // formats and subgenres belong to a category, so clear them if the category changes
    if (event.target.id === 'genre') {
      updated.source = '';
      updated.subgenre = '';
    }
    setForm(updated);
  }

  async function handleSave(event) {
    event.preventDefault();

    const newErrors = validateItem(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      if (editing === 'new') {
        await addItem(form, user.name);
        setMessage('"' + form.name + '" was added to the store.');
      } else {
        await updateItem(editing, form, user.name);
        setMessage('Changes to "' + form.name + '" were saved.');
      }
      setEditing(null);
      setError('');
      setItems(await fetchManagedItems()); // reload so the list shows the change
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleDelete(item) {
    if (!window.confirm('Delete "' + item.name + '"? This cannot be undone.')) {
      return;
    }

    try {
      await deleteItem(item, items);
      setMessage('"' + item.name + '" was deleted.');
      setError('');
      setItems(await fetchManagedItems());
    } catch (err) {
      // 409 = it's in an old order
      if (err.response && err.response.status === 409) {
        setError('"' + item.name + '" is in past orders so it cannot be deleted. Set its quantity to 0 instead.');
      } else {
        setError(errorMessage(err));
      }
    }
  }

  // search by name or author
  const text = search.trim().toLowerCase();
  const filtered = items.filter((item) => {
    return item.name.toLowerCase().includes(text) || item.author.toLowerCase().includes(text);
  });
  const shownItems = filtered.slice(0, MAX_ROWS);

  // only show the formats for the chosen category
  const formats = lookups.sources.filter((source) => String(source.Genre) === form.genre);

  // and only the subgenres for the chosen category
  let subgenres = [];
  if (form.genre !== '' && lookups.subgenres[form.genre]) {
    subgenres = lookups.subgenres[form.genre];
  }

  // gets the format name for the table
  function formatName(sourceId) {
    const source = lookups.sources.find((s) => String(s.sourceid) === sourceId);
    if (source) {
      return source.Source_name;
    }
    return '';
  }

  // label + input + error message for the form
  function input(id, label) {
    return (
      <>
        <label className="form-label fw-semibold" htmlFor={id}>{label}</label>
        <input className={errors[id] ? 'form-control is-invalid' : 'form-control'} id={id} onChange={handleChange} value={form[id]} />
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
    pageContent = <p>Loading items...</p>;
  } else {
    pageContent = (
      <>
        {!isAdmin && <div className="alert alert-info">Staff can view items but only an admin can change them.</div>}
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        {/* add / edit form */}
        {isAdmin && editing !== null && (
          <form className="panel p-4 mb-4" noValidate onSubmit={handleSave}>
            <h2 className="h4">{editing === 'new' ? 'Add a new item' : 'Edit "' + editing.name + '"'}</h2>
            <div className="row g-3">
              <div className="col-md-6">{input('name', 'Name')}</div>
              <div className="col-md-6">{input('author', 'Author / director / studio')}</div>

              <div className="col-md-6">
                <label className="form-label fw-semibold" htmlFor="genre">Category</label>
                <select className={errors.genre ? 'form-select is-invalid' : 'form-select'} id="genre" onChange={handleChange} value={form.genre}>
                  <option value="">Choose...</option>
                  {lookups.genres.map((genre) => (
                    <option key={genre.genreID} value={String(genre.genreID)}>{genre.Name}</option>
                  ))}
                </select>
                {errors.genre && <div className="invalid-feedback">{errors.genre}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold" htmlFor="source">Format</label>
                <select className={errors.source ? 'form-select is-invalid' : 'form-select'} id="source" onChange={handleChange} value={form.source}>
                  <option value="">Choose...</option>
                  {formats.map((source) => (
                    <option key={source.sourceid} value={String(source.sourceid)}>{source.Source_name}</option>
                  ))}
                </select>
                {errors.source && <div className="invalid-feedback">{errors.source}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold" htmlFor="subgenre">Subgenre (optional)</label>
                <select className="form-select" id="subgenre" onChange={handleChange} value={form.subgenre}>
                  <option value="">None</option>
                  {subgenres.map((subgenre) => (
                    <option key={subgenre.subGenreID} value={String(subgenre.subGenreID)}>{subgenre.Name}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">{input('price', 'Price ($)')}</div>
              <div className="col-md-6">{input('quantity', 'Quantity in stock')}</div>

              <div className="col-12">
                <label className="form-label fw-semibold" htmlFor="description">Description</label>
                <textarea className="form-control" id="description" onChange={handleChange} rows="3" value={form.description} />
              </div>
            </div>
            <button className="btn btn-guild mt-3 me-2" type="submit">{editing === 'new' ? 'Add item' : 'Save changes'}</button>
            <button className="btn btn-outline-guild mt-3" onClick={() => setEditing(null)} type="button">Cancel</button>
          </form>
        )}

        {/* search box and add button */}
        <div className="d-flex gap-2 align-items-end mb-3">
          <div className="flex-grow-1">
            <label className="form-label fw-semibold" htmlFor="item-search">Find an item</label>
            <input className="form-control" id="item-search" onChange={(event) => setSearch(event.target.value)} placeholder="Name or author" value={search} />
          </div>
          {isAdmin && <button className="btn btn-guild" onClick={startAdding} type="button">Add item</button>}
        </div>

        <p className="small text-muted">Showing {shownItems.length} of {filtered.length} items. Search to find others.</p>

        {/* table of items */}
        <div className="table-responsive">
          <table className="table table-striped bg-white">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Format</th>
                <th>Price</th>
                <th>Stock</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {shownItems.map((item) => (
                <tr key={item.itemId}>
                  <td>{item.itemId}</td>
                  <td><Link to={'/products/' + item.itemId}>{item.name}</Link></td>
                  <td>{formatName(item.source)}</td>
                  <td>${Number(item.price).toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  {isAdmin && (
                    <td className="text-nowrap">
                      <button className="btn btn-sm btn-outline-guild me-2" onClick={() => startEditing(item)} title={'Edit ' + item.name} type="button">Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item)} title={'Delete ' + item.name} type="button">Delete</button>
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
        <h1 className="display-6 fw-bold mb-4">Manage items</h1>
        {pageContent}
      </main>
      <Footer />
    </div>
  );
}

export default ManageItemsPage;
