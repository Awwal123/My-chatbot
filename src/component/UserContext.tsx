import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define the User interface with required properties
export interface User {
  email: string;
  fullName: string;
  token: string; // Ensure this matches what is being set in the SignUp component
}

// Define the context type for user state management
interface UserContextType {
  user: User | null; // User can be null if not logged in
  setUser: React.Dispatch<React.SetStateAction<User | null>>; // Function to update user
  logout: () => void; // Function to handle logout
}

// Create the context, initializing with undefined
const UserContext = createContext<UserContextType | undefined>(undefined);

// Define the props for UserProvider component
interface UserProviderProps {
  children: ReactNode; // Children nodes passed to the provider
}

// UserProvider component to provide user context to its children
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); // Initialize user state

  useEffect(() => {
    // Load user data from local storage on mount
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      // Ensure the parsedUser has the token property
      setUser({ ...parsedUser, token: storedToken }); 
    }
  }, []);

  const logout = () => {
    // Clear user data from state and local storage
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token"); // Clear token as well
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
