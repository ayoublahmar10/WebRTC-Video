import {
    AnyAction,
    configureStore,
    Dispatch,
    Middleware,
} from '@reduxjs/toolkit'
import { logger } from 'redux-logger'
import SimplePeer from 'simple-peer'
import boardReducer, {
    setAvatar,
    moveRemotePlayer,
    setRemoteStream,
    removeStream,
} from '../slices/boardSlice'
import * as io from 'socket.io-client'

const socket = io.connect()
let peerId = ''
const peers: any = []

socket.on('peer', (data) => {
    peerId = data.peerId
    console.log('new peer added', data)
    const peer: SimplePeer.Instance = new SimplePeer({
        initiator: data.initiator,
        trickle: true, // useTrickle doit être a true pour que le peer persiste
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                {
                    urls: 'stun:global.stun.twilio.com:3478?transport=udp',
                },
            ],
        },
    })

    socket.on('signal', function (data) {
        console.log('received signal on socket')
        // propagate signal from peer to socket
        peer.signal(data.signal)
    })

    peer.on('signal', function (data) {
        console.log('Advertising signaling data', data, 'to Peer ID:', peerId)
        socket.emit('signal', {
            signal: data,
            peerId: peerId,
        })
    })

    peer.on('connect', function () {
        console.log('Peer connection established')
        peer.send('hello')
        // vous pouvez essayer d'envoyer des donnees au pair avec send("hello") pour voir si ça marche
    })
    peer.on('error', function (e) {
        console.log('Error sending connection to peer :' + peerId + e)
    })
    peer.on('data', function (data) {
        console.log('Received data from peer:' + data)
        // les donnees arrivent sous forme de string,
        // si le string est un objet JSON serialise avec JSON.stringify(objet)
        // JSON.parse(string) permet de reconstruire l'objet
        const restructuredData = JSON.parse(data)
        switch (restructuredData.type) {
            case 'board/setAvatar':
                store.dispatch(
                    setAvatar([restructuredData.payload[0], 'remote'], false)
                )
                break
            case 'board/movePlayer':
                store.dispatch(
                    moveRemotePlayer(
                        [
                            restructuredData.payload[0],
                            restructuredData.payload[1],
                        ],
                        false
                    )
                )
                break
            case 'board/removeStream':
                console.log('i in on data..')
                store.dispatch(removeStream(null, false))
                break
        }

        // TODO take action after receiving data from peer
    })
    peer.on('stream', (stream): void => {
        store.dispatch(setRemoteStream(stream))
    })
    // ajouter ce peer à une liste de tous les pairs auxquels vous êtes connecté
    peers[peerId] = peer
})

export const propagateSocketMiddleware: Middleware<Dispatch> =
    () => (next) => (action: AnyAction) => {
        // Explorez la structure de l'objet action :
        console.log('propagateSocketMiddleware', action)
        if (peers[peerId] && action.meta && action.meta.propagate) {
            peers[peerId].send(
                JSON.stringify({
                    type: action.type,
                    payload: action.payload,
                })
            )

            // Après diffusion au serveur on fait suivre l'action au prochain middleware
        }
        // <- add streams to peer dynamically
        if (action.type === 'board/setLocalStream') {
            peers[peerId].addStream(action.payload)
        }
        if (action.type === 'board/removeStream') {
            peers[peerId].removeStream(store.getState().localPlayerStream)
        }
        next(action)
    }

export const store = configureStore({
    reducer: boardReducer,
    middleware: [logger, propagateSocketMiddleware],
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
