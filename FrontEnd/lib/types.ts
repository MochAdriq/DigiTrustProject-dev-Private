export interface Account {
  id: string;
  email: string;
  password: string;
  type: "private" | "sharing";
  profiles: Profile[];
  createdAt: string;
}

export interface Profile {
  profile: string;
  pin: string;
}

export interface Administrator {
  id: string;
  username: string;
  password: string;
  name: string;
  role: "admin" | "superadmin";
}

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: "admin" | "operator";
  createdAt: string;
}
