const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Callable function to set a custom role on a user.
exports.setUserRole = functions.https.onCall((data, context) => {
  // Security: Only allow an already-admin user to assign roles.
  if (!(context.auth && context.auth.token && context.auth.token.admin)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can assign roles.'
    );
  }

  const uid = data.uid;
  const role = data.role; // expected "student" or "counselor"

  // Set the custom claim on the user
  return admin
    .auth()
    .setCustomUserClaims(uid, { role })
    .then(() => {
      return { message: `Success! ${uid} is now set as ${role}.` };
    })
    .catch(error => {
      throw new functions.https.HttpsError('unknown', error.message, error);
    });
});
