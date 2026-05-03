import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import JitsiClassRoom from './pages/JitsiClassRoom';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CreateStudent from './pages/teacher/CreateStudent';
import CreateClass from './pages/teacher/CreateClass';
import ManageClasses from './pages/teacher/ManageClasses';
import EnrollStudents from './pages/teacher/EnrollStudents';
import UsersManagement from './pages/admin/UsersManagement';
import ActivityLogs from './pages/teacher/ActivityLogs';
import StudentCredentials from './pages/teacher/StudentCredentials';
import StudentDashboard from './pages/student/StudentDashboard';
import MyClasses from './pages/student/MyClasses';
import MyActivityLogs from './pages/student/MyActivityLogs';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Toaster position="top-right" />
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ChangePassword />
            </ProtectedRoute>
          } />
          
          {/* Live Video Room */}
          <Route path="/jitsi/:id" element={
            <ProtectedRoute allowedRoles={['admin', 'student']}>
              <JitsiClassRoom />
            </ProtectedRoute>
          } />

          {/* Teacher/Platform Admin Routes */}
          <Route path="/teacher" element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="students" element={<UsersManagement />} />
              <Route path="credentials" element={<StudentCredentials />} />
              <Route path="activity-logs" element={<ActivityLogs />} />
              <Route path="create-student" element={<CreateStudent />} />
              <Route path="create-class" element={<CreateClass />} />
              <Route path="manage-classes" element={<ManageClasses />} />
              <Route path="enroll-students" element={<EnrollStudents />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="my-classes" element={<MyClasses />} />
              <Route path="my-activity" element={<MyActivityLogs />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
          </Route>

          {/* Default Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
