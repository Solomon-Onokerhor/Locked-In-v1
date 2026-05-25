import React, { createContext, useContext } from 'react';

const mockContext = {
    session: { user: { id: "user_mock", email: "test@lockedin.test" } },
    profile: {
        name: "Locked in Video",
        study_buddies: 15,
        focus_score: 950,
        faculty: "FOE"
    },
    loading: false
};

const AuthContext = createContext(mockContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    return <AuthContext.Provider value={mockContext}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
