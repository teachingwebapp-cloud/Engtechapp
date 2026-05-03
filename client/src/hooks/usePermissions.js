import { useState, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

export const usePermissions = (classId) => {
  const [permissionStatus, setPermissionStatus] = useState({
    microphone: { allowed: false, visibility: null },
    camera: { allowed: false, visibility: null },
    screen: { allowed: false, visibility: null }
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async (requestType) => {
    try {
      const res = await api.get(`/permissions/status/${classId}/${requestType}`);
      setPermissionStatus(prev => ({
        ...prev,
        [requestType]: {
          allowed: res.data.allowed,
          visibility: res.data.visibility || null
        }
      }));
      return res.data.allowed;
    } catch (error) {
      console.error(`Error checking ${requestType} status:`, error);
      return false;
    }
  }, [classId]);

  const requestPermission = useCallback(async (requestType) => {
    setLoading(true);
    try {
      const res = await api.post('/permissions/request', {
        classId,
        requestType
      });
      toast.success(res.data.message);
      return res.data.request;
    } catch (error) {
      const msg = error.response?.data?.message || `Failed to request ${requestType} permission`;
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const getMyRequests = useCallback(async () => {
    try {
      const res = await api.get(`/permissions/my-requests/${classId}`);
      setRequests(res.data.requests);
      return res.data;
    } catch (error) {
      console.error('Error fetching my requests:', error);
      return null;
    }
  }, [classId]);

  return {
    permissionStatus,
    checkStatus,
    requestPermission,
    getMyRequests,
    requests,
    loading
  };
};

export default usePermissions;
