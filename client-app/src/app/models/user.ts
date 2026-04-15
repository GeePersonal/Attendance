export interface User {
    displayName: string;
    token: string;
    username: string;
    email: string;
    profileImageUrl: string;
    roles?: string[] 
}

export interface UserSignInForm {
    email: string;
    password: string;
    }

export interface UserSignUpForm {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}