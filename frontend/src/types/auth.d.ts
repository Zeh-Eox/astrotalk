export interface SignupData {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  profilePicture: string;
}

export interface AuthStore {
  authUser: User | null;
  isCheckingAuth: boolean;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  socket: Socket | null;
  onlineUsers: string[];
  isUpdatingProfile: boolean;

  checkAuth: () => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
}