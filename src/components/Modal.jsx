export default function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-handle" />
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  )
}
