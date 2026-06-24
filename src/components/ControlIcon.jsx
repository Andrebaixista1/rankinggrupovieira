export default function ControlIcon({ type }) {
  if (type === 'prev') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15.5 5.5 9 12l6.5 6.5-1.4 1.4L6.2 12l7.9-7.9 1.4 1.4z" />
      </svg>
    )
  }
  if (type === 'pause') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 5h3v14H7V5zm7 0h3v14h-3V5z" />
      </svg>
    )
  }
  if (type === 'play') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 5.5v13l11-6.5-11-6.5z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8.5 5.5 1.4-1.4L17.8 12l-7.9 7.9-1.4-1.4L14.5 12 8.5 5.5z" />
    </svg>
  )
}
