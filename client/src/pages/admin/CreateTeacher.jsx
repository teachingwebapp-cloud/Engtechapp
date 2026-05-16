import React, { useState } from 'react';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CreateTeacher = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
    specialization: '', 
    bio: '', 
    experience: '', 
    isAdminTeacher: false 
  });
  const [loading, setLoading] = useState(false);
  const [newTeacher, setNewTeacher] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter teacher name');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        experience: formData.experience ? parseInt(formData.experience) : 0
      };
      
      const res = await api.post('/users/teacher', payload);
      setNewTeacher(res.data.teacher);
      setIsModalOpen(true);
      toast.success(res.data.message);
      setFormData({ name: '', phone: '', email: '', specialization: '', bio: '', experience: '', isAdminTeacher: false });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create teacher');
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    const text = `Teacher ID: ${newTeacher.teacherId}\nPassword: ${newTeacher.password}`;
    navigator.clipboard.writeText(text);
    toast.success('Credentials copied to clipboard!');
  };

  return (
    <div className="animate-fade-in page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Create New Teacher Account</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Add a teacher to your platform and assign them admin privileges if needed.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="responsive-grid-1-2" style={{ marginBottom: '1.5rem', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name *</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Jane Smith"
                required
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email Address</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="e.g. jane@example.com"
              />
            </div>
          </div>
          
          <div className="responsive-grid-1-2" style={{ marginBottom: '1.5rem', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Phone Number</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="e.g. +1 555 0123"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Years of Experience</label>
              <input 
                type="number" 
                min="0"
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                placeholder="e.g. 5"
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Specialization</label>
            <input 
              type="text" 
              value={formData.specialization}
              onChange={(e) => setFormData({...formData, specialization: e.target.value})}
              placeholder="e.g. Advanced Grammar, IELTS Preparation"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Short Bio</label>
            <textarea 
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              placeholder="A brief description of the teacher's background..."
              rows={3}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)', resize: 'vertical' }}
            />
          </div>
          
          <div style={{ 
            marginBottom: '2rem', 
            padding: '1.25rem', 
            backgroundColor: 'var(--bg-color)', 
            borderRadius: '0.5rem',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem'
          }}>
            <input 
              type="checkbox" 
              id="isAdminTeacher"
              checked={formData.isAdminTeacher}
              onChange={(e) => setFormData({...formData, isAdminTeacher: e.target.checked})}
              style={{ width: '20px', height: '20px', cursor: 'pointer', marginTop: '0.2rem' }}
            />
            <div>
              <label htmlFor="isAdminTeacher" style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem', cursor: 'pointer' }}>
                Grant Admin Privileges
              </label>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                If checked, this teacher will be able to create other students, manage all classes, and access the group chat. If unchecked, they will only be able to see their own classes and students.
              </p>
            </div>
          </div>

          <Button type="submit" loading={loading} fullWidth size="lg">
            {loading ? 'Creating...' : 'Create Teacher Account'}
          </Button>
        </form>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="✅ Teacher Account Created!">
        {newTeacher && (
           <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem', textAlign: 'center' }}>
             <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgb(34, 197, 94)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
               <p style={{ color: 'rgb(34, 197, 94)', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Teacher Account Ready!</p>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>The teacher must change their password upon first login.</p>
             </div>
             
             <div style={{ backgroundColor: 'var(--surface)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', margin: '1rem 0', fontFamily: 'monospace', fontSize: '0.95rem', wordBreak: 'break-all' }}>
               <div style={{ marginBottom: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.25rem' }}>
                 <strong>Teacher ID (Login):</strong> <br/>{newTeacher.teacherId}
               </div>
               <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.25rem' }}>
                 <strong>Temporary Password:</strong> <br/>{newTeacher.password}
               </div>
             </div>

             <Button onClick={copyCredentials} variant="secondary" fullWidth style={{ marginBottom: '0.75rem' }}>
               📋 Copy Credentials
             </Button>

             <Button 
               onClick={() => { setIsModalOpen(false); navigate('/teacher/students'); }} 
               variant="primary" 
               fullWidth
             >
               View All Users
             </Button>
           </div>
        )}
      </Modal>
    </div>
  );
};

export default CreateTeacher;
