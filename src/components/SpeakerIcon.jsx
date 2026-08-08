export default function SpeakerIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="5.2" r="3.2" />
      <path d="M12 9.4c-3.1 0-5.6 2.1-6.1 5.9-.05.4.25.75.65.75h11c.4 0 .7-.35.65-.75-.5-3.8-3-5.9-6.2-5.9z" />
      <path d="M3.2 16.6h17.6l-1.4 5.1c-.1.35-.4.6-.77.6H5.37c-.37 0-.68-.25-.77-.6l-1.4-5.1z" />
      <rect x="2" y="16.6" width="20" height="1.9" rx="0.5" />
    </svg>
  )
}
