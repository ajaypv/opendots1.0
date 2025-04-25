import { signInWithGoogleAction, signInWithGitHubAction, signInWithLinkedInAction } from "@/app/actions";
import React from 'react';

export interface AuthProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  signIn: (userInfo?: { platform?: string; browser?: string; location?: string }) => Promise<any>;
  scopes: string[];
  color: string;
  background: string;
  textColor: string;
}

// Providers are defined here for easy addition of new providers
export const authProviders: Record<string, AuthProvider> = {
  google: {
    id: 'google',
    name: 'Google',
    icon: React.createElement('svg', { 
      viewBox: "0 0 24 24", 
      className: "h-5 w-5 mr-2", 
      'aria-hidden': "true" 
    }, [
      React.createElement('path', { 
        key: '1',
        d: "M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z",
        fill: "#EA4335"
      }),
      React.createElement('path', {
        key: '2',
        d: "M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z",
        fill: "#4285F4"
      }),
      React.createElement('path', {
        key: '3',
        d: "M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z",
        fill: "#FBBC05"
      }),
      React.createElement('path', {
        key: '4',
        d: "M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.25 12.0004 19.25C8.8704 19.25 6.21537 17.14 5.2654 14.295L1.27539 17.39C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z",
        fill: "#34A853"
      })
    ]),
    signIn: signInWithGoogleAction,
    scopes: ['profile', 'email'],
    color: '#4285F4',
    background: 'white',
    textColor: '#333333'
  },
  github: {
    id: 'github',
    name: 'GitHub',
    icon: React.createElement('svg', { 
      viewBox: "0 0 24 24", 
      className: "h-5 w-5 mr-2", 
      'aria-hidden': "true" 
    }, [
      React.createElement('path', {
        key: '1',
        d: "M12 2C6.48 2 2 6.48 2 12C2 16.42 4.87 20.17 8.84 21.5C9.34 21.58 9.5 21.27 9.5 21C9.5 20.77 9.5 20.14 9.5 19.31C6.73 19.91 6.14 17.97 6.14 17.97C5.68 16.81 5.03 16.5 5.03 16.5C4.12 15.88 5.1 15.9 5.1 15.9C6.1 15.97 6.63 16.93 6.63 16.93C7.5 18.45 8.97 18 9.54 17.76C9.63 17.11 9.89 16.67 10.17 16.42C7.95 16.17 5.62 15.31 5.62 11.5C5.62 10.39 6 9.5 6.65 8.79C6.55 8.54 6.2 7.5 6.75 6.15C6.75 6.15 7.59 5.88 9.5 7.17C10.29 6.95 11.15 6.84 12 6.84C12.85 6.84 13.71 6.95 14.5 7.17C16.41 5.88 17.25 6.15 17.25 6.15C17.8 7.5 17.45 8.54 17.35 8.79C18 9.5 18.38 10.39 18.38 11.5C18.38 15.32 16.04 16.16 13.81 16.41C14.17 16.72 14.5 17.33 14.5 18.26C14.5 19.6 14.5 20.68 14.5 21C14.5 21.27 14.66 21.59 15.17 21.5C19.14 20.16 22 16.42 22 12C22 6.48 17.52 2 12 2Z",
        fill: "currentColor"
      })
    ]),
    signIn: signInWithGitHubAction,
    scopes: ['user:email', 'read:user'],
    color: '#333333',
    background: 'white',
    textColor: '#333333'
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: React.createElement('svg', { 
      viewBox: "0 0 24 24", 
      className: "h-5 w-5 mr-2", 
      'aria-hidden': "true" 
    }, [
      React.createElement('path', {
        key: '1',
        d: "M19 3C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19ZM18.5 18.5V13.2C18.5 12.3354 18.1565 11.5062 17.5452 10.8948C16.9338 10.2835 16.1046 9.94 15.24 9.94C14.39 9.94 13.4 10.46 12.92 11.24V10.13H10.13V18.5H12.92V13.57C12.92 12.8 13.54 12.17 14.31 12.17C14.6813 12.17 15.0374 12.3175 15.2999 12.5801C15.5625 12.8426 15.71 13.1987 15.71 13.57V18.5H18.5ZM6.88 8.56C7.32556 8.56 7.75288 8.383 8.06794 8.06794C8.383 7.75288 8.56 7.32556 8.56 6.88C8.56 5.95 7.81 5.19 6.88 5.19C6.43178 5.19 6.00193 5.36805 5.68499 5.68499C5.36805 6.00193 5.19 6.43178 5.19 6.88C5.19 7.81 5.95 8.56 6.88 8.56ZM8.27 18.5V10.13H5.5V18.5H8.27Z",
        fill: "#0077B5"
      })
    ]),
    signIn: signInWithLinkedInAction,
    scopes: ['r_liteprofile', 'r_emailaddress'],
    color: '#0077B5',
    background: 'white',
    textColor: '#333333'
  }
};

export type ProviderId = keyof typeof authProviders;

// Convenient array of all providers
export const providers = Object.values(authProviders); 