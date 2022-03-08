import * as React from 'react'
import { useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks'
import { removeStream, setLocalStream } from '../slices/boardSlice'
import { RootState } from '../store'

function VideoChat() {
    const [startAvailable, setStart] = useState(true)
    const [callAvailable, setCall] = useState(false)
    const [hangupAvailable, setHangup] = useState(false)
    const state = useAppSelector((state: RootState) => state)
    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)

    // check dstance between players
    React.useEffect(() => {
        const distance =
            Math.abs(state.remotePlayerPosition[0] - state.playerPosition[0]) +
            Math.abs(state.remotePlayerPosition[1] - state.playerPosition[1])

        console.log('la distance = ', distance)
        if (state.remotePlayerStream === null || distance > 5) {
            remoteVideoRef.current.srcObject = null
        }
        if (distance <= 5 && distance >= 2) {
            // check if there are already in a call
            if (remoteVideoRef.current.srcObject === null) {
                console.log('Caling...')
                // check if the stream is starting
                if (state.localPlayerStream === null) {
                    window.alert(
                        'You should click in start to activate your camera and make a call  !'
                    )
                } else {
                    call()
                }
            } else {
                console.log('Already in call !!')
            }
        }
        setStart(true)
    }, [
        state.remotePlayerStream,
        state.playerPosition,
        state.remotePlayerPosition,
        state.localPlayerStream,
    ])

    const start = () => {
        setStart(!startAvailable)
        setCall(true)
        navigator.mediaDevices
            .getUserMedia({
                audio: true,
                video: true,
            })
            .then(gotStream)
            .catch((e) => {
                console.log(e)
                alert('getUserMedia() error:' + e.name)
            })
    }

    const dispatch = useAppDispatch()
    const gotStream = (stream: MediaProvider) => {
        localVideoRef.current.srcObject = stream // on injecte le flux vidéo local dans l'element video qui a pour ref 'localVideoRef'
        dispatch(setLocalStream(stream)) // sera utile plus tard pour avoir accès au flux dans le middleware
        console.log('starting.. : ')
    }
    const gotRemoteStream = (remoteStream: MediaProvider) => {
        const remoteVideo = remoteVideoRef.current

        if (remoteVideo.srcObject !== remoteStream) {
            remoteVideo.srcObject = remoteStream
        }
    }

    const call = () => {
        setHangup(true)
        // vous pouvez passer par un dispatch pour gérer ça dans le middlewar
        gotRemoteStream(state.remotePlayerStream)
    }
    const hangup = () => {
        console.log('hangup...')
        dispatch(removeStream(null, true))
        setHangup(false)
        setStart(true)
    }

    return (
        <div>
            <div>
                <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    style={{ backgroundColor: 'red' }}
                >
                    <track
                        kind="captions"
                        srcLang="en"
                        label="english_captions"
                    />
                </video>
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    style={{ backgroundColor: 'green' }}
                >
                    <track
                        kind="captions"
                        srcLang="en"
                        label="english_captions"
                    />
                </video>
            </div>
            <div className="flex space-x-3">
                <button onClick={start} disabled={!startAvailable}>
                    Start
                </button>
                <button onClick={call} disabled={!callAvailable}>
                    Call
                </button>
                <button onClick={hangup} disabled={!hangupAvailable}>
                    HangUp
                </button>
            </div>
        </div>
    )
}
export default VideoChat
