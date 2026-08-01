// TICKET-ADV123 — React Hook Form + Yup validation.
import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { withAuth } from '@components/withAuth.jsx';
import { api } from '@services/apiService.js';

const schema = yup.object({
  tradeRef:       yup.string().matches(/^[A-Z]{3}-\d{8}-\d{4}$/, 'Must match format AAA-YYYYMMDD-NNNN').required('Trade reference is required'),
  instrumentId:   yup.number().typeError('Instrument ID must be a number').integer('Must be an integer').positive('Must be positive').required('Required'),
  counterpartyId: yup.number().typeError('Counterparty ID must be a number').integer('Must be an integer').positive('Must be positive').required('Required'),
  assetClass:     yup.string().oneOf(['EQUITY','FX','BOND','DERIVATIVE'], 'Invalid asset class').required('Asset class is required'),
  side:           yup.string().oneOf(['BUY','SELL'], 'Invalid side').required('Side is required'),
  quantity:       yup.number().typeError('Quantity must be a positive number').positive('Must be positive').required('Required'),
  price:          yup.number().typeError('Price must be a positive number').positive('Must be positive').required('Required'),
  tradeDate:      yup.string().required('Trade date is required'),
});

function AddTrade() {
  const [serverError, setServerError] = React.useState(null);
  const [successMsg, setSuccessMsg] = React.useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } =
        useForm({ resolver: yupResolver(schema), mode: 'onBlur' });

  async function onSubmit(values) {
    try {
      setServerError(null);
      setSuccessMsg(null);
      await api.createTrade(values);
      setSuccessMsg('Trade created successfully!');
      reset();
    } catch (err) {
      setServerError(err.message || 'Failed to create trade');
    }
  }

  return (
    <section>
      <h2>Add trade</h2>
      {successMsg && <div className="form-success">{successMsg}</div>}
      {serverError && <div role="alert" className="form-server-error">{serverError}</div>}
      
      <form onSubmit={handleSubmit(onSubmit)} className="trade-form" noValidate>
        <label>Trade ref   <input {...register('tradeRef')} placeholder="EQU-20260603-0001" /></label>
        {errors.tradeRef && <p className="form-error" role="alert">{errors.tradeRef.message}</p>}

        <label>Instrument id   <input type="number" {...register('instrumentId')} placeholder="1" /></label>
        {errors.instrumentId && <p className="form-error" role="alert">{errors.instrumentId.message}</p>}

        <label>Counterparty id <input type="number" {...register('counterpartyId')} placeholder="1" /></label>
        {errors.counterpartyId && <p className="form-error" role="alert">{errors.counterpartyId.message}</p>}

        <label>Asset class    <select {...register('assetClass')}>
          <option value="">Select...</option>
          <option value="EQUITY">EQUITY</option>
          <option value="FX">FX</option>
          <option value="BOND">BOND</option>
          <option value="DERIVATIVE">DERIVATIVE</option>
        </select></label>
        {errors.assetClass && <p className="form-error" role="alert">{errors.assetClass.message}</p>}

        <label>Side <select {...register('side')}>
          <option value="">Select...</option>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select></label>
        {errors.side && <p className="form-error" role="alert">{errors.side.message}</p>}

        <label>Quantity  <input type="number" step="any" {...register('quantity')} placeholder="100.00" /></label>
        {errors.quantity && <p className="form-error" role="alert">{errors.quantity.message}</p>}

        <label>Price     <input type="number" step="any" {...register('price')} placeholder="150.25" /></label>
        {errors.price && <p className="form-error" role="alert">{errors.price.message}</p>}

        <label>Trade date<input type="date" {...register('tradeDate')} /></label>
        {errors.tradeDate && <p className="form-error" role="alert">{errors.tradeDate.message}</p>}

        <button disabled={isSubmitting} type="submit">Submit</button>
      </form>
    </section>
  );
}

export default withAuth(AddTrade);
