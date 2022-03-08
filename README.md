# WebRTC app 

## Build

`yarn install` Install Dependecies

`yarn build` build project.

`yarn start` run the node server.

`yarn dev` run app with dev mode .

## Sharing the position of the same player

In this part, you must open the 2 browsers before choosing or moving an avatar.

## WebRTC and video

for this part, we did two methods:

- initially by buttons to trigger a call:
 you can click on start in the 2 browsers to add the local and the remote stream in the store, and then make a call for each player to trigger the call. You can click hangup to remove the stream with (peer.removeStream) method

- Trigger the call according to the distance:
to test this method, you have to launch 2 browsers and choose an avatar and move them. you can notice that if the 2 players are within 5 squares of each other that we have not already made a start that an alert will be triggered saying that we must make a start to see the other player.
By clicking on start for each player and moving a player within 5 squares of the other, you can see that the call is triggered and the 2 characters look at each other, and by moving away the call is cut.
