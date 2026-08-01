// TICKET-ADV123 — React Hook Form + Yup validation.
import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { withAuth } from '@components/withAuth.jsx';
import { useToast } from '@context/ToastContext.jsx';
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
  const navigate = useNavigate();
  const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } =
        useForm({ resolver: yupResolver(schema), mode: 'onBlur' });

  async function onSubmit(values) {
    try {
      await api.createTrade(values);
      toast.success('Trade created successfully');
      reset();
      navigate('/trades');
    } catch (err) {
      toast.error(err.message || 'Failed to create trade');
    }
  }

  return (
    <section className="trades-page">
      <div className="page-header">
        <div>
          <h1>Add Trade</h1>
          <p>Create a new trade ticket with the same controls and validation rules.</p>
        </div>
      </div>

      <section className="page-card form-card">
        <div className="section-card__header section-card__header--tight">
          <div>
            <h2>Trade Details</h2>
            <p>Enter the instrument, counterparty, and execution data.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="trade-form" noValidate>
        <div className="trade-form__field">
          <label>Trade ref</label>
          <input {...register('tradeRef')} placeholder="EQU-20260603-0001" />
          {errors.tradeRef && <p className="form-error" role="alert">{errors.tradeRef.message}</p>}
        </div>

        <div className="trade-form__field">
          <label>Instrument id</label>
          <input type="number" {...register('instrumentId')} placeholder="1" />
          {errors.instrumentId && <p className="form-error" role="alert">{errors.instrumentId.message}</p>}
        </div>

        <div className="trade-form__field">
          <label>Counterparty id</label>
          <input type="number" {...register('counterpartyId')} placeholder="1" />
          {errors.counterpartyId && <p className="form-error" role="alert">{errors.counterpartyId.message}</p>}
        </div>

        <div className="trade-form__field">
          <label>Asset class</label>
          <select {...register('assetClass')}>
            <option value="">Select...</option>
            <option value="EQUITY">EQUITY</option>
            <option value="FX">FX</option>
            <option value="BOND">BOND</option>
            <option value="DERIVATIVE">DERIVATIVE</option>
          </select>
          {errors.assetClass && <p className="form-error" role="alert">{errors.assetClass.message}</p>}
        </div>

        <div className="trade-form__field">
          <label>Side</label>
          <select {...register('side')}>
            <option value="">Select...</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
          {errors.side && <p className="form-error" role="alert">{errors.side.message}</p>}
        </div>

        <div className="trade-form__field">
          <label>Quantity</label>
          <input type="number" step="any" {...register('quantity')} placeholder="100.00" />
          {errors.quantity && <p className="form-error" role="alert">{errors.quantity.message}</p>}
        </div>

        <div className="trade-form__field">
          <label>Price</label>
          <input type="number" step="any" {...register('price')} placeholder="150.25" />
          {errors.price && <p className="form-error" role="alert">{errors.price.message}</p>}
        </div>

        <div className="trade-form__field">
          <label>Trade date</label>
          <input type="date" {...register('tradeDate')} />
          {errors.tradeDate && <p className="form-error" role="alert">{errors.tradeDate.message}</p>}
        </div>

        <div className="trade-form__actions">
          <button disabled={isSubmitting} type="submit">Submit</button>
        </div>
        </form>
      </section>
    </section>
  );
}

export default withAuth(AddTrade);
