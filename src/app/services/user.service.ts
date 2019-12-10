import {Injectable, NgZone} from '@angular/core';
import {Router} from '@angular/router';

import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import { auth } from 'firebase/app';
import {User} from '../models/user';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  userData: any; // Save logged in user data
  user: any = {};
  constructor(
      public afs: AngularFirestore,   // Inject Firestore service
      public afAuth: AngularFireAuth, // Inject Firebase auth service
      public router: Router,
      public ngZone: NgZone // NgZone service to remove outside scope warning
  ) {
    /* Saving user data in localstorage when
    logged in and setting up null when logged out */
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));
        JSON.parse(localStorage.getItem('user'));
      } else {
        localStorage.setItem('user', null);
        JSON.parse(localStorage.getItem('user'));
      }
    });
  }

  // Sign in with Google
  FacebookAuth() {
    return this.AuthLogin(new auth.FacebookAuthProvider());
  }

  // Auth logic to run auth providers
  AuthLogin(provider) {
    return this.afAuth.auth.signInWithPopup(provider)
        .then((result) => {
          this.user = {
            uid: result.user.uid,
            phoneNumber: result.user.phoneNumber,
            photoURL: result.user.photoURL,
            isAnonymous: result.user.isAnonymous,
            email: result.user.email,
            displayName: result.user.displayName,
            emailVerified: result.user.emailVerified,
            refreshToken: result.user.refreshToken
          };
          console.log(this.user);
          this.ngZone.run(() => {
            this.router.navigate(['/profile']);
          });
          this.SetUserData(result.user);
        }).catch((error) => {
          window.alert(error);
        });
  }

  /* Setting up user data when sign in with username/password,
  sign up with username/password and sign in with social auth
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
  SetUserData(user) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    };
    return userRef.set(userData, {
      merge: true
    });
  }

  // Sign out
  signOut() {
    return this.afAuth.auth.signOut().then(() => {
      localStorage.removeItem('user');
      this.router.navigate(['/home']);
    });
  }
}
