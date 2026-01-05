import { useState, useEffect } from 'react';
import './ApplicationForm.css';

interface Application {
  id?: number;
  companyName: string;
  positionTitle: string;
  status: 'applied' | 'interview' | 'offer' | 'rejected';
  appliedDate: string;
  notes?: string;
}

interface ApplicationFormProps {
  application?: Application | null;
  onSubmit: (application: {
    companyName: string;
    positionTitle: string;
    status: 'applied' | 'interview' | 'offer' | 'rejected';
    appliedDate: string;
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const ApplicationForm = ({ application, onSubmit, onCancel }: ApplicationFormProps) => {
  const [formData, setFormData] = useState<Omit<Application, 'id'>>({
    companyName: '',
    positionTitle: '',
    status: 'applied',
    appliedDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (application) {
      setFormData({
        companyName: application.companyName,
        positionTitle: application.positionTitle,
        status: application.status,
        appliedDate: application.appliedDate,
        notes: application.notes || '',
      });
    }
  }, [application]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="application-form-overlay">
      <div className="application-form">
        <h2>{application ? 'Edit Application' : 'Add New Application'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="companyName">Company Name *</label>
            <input
              type="text"
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="positionTitle">Position Title *</label>
            <input
              type="text"
              id="positionTitle"
              value={formData.positionTitle}
              onChange={(e) => setFormData({ ...formData, positionTitle: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status *</label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Application['status'] })}
              required
            >
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="appliedDate">Applied Date *</label>
            <input
              type="date"
              id="appliedDate"
              value={formData.appliedDate}
              onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button">
              {application ? 'Update' : 'Add'} Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;

