import React from 'react';
import { STATES } from '../data/account';

// the address inputs (phone, street, suburb, state, postcode)
// used on the register, account and checkout pages so i didn't have to copy them 3 times
// props: form = the values, errors = error messages, onChange = runs when an input changes
function AddressFields({ form, errors, onChange, showPhone = true }) {
  // makes a label + input + error message
  // the input's id is the same as the field name so onChange knows what to update
  function field(id, label, placeholder) {
    return (
      <>
        <label className="form-label fw-semibold" htmlFor={id}>{label}</label>
        <input
          className={errors[id] ? 'form-control is-invalid' : 'form-control'}
          id={id}
          onChange={onChange}
          placeholder={placeholder}
          type="text"
          value={form[id]}
        />
        {errors[id] && <div className="invalid-feedback">{errors[id]}</div>}
      </>
    );
  }

  return (
    <div className="row g-3">
      {showPhone && <div className="col-md-6">{field('phone', 'Phone (optional)', 'e.g. 0412345678')}</div>}

      <div className="col-12">{field('street', 'Street address', 'e.g. 377 Ring Road')}</div>

      <div className="col-md-5">{field('suburb', 'Suburb', '')}</div>

      {/* state is a dropdown so it can't be spelt wrong */}
      <div className="col-md-4">
        <label className="form-label fw-semibold" htmlFor="state">State</label>
        <select className={errors.state ? 'form-select is-invalid' : 'form-select'} id="state" onChange={onChange} value={form.state}>
          <option value="">Choose...</option>
          {STATES.map((state) => (
            <option key={state.code} value={state.code}>{state.name} ({state.code})</option>
          ))}
        </select>
        {errors.state && <div className="invalid-feedback">{errors.state}</div>}
      </div>

      <div className="col-md-3">{field('postcode', 'Postcode', 'e.g. 2308')}</div>
    </div>
  );
}

export default AddressFields;
