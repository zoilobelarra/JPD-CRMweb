export default function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <span className="modal-title">🗑️ Confirmar eliminación</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="confirm-text">{message || '¿Estás seguro de que deseas eliminar este registro?'}</p>
          <p className="confirm-warning">Esta acción no se puede deshacer.</p>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-danger" style={{ background: 'var(--danger-muted)', border: '1px solid var(--danger)' }} onClick={onConfirm}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
