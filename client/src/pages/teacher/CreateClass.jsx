import React, { useState } from 'react';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CreateClass = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', date: '', time: '', duration: 60, description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const scheduleLocal = new Date(`${formData.date}T${formData.time}`);
    if (scheduleLocal < new Date()) { toast.error('Class schedule must be in the future'); return; }
    const duration = parseInt(formData.duration);
    if (duration < 15 || duration > 300) { toast.error('Duration must be between 15 and 300 minutes'); return; }
    
    setLoading(true);
    try {
      await api.post('/classes', {
        title: formData.title, schedule: scheduleLocal.toISOString(), duration, description: formData.description
      });
      toast.success('Class scheduled securely. Jitsi room created.');
      navigate('/teacher/manage-classes');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule class');
    } finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Schedule a Live Class</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Create a new session. A secure Jitsi room will automatically be generated.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Class Topic / Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Introduction to Phrasal Verbs" />
          </div>

          <div className="form-grid-2col" style={{ marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Date *</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Time *</label>
              <input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} required />
            </div>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Duration (Minutes) *</label>
            <input type="number" min="15" max="300" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} required />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
            <textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Optional overview of the class contents..." />
          </div>

          <Button type="submit" loading={loading} fullWidth size="lg">
            {loading ? 'Scheduling...' : 'Schedule Secure Room'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default CreateClass;
