import { useState, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

export const useTeacherPermissions = (classId) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get(`/permissions/requests/${classId}`);
      setPendingRequests(res.data.grouped.pending);
      setApprovedRequests(res.data.grouped.approved);
      return res.data;
    } catch (error) {
      console.error('Error fetching requests:', error);
      return null;
    }
  }, [classId]);

  const approveRequest = useCallback(async (requestId, visibility = 'individual') => {
    setLoading(true);
    try {
      const res = await api.patch(`/permissions/requests/${requestId}/approve`, { visibility });
      toast.success(res.data.message);
      fetchRequests();
      return res.data.request;
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to approve request';
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchRequests]);

  const denyRequest = useCallback(async (requestId, reason = '') => {
    setLoading(true);
    try {
      const res = await api.patch(`/permissions/requests/${requestId}/deny`, { reason });
      toast.success(res.data.message);
      fetchRequests();
      return res.data.request;
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to deny request';
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchRequests]);

  const revokePermission = useCallback(async (requestId) => {
    setLoading(true);
    try {
      const res = await api.patch(`/permissions/requests/${requestId}/revoke`);
      toast.success(res.data.message);
      fetchRequests();
      return res.data.request;
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to revoke permission';
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchRequests]);

  return {
    pendingRequests,
    approvedRequests,
    loading,
    fetchRequests,
    approveRequest,
    denyRequest,
    revokePermission
  };
};

export default useTeacherPermissions;
