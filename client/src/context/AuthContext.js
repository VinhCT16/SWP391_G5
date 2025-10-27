import React, { createContext, useContext, useState, useEffect } from 'react';

// Create AuthContext
const AuthContext = createContext();

// AuthProvider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock user data for development
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '0123456789',
    role: 'customer', // 'customer', 'staff', 'admin'
    avatar: null
  };

  // Mock staff user
  const mockStaffUser = {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '0987654321',
    role: 'staff',
    avatar: null
  };

  // Initialize auth state
  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // });
      // const data = await response.json();
      
      // Mock login for development
      let userData;
      if (email.includes('staff')) {
        userData = mockStaffUser;
      } else {
        userData = mockUser;
      }
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(userData)
      // });
      // const data = await response.json();
      
      // Mock registration for development
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        role: 'customer'
      };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch('/api/auth/profile', {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(profileData)
      // });
      // const data = await response.json();
      
      // Mock profile update for development
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch('/api/auth/change-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(passwordData)
      // });
      // const data = await response.json();
      
      // Mock password change for development
      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
