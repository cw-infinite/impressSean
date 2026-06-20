import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import { account } from "../lib/appwrite";
import { Models } from "appwrite";

interface AuthContextType {
	user: Models.User<Models.Preferences> | null;
	loading: boolean;
	error: string | null;
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		checkUserSession();
	}, []);

	const checkUserSession = async () => {
		try {
			const session = await account.get();
			setUser(session);
		} catch (err) {
			setUser(null);
		} finally {
			setLoading(false);
		}
	};

	const login = async (email: string, password: string) => {
		setLoading(true);
		setError(null);
		try {
			// Create a session with email and password
			await account.createEmailPasswordSession({ email, password });
			const userData = await account.get();
			setUser(userData);
		} catch (err: any) {
			setError(err.message || "Login failed. Please check your credentials.");
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const logout = async () => {
		try {
			await account.deleteSession("current");
			setUser(null);
		} catch (err: any) {
			setError(err.message || "Logout failed");
		}
	};

	const clearError = () => {
		setError(null);
	};

	const value: AuthContextType = {
		user,
		loading,
		error,
		login,
		logout,
		clearError,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
