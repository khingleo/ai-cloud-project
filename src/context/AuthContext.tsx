import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export type AccessTier = 'super_admin' | 'admin' | 'staff';

export interface AuthenticatedUser {
	id: string;
	name: string;
	email: string;
	accessTier: AccessTier;
	department: string;
	phone: string;
	avatar?: string;
	createdAt?: string;
}

export type PermissionAction =
	| 'view'
	| 'add'
	| 'edit'
	| 'delete'
	| 'export'
	| 'import'
	| 'manage_users'
	| 'manage_settings'
	| 'view_reports'
	| 'approve';

const PERMISSION_MATRIX: Record<AccessTier, Set<PermissionAction>> = {
	super_admin: new Set([
		'view', 'add', 'edit', 'delete', 'export', 'import',
		'manage_users', 'manage_settings', 'view_reports', 'approve',
	]),
	admin: new Set([
		'view', 'add', 'edit', 'delete', 'export', 'import', 'view_reports', 'approve',
	]),
	staff: new Set(['view', 'add', 'delete', 'import', 'export', 'view_reports']),
};

export interface SendOtpResult {
	success: boolean;
	code: string;
	error?: string;
	message?: string;
	smtpWarning?: boolean;
}

interface AuthContextType {
	user: AuthenticatedUser | null;
	isAuthenticated: boolean;
	hasPermission: (action: PermissionAction) => boolean;
	isAtLeast: (tier: AccessTier) => boolean;
	sendLoginOtp: (email: string) => Promise<SendOtpResult>;
	verifyLoginOtp: (email: string, code: string) => Promise<string | null>;
	sendSignupOtp: (data: SignupOtpRequest) => Promise<SendOtpResult>;
	verifySignupOtp: (data: {
		name: string;
		email: string;
		code: string;
		role?: AccessTier;
		department?: string;
		phone?: string;
	}) => Promise<string | null>;
	updateUserAccessTier: (emailOrId: string, newTier: AccessTier) => Promise<void>;
	deleteRegisteredUser: (emailOrId: string) => Promise<boolean>;
	allRegisteredUsers: AuthenticatedUser[];
	logout: () => void;
	tierLabel: string;
}

interface SignupOtpRequest {
	name: string;
	email: string;
	department?: string;
	phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TIER_HIERARCHY: AccessTier[] = ['staff', 'admin', 'super_admin'];
const TIER_LABELS: Record<AccessTier, string> = {
	super_admin: 'Super Admin',
	admin: 'Admin',
	staff: 'Staff',
};

function toAuthenticatedUser(authUser: {
	id: string;
	email?: string;
	user_metadata?: Record<string, unknown>;
}, profile?: Record<string, unknown> | null): AuthenticatedUser {
	const email = String(profile?.email || authUser.email || '').toLowerCase();
	const nameFromMetadata = String(authUser.user_metadata?.full_name || authUser.user_metadata?.name || '');
	return {
		id: authUser.id,
		name: String(profile?.name || nameFromMetadata || email.split('@')[0] || 'Enterprise Member'),
		email,
		accessTier: (profile?.access_tier || profile?.role || 'staff') as AccessTier,
		department: String(profile?.department || 'Enterprise Business Unit'),
		phone: String(profile?.phone || ''),
		avatar: String(profile?.avatar || authUser.user_metadata?.avatar_url || ''),
		createdAt: String(profile?.created_at || ''),
	};
}

async function loadOrCreateProfile(authUser: {
	id: string;
	email?: string;
	user_metadata?: Record<string, unknown>;
}, signupDetails?: { department?: string; phone?: string }): Promise<AuthenticatedUser> {
	const email = String(authUser.email || '').toLowerCase();
	let profile: Record<string, unknown> | null = null;
	try {
		const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
		profile = data;
	} catch (error) {
		console.warn('Supabase profile read failed:', error);
	}

	if (!profile) {
		const newProfile = {
			id: authUser.id,
			email,
			name: String(authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split('@')[0]),
			access_tier: 'staff',
			role: 'staff',
			department: signupDetails?.department || String(authUser.user_metadata?.department || 'Enterprise Business Unit'),
			phone: signupDetails?.phone || String(authUser.user_metadata?.phone || ''),
			created_at: new Date().toISOString(),
		};
		try {
			const { data, error } = await supabase.from('profiles').upsert(newProfile, { onConflict: 'id' }).select('*').single();
			if (!error) profile = data;
			else console.warn('Supabase profile creation failed:', error.message);
		} catch (error) {
			console.warn('Supabase profile creation failed:', error);
		}
	}

	return toAuthenticatedUser(authUser, profile);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<AuthenticatedUser | null>(null);
	const [registeredUsers, setRegisteredUsers] = useState<AuthenticatedUser[]>([]);
	const pendingSignupOtp = useRef(false);

	useEffect(() => {
		let active = true;
		void supabase.auth.getSession().then(async ({ data, error }) => {
			if (error || !data.session?.user) return;
			const currentUser = await loadOrCreateProfile(data.session.user);
			if (active) setUser(currentUser);
		});

		const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
			if (event === 'SIGNED_OUT') {
				setUser(null);
				setRegisteredUsers([]);
				return;
			}
			if (event === 'SIGNED_IN' && session?.user && !pendingSignupOtp.current) {
				void loadOrCreateProfile(session.user).then(setUser);
			}
		});

		return () => {
			active = false;
			subscription.unsubscribe();
		};
	}, []);

	useEffect(() => {
		if (!user || user.accessTier === 'staff') return;
		let active = true;
		void supabase.from('profiles').select('*').then(({ data, error }) => {
			if (active) setRegisteredUsers(error || !data ? [] : data.map((row) => toAuthenticatedUser(row, row)));
		});
		return () => { active = false; };
	}, [user]);

	const isAuthenticated = user !== null;
	const hasPermission = useCallback((action: PermissionAction) => {
		return user ? PERMISSION_MATRIX[user.accessTier]?.has(action) ?? false : false;
	}, [user]);
	const isAtLeast = useCallback((tier: AccessTier) => {
		if (!user) return false;
		return TIER_HIERARCHY.indexOf(user.accessTier) >= TIER_HIERARCHY.indexOf(tier);
	}, [user]);

	const sendLoginOtp = useCallback(async (email: string): Promise<SendOtpResult> => {
		const normalizedEmail = email.trim().toLowerCase();
		const { error } = await supabase.auth.signInWithOtp({
			email: normalizedEmail,
			options: { shouldCreateUser: false },
		});
		if (error) return { success: false, code: '', error: error.message || 'Failed to send verification code.' };
		return { success: true, code: '', message: `A verification code was sent to ${normalizedEmail}.` };
	}, []);

	const sendSignupOtp = useCallback(async (data: SignupOtpRequest): Promise<SendOtpResult> => {
		const email = data.email.trim().toLowerCase();
		pendingSignupOtp.current = true;
		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: {
				shouldCreateUser: true,
				data: {
					full_name: data.name.trim(),
					department: data.department || 'Enterprise Business Unit',
					phone: data.phone || '',
				},
			},
		});
		if (error) {
			pendingSignupOtp.current = false;
			return { success: false, code: '', error: error.message || 'Failed to send verification code.' };
		}
		return { success: true, code: '', message: `A verification code was sent to ${email}.` };
	}, []);

	const verifyLoginOtp = useCallback(async (email: string, code: string): Promise<string | null> => {
		const { data, error } = await supabase.auth.verifyOtp({
			email: email.trim().toLowerCase(),
			token: code.trim(),
			type: 'email',
		});
		if (error || !data.user) return error?.message || 'Invalid or expired verification code.';
		const authenticatedUser = await loadOrCreateProfile(data.user);
		setUser(authenticatedUser);
		return null;
	}, []);

	const verifySignupOtp = useCallback(async (data: {
		name: string;
		email: string;
		code: string;
		role?: AccessTier;
		department?: string;
		phone?: string;
	}): Promise<string | null> => {
		const { data: verifiedData, error } = await supabase.auth.verifyOtp({
			email: data.email.trim().toLowerCase(),
			token: data.code.trim(),
			type: 'email',
		});
		if (error || !verifiedData.user) return error?.message || 'Invalid or expired verification code.';
		const authenticatedUser = await loadOrCreateProfile(verifiedData.user, data);
		pendingSignupOtp.current = false;
		setUser(authenticatedUser);
		return null;
	}, []);

	const updateUserAccessTier = useCallback(async (emailOrId: string, newTier: AccessTier) => {
		let query = supabase.from('profiles').update({ access_tier: newTier, role: newTier, updated_at: new Date().toISOString() });
		query = /^[0-9a-f-]{36}$/i.test(emailOrId) ? query.eq('id', emailOrId) : query.eq('email', emailOrId.trim().toLowerCase());
		const { data, error } = await query.select('*').single();
		if (error) throw new Error(error.message);
		const updatedUser = toAuthenticatedUser(data, data);
		setRegisteredUsers((current) => current.map((registered) => registered.id === updatedUser.id ? updatedUser : registered));
		setUser((current) => current?.id === updatedUser.id ? updatedUser : current);
	}, []);

	const deleteRegisteredUser = useCallback(async (emailOrId: string): Promise<boolean> => {
		let query = supabase.from('profiles').delete();
		query = /^[0-9a-f-]{36}$/i.test(emailOrId) ? query.eq('id', emailOrId) : query.eq('email', emailOrId.trim().toLowerCase());
		const { error } = await query;
		if (error) throw new Error(error.message);
		setRegisteredUsers((current) => current.filter((registered) =>
			registered.id.toLowerCase() !== emailOrId.toLowerCase() && registered.email.toLowerCase() !== emailOrId.toLowerCase()
		));
		return true;
	}, []);

	const logout = useCallback(() => {
		pendingSignupOtp.current = false;
		setUser(null);
		setRegisteredUsers([]);
		void supabase.auth.signOut();
	}, []);

	const tierLabel = user ? TIER_LABELS[user.accessTier] : '';

	return (
		<AuthContext.Provider value={{
			user,
			isAuthenticated,
			hasPermission,
			isAtLeast,
			sendLoginOtp,
			verifyLoginOtp,
			sendSignupOtp,
			verifySignupOtp,
			updateUserAccessTier,
			deleteRegisteredUser,
			allRegisteredUsers: registeredUsers,
			logout,
			tierLabel,
		}}>
			{children}
		</AuthContext.Provider>
	);
};

// oxlint-disable-next-line react/only-export-components
export function useAuth(): AuthContextType {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used within an AuthProvider');
	return context;
}
