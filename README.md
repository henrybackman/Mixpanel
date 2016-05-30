Update scripts for Mixpanel
------------------------------


importUsers.js will update & add all the active users from the User collection. 
Invitation information will be stored as false, and will need to be updated with another script.

updateUserInvitationData.js will go through invitations and update the invitation properties of recipients. Properties can change only one way, everything was initialised as false and if any invitation property matches it will be update to true while keeping else as they are. This is because one user might have multiple invitations.