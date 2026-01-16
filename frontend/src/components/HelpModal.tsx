import React from 'react'
import 'github-markdown-css/github-markdown.css'
import { useBlockSpotlight } from '../context/MousePositionContext'
import './HelpModal.css'
import { marked } from "marked";

interface HelpModalProps {
  title: string
  onClose: () => void
  isLoading?: boolean
}

const HelpModal: React.FC<HelpModalProps> = ({
  title,
  onClose,
  isLoading = false,
}) => {

  const helpContentRef = React.useRef<HTMLDivElement>(null);
    
  const loadHelp = async () => {
    const response = await fetch("/help.md");
    const mdText = await response.text();
    const html = await marked.parse(mdText);
 
    if (helpContentRef.current) {
        helpContentRef.current.innerHTML = html;
    }
  }

  loadHelp()
  useBlockSpotlight(true)

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) onClose()
  }

  return (
    <div className="help-modal-overlay" onClick={handleOverlayClick}>
      <div className="help-modal" role="dialog" aria-modal="true" aria-label="Löschen bestätigen">
        <div className="help-modal-header">
          <h2 className="help-modal-title">Hilfe</h2>
          <button
            className="help-modal-close"
            onClick={onClose}
            aria-label="Schließen"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <div className="help-modal-body">
            <div className="markdown-body" ref={helpContentRef}>

            </div>
        </div>
      </div>
    </div>
  )
}

export default HelpModal