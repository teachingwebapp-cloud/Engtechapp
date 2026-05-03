import React, { useState } from 'react';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { toast } from 'react-hot-toast';

const CreateStudent = () => {
  const [formData, setFormData] = useState({ studentId: '', name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [newStudent, setNewStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter student name');
      return;
    }

    if (!formData.studentId.trim()) {
      toast.error('Please enter a student ID');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/users', formData);
      setNewStudent(res.data.student);
      setIsModalOpen(true);
      toast.success(res.data.message);
      setFormData({ studentId: '', name: '', phone: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    const text = `Student ID: ${newStudent.studentId}\nPassword: ${newStudent.password}`;
    navigator.clipboard.writeText(text);
    toast.success('Credentials copied to clipboard!');
  };

  return (
    <div className="animate-fade-in page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Create New Student Account</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Add a student to your class and get instant login credentials.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Student ID * <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>(e.g., ENG-2026-STU001)</span></label>
            <input 
              type="text" 
              value={formData.studentId}
              onChange={(e) => setFormData({...formData, studentId: e.target.value})}
              placeholder="Enter unique student ID"
              required
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name *</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. John Doe"
              required
            />
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Phone Number (Optional)</label>
            <input 
              type="tel" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="e.g. +1 555 0123"
            />
          </div>

          <Button type="submit" loading={loading} fullWidth size="lg">
            {loading ? 'Creating...' : 'Create Student Account'}
          </Button>
        </form>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="✅ Student Account Created!">
        {newStudent && (
           <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem', textAlign: 'center' }}>
             <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgb(34, 197, 94)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
               <p style={{ color: 'rgb(34, 197, 94)', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Account is ready to use!</p>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Share these credentials with the student:</p>
             </div>
             
             <div style={{ backgroundColor: 'var(--surface)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', margin: '1rem 0', fontFamily: 'monospace', fontSize: '0.95rem', wordBreak: 'break-all' }}>
               <div style={{ marginBottom: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.25rem' }}>
                 <strong>Student ID:</strong> <br/>{newStudent.studentId}
               </div>
               <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.25rem' }}>
                 <strong>Password:</strong> <br/>{newStudent.password}
               </div>
             </div>

             <Button onClick={copyCredentials} variant="secondary" fullWidth style={{ marginBottom: '0.75rem' }}>
               📋 Copy Credentials
             </Button>

             <Button 
               onClick={() => setIsModalOpen(false)} 
               variant="primary" 
               fullWidth
             >
               Create Another Student
             </Button>
           </div>
        )}
      </Modal>
    </div>
  );
};

export default CreateStudent;
