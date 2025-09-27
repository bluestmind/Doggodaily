import { useState, useEffect, useCallback } from 'react';

// Generic hook for API calls with loading state and error handling
export const useApi = (apiFunction, dependencies = [], immediate = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      
      if (result.success) {
        setData(result.data);
        return result;
      } else {
        setError(result.message || 'API call failed');
        return result;
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
};

// Hook for paginated API calls
export const usePaginatedApi = (apiFunction, initialParams = {}) => {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const fetchData = useCallback(async (newParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const mergedParams = { ...params, ...newParams };
      const result = await apiFunction(mergedParams);
      
      if (result.success) {
        if (newParams.page > 1) {
          // Append data for pagination
          setData(prevData => [...prevData, ...result.data]);
        } else {
          // Replace data for new search/filter
          setData(result.data);
        }
        setMeta(result.meta || {});
        setParams(mergedParams);
        return result;
      } else {
        setError(result.message || 'Failed to fetch data');
        return result;
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [apiFunction, params]);

  const loadMore = () => {
    if (meta.hasNext && !loading) {
      fetchData({ page: (meta.currentPage || 1) + 1 });
    }
  };

  const refresh = () => {
    fetchData({ page: 1 });
  };

  const updateParams = (newParams) => {
    fetchData({ ...newParams, page: 1 });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    meta,
    loading,
    error,
    params,
    fetchData,
    loadMore,
    refresh,
    updateParams,
    hasMore: meta.hasNext || false
  };
};

// Hook for form submissions
export const useApiForm = (apiFunction, onSuccess = null, onError = null) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const submit = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const result = await apiFunction(formData);
      
      if (result.success) {
        setSuccess(true);
        if (onSuccess) {
          onSuccess(result);
        }
        return result;
      } else {
        setError(result.message || 'Form submission failed');
        if (onError) {
          onError(result);
        }
        return result;
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      if (onError) {
        onError({ success: false, message: errorMessage });
      }
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(false);
    setLoading(false);
  };

  return {
    loading,
    error,
    success,
    submit,
    reset
  };
};

// Hook for file uploads with progress
export const useFileUpload = (uploadFunction, onSuccess = null, onError = null) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const upload = async (file, metadata = {}) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setProgress(0);

      const result = await uploadFunction(file, metadata, (progressPercent) => {
        setProgress(progressPercent);
      });
      
      if (result.success) {
        setSuccess(true);
        if (onSuccess) {
          onSuccess(result);
        }
        return result;
      } else {
        setError(result.message || 'Upload failed');
        if (onError) {
          onError(result);
        }
        return result;
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      if (onError) {
        onError({ success: false, message: errorMessage });
      }
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(false);
    setLoading(false);
    setProgress(0);
  };

  return {
    loading,
    progress,
    error,
    success,
    upload,
    reset
  };
}; 