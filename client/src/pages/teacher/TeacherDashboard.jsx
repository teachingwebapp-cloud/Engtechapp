import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/ui/StatCard';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import {
  Users,
  Video,
  PlusCircle,
  Calendar,
  Clock,
  ArrowRight,
  UserPlus,
  BookOpen,
  Activity
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    upcomingClasses: 0,
    completedClasses: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [classRes, userRes] = await Promise.all([
          api.get('/classes'),
          api.get('/users?role=student')
        ]);
        
        const allClasses = classRes.data.classes || [];
        setClasses(allClasses.filter(c => c.status !== 'completed'));
        
        setStats({
          totalStudents: userRes.data.users?.length || 0,
          upcomingClasses: allClasses.filter(c => c.status === 'scheduled').length,
          completedClasses: allClasses.filter(c => c.status === 'completed').length
        });
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--primary-faint)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: '1200px', margin: '0 auto' }}
    >
      <div className="page-header">
        <div>
          <h1 style={{ 
            fontSize: 'clamp(1.5rem, 5vw, 2.25rem)', 
            fontWeight: 800, 
            color: 'var(--text-main)', 
            margin: '0 0 0.5rem 0', 
            letterSpacing: '-1px' 
          }}>
            Hello, {user.name.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>
            Here's what's happening with your classes today.
          </p>
        </div>
        <div className="page-header-actions">
          <Button variant="outline" onClick={() => navigate('/teacher/create-student')} icon={<UserPlus size={18} />}>
            Add Student
          </Button>
          <Button onClick={() => navigate('/teacher/create-class')} icon={<PlusCircle size={18} />}>
            New Class
          </Button>
        </div>
      </div>

      <motion.div variants={itemVariants} className="stats-grid">
        <StatCard 
          title="Active Students" 
          value={stats.totalStudents} 
          icon={<Users size={24} color="var(--primary)" />} 
          trend={{ value: '+12%', isUp: true }}
        />
        <StatCard 
          title="Upcoming Classes" 
          value={stats.upcomingClasses} 
          icon={<Calendar size={24} color="var(--warning)" />} 
        />
        <StatCard 
          title="Sessions Completed" 
          value={stats.completedClasses} 
          icon={<BookOpen size={24} color="var(--success)" />} 
        />
      </motion.div>

      <motion.div variants={itemVariants} className="responsive-grid-2-1">
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Upcoming Schedule
            </h2>
            <Link to="/teacher/manage-classes" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontSize: '0.875rem', 
              fontWeight: 600,
              color: 'var(--primary)',
              textDecoration: 'none',
              whiteSpace: 'nowrap'
            }}>
              View Full Calendar <ArrowRight size={16} />
            </Link>
          </div>
          
          <div style={{ 
            backgroundColor: 'var(--surface)', 
            borderRadius: '1.25rem', 
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}>
            <Table 
              headers={['Class Details', 'Date & Time', 'Status', 'Actions']}
              data={classes.slice(0, 5)}
              emptyMessage="No upcoming classes scheduled. Start by creating one!"
              renderRow={(cls) => (
                <>
                  <td data-label="Class" style={{ padding: '1.25rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{cls.title}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>
                      {cls.description ? cls.description.substring(0, 40) + '...' : 'No description'}
                    </div>
                  </td>
                  <td data-label="Schedule" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <Clock size={14} />
                      {new Date(cls.schedule).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginLeft: '1.375rem' }}>
                      {new Date(cls.schedule).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td data-label="Status" style={{ padding: '1.25rem' }}>
                    <Badge variant={cls.status === 'scheduled' ? 'primary' : 'success'}>
                      {cls.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <Button 
                      size="sm" 
                      onClick={() => navigate(`/jitsi/${cls._id}`)}
                      variant={cls.status === 'live' ? 'success' : 'primary'}
                    >
                      {cls.status === 'live' ? 'Join Now' : 'Start Class'}
                    </Button>
                  </td>
                </>
              )}
            />
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.5rem' }}>
            Platform Overview
          </h2>
          <div style={{ 
            backgroundColor: 'var(--surface)', 
            padding: '1.5rem', 
            borderRadius: '1.25rem', 
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-color)',
            height: '350px'
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Mon', students: 12 },
                  { name: 'Tue', students: 19 },
                  { name: 'Wed', students: 15 },
                  { name: 'Thu', students: 22 },
                  { name: 'Fri', students: 28 },
                  { name: 'Sat', students: 10 }
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: 'var(--primary-faint)' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--surface)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    boxShadow: 'var(--shadow-md)'
                  }}
                  itemStyle={{ color: 'var(--text-main)', fontWeight: 600 }}
                />
                <Bar 
                  dataKey="students" 
                  fill="var(--primary)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TeacherDashboard;
