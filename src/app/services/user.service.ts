import {Injectable, NgZone} from '@angular/core';
import {Router} from '@angular/router';

import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import { auth } from 'firebase/app';
import {User} from '../models/user';
import {environment} from '../../environments/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  userData: any; // Save logged in user data
  user: any = {};
  result: any = {};

  // tslint:disable-next-line:variable-name
  url_receiver: any;

  constructor(
      public http: HttpClient,
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
          console.log(result.user);
          console.log(this.user);
          this.ngZone.run(() => {
            this.router.navigate(['/profile']);
          });
          this.SetUserData(result.user, environment.relUrl).then(r => console.log(r));
        }).catch((error) => {
          window.alert(error);
        });
  }


  postFormToken(user, relUrl) {
    return new Promise((resolve, reject) => {
      this.url_receiver = relUrl;
      const headers = new HttpHeaders({
        Authorization: '' + user.accessToken
      });

      this.http.post(environment.domain + this.url_receiver, user, {headers})
          .subscribe(res => {
            resolve(res);
          }, (err) => {
            if (err.error.code === 'token_not_valid' && err.status === 401) {
              user.refreshToken.then(() => {
                this.postFormToken(user, this.url_receiver).then(res => {
                  resolve(res);
                  // tslint:disable-next-line:no-shadowed-variable
                }).catch((err) => {
                  reject(err);
                });
              });
            } else {
              reject(err);
            }
          });
    });
    /*'Accept': 'application/json',
      'Content-Type': 'application/json',*/
  }

  /* Setting up user data when sign in with username/password,
  sign up with username/password and sign in with social auth
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
  SetUserData(user, relUrl) {
    // const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
    return new Promise((resolve, reject) => {
      this.url_receiver = relUrl;
    /*  const userData: User = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      }; */
      const headers = new HttpHeaders();
      headers.append('Accept', 'application/json');
      headers.append('Content-Type', 'application/json' );
      const formData = new FormData();
      formData.append('user', JSON.stringify(user));

      this.http.post(environment.domain + this.url_receiver, formData, { headers }).subscribe(res => {
        resolve(res);
      }, error => {
        console.log(error);
        reject(error);
      });
    });
   /* return userRef.set(userData, {
      merge: true
    });*/
  }


  // Sign out
  signOut() {
    return this.afAuth.auth.signOut().then(() => {
      localStorage.removeItem('user');
      this.router.navigate(['/home']);
    });
  }
}
