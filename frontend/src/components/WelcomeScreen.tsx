import React, { useEffect } from 'react'
import './WelcomeScreen.css'

interface WelcomeScreenProps {
  message: string
  duration?: number
  onClose: () => void
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  message,
  duration = 1500,
  onClose,
}) => {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [duration, onClose])

    return (
        <div className="welcome-screen">
            <div className="welcome-screen__overlay" />
            <div className="welcome-screen__blur" />
            <div className="welcome-screen__content">
                {message}
            </div>
        </div>
    )
}

export default WelcomeScreen
